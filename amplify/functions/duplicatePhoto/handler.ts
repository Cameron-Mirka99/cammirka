import {
  CopyObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClaims, isAdmin } from "../shared/auth.js";
import { jsonResponse } from "../shared/response.js";
import {
  encodeS3Key,
  getManagedPhotoKeysFromStorageKey,
  sanitizeFolderId,
} from "../shared/photoPaths.js";
import { copyPhotoTags } from "../shared/tagMetadata.js";

const BUCKET_NAME = process.env.BUCKET_NAME;
const PHOTO_METADATA_TABLE_NAME = process.env.PHOTO_METADATA_TABLE_NAME;
const TAG_CATALOG_TABLE_NAME = process.env.TAG_CATALOG_TABLE_NAME;
const TAG_ASSIGNMENTS_TABLE_NAME = process.env.TAG_ASSIGNMENTS_TABLE_NAME;
const s3 = new S3Client({ region: process.env.AWS_REGION });

type RequestBody = {
  sourceKey?: string;
  destinationFolderId?: string;
  destinationFileName?: string;
};

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!BUCKET_NAME) {
      return jsonResponse(event, 500, { message: "BUCKET_NAME is not configured." }, "POST,OPTIONS");
    }

    const claims = getClaims(event);
    if (!isAdmin(claims)) {
      return jsonResponse(event, 403, { message: "Admin access required." }, "POST,OPTIONS");
    }

    const body = parseBody(event);
    const sourceKey = body?.sourceKey?.trim();
    const destinationFolderId = sanitizeFolderId(body?.destinationFolderId);

    if (!sourceKey || !destinationFolderId) {
      return jsonResponse(event, 400, {
        message: "sourceKey and destinationFolderId are required.",
      }, "POST,OPTIONS");
    }

    const sourcePhoto = getManagedPhotoKeysFromStorageKey(sourceKey);
    if (!sourcePhoto) {
      return jsonResponse(event, 400, { message: "Invalid sourceKey." }, "POST,OPTIONS");
    }

    const destinationFileName = body?.destinationFileName?.trim() || sourcePhoto.fileName;
    const destinationPhoto = getManagedPhotoKeysFromStorageKey(sourceKey, {
      folderId: destinationFolderId,
      fileName: destinationFileName,
    });
    if (!destinationPhoto) {
      return jsonResponse(event, 400, { message: "Could not derive destination photo keys." }, "POST,OPTIONS");
    }

    let copiedFull = false;
    let copiedThumbnail = false;

    if (sourcePhoto.isLegacy) {
      await copyObject(sourcePhoto.legacyKey, destinationPhoto.legacyKey);
      await copyPhotoTags({
        photoMetadataTableName: PHOTO_METADATA_TABLE_NAME,
        tagCatalogTableName: TAG_CATALOG_TABLE_NAME,
        tagAssignmentsTableName: TAG_ASSIGNMENTS_TABLE_NAME,
        sourcePhotoKey: sourcePhoto.canonicalKey,
        destinationPhotoKey: destinationPhoto.canonicalKey,
      });
      return jsonResponse(event, 200, {
        sourceKey,
        destinationKey: destinationPhoto.legacyKey,
        duplicatedKeys: [destinationPhoto.legacyKey],
        photoKey: destinationPhoto.canonicalKey,
      }, "POST,OPTIONS");
    }

    try {
      await copyObject(sourcePhoto.fullKey, destinationPhoto.fullKey);
      copiedFull = true;
      copiedThumbnail = await copyOptionalObject(
        sourcePhoto.thumbnailKey,
        destinationPhoto.thumbnailKey,
      );
    } catch (error) {
      await Promise.allSettled([
        copiedFull ? deleteObjectIfPresent(destinationPhoto.fullKey) : Promise.resolve(),
        copiedThumbnail ? deleteObjectIfPresent(destinationPhoto.thumbnailKey) : Promise.resolve(),
      ]);
      throw error;
    }

    await copyPhotoTags({
      photoMetadataTableName: PHOTO_METADATA_TABLE_NAME,
      tagCatalogTableName: TAG_CATALOG_TABLE_NAME,
      tagAssignmentsTableName: TAG_ASSIGNMENTS_TABLE_NAME,
      sourcePhotoKey: sourcePhoto.canonicalKey,
      destinationPhotoKey: destinationPhoto.canonicalKey,
    });

    return jsonResponse(event, 200, {
      sourceKey,
      destinationKey: destinationPhoto.fullKey,
      duplicatedKeys: [destinationPhoto.fullKey, destinationPhoto.thumbnailKey],
      photoKey: destinationPhoto.canonicalKey,
    }, "POST,OPTIONS");
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(event, 500, { message: "Failed to duplicate photo.", error: message }, "POST,OPTIONS");
  }
};

function parseBody(event: APIGatewayProxyEvent) {
  if (!event.body) return null;
  try {
    return typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  } catch {
    return null;
  }
}


async function copyObject(sourceKey: string, destinationKey: string) {
  await s3.send(
    new CopyObjectCommand({
      Bucket: BUCKET_NAME,
      Key: destinationKey,
      CopySource: `${BUCKET_NAME}/${encodeS3Key(sourceKey)}`,
    }),
  );
}

async function copyOptionalObject(sourceKey: string, destinationKey: string) {
  try {
    await copyObject(sourceKey, destinationKey);
    return true;
  } catch (error) {
    if (isMissingKeyError(error)) return false;
    throw error;
  }
}

async function deleteObjectIfPresent(key: string) {
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      }),
    );
  } catch {
    // Best-effort cleanup after partial duplicate failure.
  }
}

function isMissingKeyError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { name?: string; Code?: string };
  return candidate.name === "NoSuchKey" || candidate.Code === "NoSuchKey";
}
