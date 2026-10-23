import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { S3Event, S3Handler } from "aws-lambda";
import {
  buildFullPhotoKey,
  buildCanonicalPhotoKey,
  buildThumbnailPhotoKey,
  parseBulkStagingKey,
} from "../shared/photoPaths.js";
import { syncPhotoTags } from "../shared/tagMetadata.js";
import { createThumbnail, guessContentType, readDimensions } from "../shared/thumbnail.js";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET_NAME = process.env.BUCKET_NAME;
const PHOTO_METADATA_TABLE_NAME = process.env.PHOTO_METADATA_TABLE_NAME;
const TAG_CATALOG_TABLE_NAME = process.env.TAG_CATALOG_TABLE_NAME;
const TAG_ASSIGNMENTS_TABLE_NAME = process.env.TAG_ASSIGNMENTS_TABLE_NAME;

export const handler: S3Handler = async (event: S3Event) => {
  for (const record of event.Records) {
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

    try {
      await processOne(key);
    } catch (error) {
      // Deliberately does NOT delete the staging object on failure -- it
      // stays under bulk-incoming/ so the "stuck bulk uploads" admin view
      // surfaces it instead of the photo silently vanishing.
      console.error(`processBulkUpload: failed to process ${key}`, error);
    }
  }
};

async function processOne(key: string) {
  if (!BUCKET_NAME) throw new Error("BUCKET_NAME is not configured.");

  const parsed = parseBulkStagingKey(key);
  if (!parsed) {
    console.error(`processBulkUpload: key did not match the staging prefix: ${key}`);
    return;
  }
  const { folderId, fileName } = parsed;

  const getResult = await s3.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
  if (!getResult.Body) throw new Error("Empty object body.");
  const bytes = await getResult.Body.transformToByteArray();
  const imageBuffer = Buffer.from(bytes);

  const contentType = getResult.ContentType || guessContentType(fileName) || "application/octet-stream";
  const dimensions = await readDimensions(imageBuffer);
  const thumbnail = await createThumbnail(imageBuffer, contentType);

  const canonicalKey = buildCanonicalPhotoKey(folderId, fileName);
  const fullKey = buildFullPhotoKey(folderId, fileName);
  const thumbnailKey = buildThumbnailPhotoKey(folderId, fileName);

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fullKey,
    Body: imageBuffer,
    ContentType: contentType,
  }));
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: thumbnailKey,
    Body: thumbnail.buffer,
    ContentType: thumbnail.contentType,
  }));

  await syncPhotoTags({
    photoMetadataTableName: PHOTO_METADATA_TABLE_NAME,
    tagCatalogTableName: TAG_CATALOG_TABLE_NAME,
    tagAssignmentsTableName: TAG_ASSIGNMENTS_TABLE_NAME,
    photoKey: canonicalKey,
    tags: [],
    attributes: { ...dimensions, category: "bulk" },
  });

  // Only reached once full+thumb+metadata have all succeeded.
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
}
