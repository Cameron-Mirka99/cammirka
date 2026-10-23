import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { DeleteObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import {
  isDirectPhotoObjectKey,
  parsePhotoIdentity,
} from "../shared/photoPaths.js";
import { deletePhotoTags, getPhotoMetadataMap } from "../shared/tagMetadata.js";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const BUCKET_NAME = process.env.BUCKET_NAME;
const FOLDERS_TABLE_NAME = process.env.FOLDERS_TABLE_NAME;
const PHOTO_METADATA_TABLE_NAME = process.env.PHOTO_METADATA_TABLE_NAME;
const TAG_ASSIGNMENTS_TABLE_NAME = process.env.TAG_ASSIGNMENTS_TABLE_NAME;
const MAX_SCAN = Number.parseInt(process.env.MAX_SCAN ?? "20000", 10);

// Ships defaulted on: every real run only logs candidates, nothing is
// deleted, until this is explicitly flipped to "false" after reviewing at
// least one logged run's output in CloudWatch.
const DRY_RUN = process.env.DRY_RUN !== "false";

// Hard floor independent of whatever bulkRetentionDays an admin configured --
// protects against a fat-fingered 0/1 wiping a folder's just-uploaded bulk
// photos on the very next scheduled run.
const MIN_AGE_DAYS = 3;
const DAY_MS = 86_400_000;

type FolderItem = {
  folderId: string;
  bulkRetentionDays?: number;
};

type ListedPhoto = {
  canonicalKey: string;
  fullKey?: string;
  thumbnailKey?: string;
  legacyKey?: string;
  lastModified?: Date;
};

export const handler = async (): Promise<void> => {
  if (!BUCKET_NAME || !FOLDERS_TABLE_NAME || !PHOTO_METADATA_TABLE_NAME || !TAG_ASSIGNMENTS_TABLE_NAME) {
    console.error("retentionSweep: server configuration is incomplete, skipping run.");
    return;
  }

  const folders = await listFoldersWithRetention();
  console.log(`retentionSweep: dryRun=${DRY_RUN}, scanning ${folders.length} folder(s) with bulkRetentionDays set.`);

  let candidatesFound = 0;
  let candidatesDeleted = 0;
  let errors = 0;

  for (const folder of folders) {
    const retentionMs = Math.max(folder.bulkRetentionDays ?? 0, MIN_AGE_DAYS) * DAY_MS;

    try {
      const candidates = await listFolderPhotos(folder.folderId);
      const meta = await getPhotoMetadataMap(
        PHOTO_METADATA_TABLE_NAME,
        candidates.map((photo) => photo.canonicalKey),
      );

      const now = Date.now();
      for (const photo of candidates) {
        const photoMeta = meta.get(photo.canonicalKey);
        if (photoMeta?.category !== "bulk") continue;
        if (photoMeta.liked) continue;
        const age = now - (photo.lastModified?.getTime() ?? now);
        if (age <= retentionMs) continue;

        candidatesFound += 1;
        console.log(
          `retentionSweep: candidate folder=${folder.folderId} key=${photo.canonicalKey} ageDays=${Math.floor(age / DAY_MS)} retentionDays=${folder.bulkRetentionDays}`,
        );

        if (DRY_RUN) continue;

        try {
          await deletePhotoObjects(photo);
          await deletePhotoTags({
            photoMetadataTableName: PHOTO_METADATA_TABLE_NAME,
            tagAssignmentsTableName: TAG_ASSIGNMENTS_TABLE_NAME,
            photoKey: photo.canonicalKey,
          });
          candidatesDeleted += 1;
        } catch (error) {
          errors += 1;
          console.error(`retentionSweep: failed to delete ${photo.canonicalKey}`, error);
        }
      }
    } catch (error) {
      // Fail closed at the folder level: a metadata/listing error means
      // this folder is skipped for this run, never treated as "assume
      // unliked, delete it."
      errors += 1;
      console.error(`retentionSweep: failed to process folder ${folder.folderId}`, error);
    }
  }

  console.log(
    `retentionSweep: done. foldersScanned=${folders.length} candidatesFound=${candidatesFound} candidatesDeleted=${candidatesDeleted} errors=${errors} dryRun=${DRY_RUN}`,
  );
};

async function listFoldersWithRetention(): Promise<FolderItem[]> {
  const folders: FolderItem[] = [];
  let exclusiveStartKey: Record<string, unknown> | undefined;

  do {
    const response = await ddb.send(
      new ScanCommand({
        TableName: FOLDERS_TABLE_NAME,
        FilterExpression: "attribute_exists(bulkRetentionDays)",
        ExclusiveStartKey: exclusiveStartKey,
      }),
    );

    for (const item of (response.Items ?? []) as FolderItem[]) {
      if (typeof item.folderId === "string" && typeof item.bulkRetentionDays === "number") {
        folders.push(item);
      }
    }

    exclusiveStartKey = response.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return folders;
}

async function listFolderPhotos(folderId: string): Promise<ListedPhoto[]> {
  const candidates = new Map<string, ListedPhoto>();
  let scanned = 0;
  let continuationToken: string | undefined;

  do {
    const list = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        ContinuationToken: continuationToken,
        Prefix: `${folderId}/`,
      }),
    );

    for (const obj of list.Contents ?? []) {
      scanned++;
      if (scanned > MAX_SCAN) break;
      if (!obj.Key || obj.Size === 0) continue;
      if (!isDirectPhotoObjectKey(obj.Key, folderId)) continue;
      const identity = parsePhotoIdentity(obj.Key);
      if (!identity) continue;

      const current = candidates.get(identity.canonicalKey) ?? { canonicalKey: identity.canonicalKey };
      if (identity.variant === "full") current.fullKey = obj.Key;
      else if (identity.variant === "thumb") current.thumbnailKey = obj.Key;
      else current.legacyKey = obj.Key;
      if (obj.LastModified) current.lastModified = obj.LastModified;
      candidates.set(identity.canonicalKey, current);
    }

    if (scanned > MAX_SCAN) break;
    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (continuationToken);

  return Array.from(candidates.values());
}

async function deletePhotoObjects(photo: ListedPhoto) {
  if (photo.legacyKey && !photo.fullKey) {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: photo.legacyKey }));
    return;
  }

  if (photo.fullKey) {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: photo.fullKey }));
  }
  if (photo.thumbnailKey) {
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: photo.thumbnailKey }));
    } catch (error) {
      const candidate = error as { name?: string; Code?: string };
      if (candidate?.name !== "NoSuchKey" && candidate?.Code !== "NoSuchKey") throw error;
    }
  }
}
