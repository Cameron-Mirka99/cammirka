import {
  CopyObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  encodeS3Key,
  getManagedPhotoKeysFromStorageKey,
  sanitizeFolderId,
} from "../shared/photoPaths.js";
import { movePhotoTags } from "../shared/tagMetadata.js";

const BUCKET_NAME = process.env.BUCKET_NAME;
const PHOTO_METADATA_TABLE_NAME = process.env.PHOTO_METADATA_TABLE_NAME;
const TAG_CATALOG_TABLE_NAME = process.env.TAG_CATALOG_TABLE_NAME;
const TAG_ASSIGNMENTS_TABLE_NAME = process.env.TAG_ASSIGNMENTS_TABLE_NAME;
const s3 = new S3Client({ region: process.env.AWS_REGION });

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!BUCKET_NAME) {
      return response(500, { message: "BUCKET_NAME is not configured." });
    }

    const claims = getClaims(event);
    if (!isAdmin(claims)) {
      return response(403, { message: "Admin access required." });
    }

    const body = parseBody(event);
    const sourceKey = body?.sourceKey?.trim();
    const destinationFolderId = sanitizeFolderId(body?.destinationFolderId);

    if (!sourceKey || !destinationFolderId) {
      return response(400, {
        message: "sourceKey and destinationFolderId are required.",
      });
    }

    const sourcePhoto = getManagedPhotoKeysFromStorageKey(sourceKey);
    if (!sourcePhoto) {
      return response(400, { message: "Invalid sourceKey." });
    }

    const destinationPhoto = getManagedPhotoKeysFromStorageKey(sourceKey, {
      folderId: destinationFolderId,
    });
    if (!destinationPhoto) {
      return response(400, { message: "Could not derive destination photo keys." });
    }

    let copiedFull = false;
    let copiedThumbnail = false;

    if (sourcePhoto.isLegacy) {
      await copyObject(sourcePhoto.legacyKey, destinationPhoto.legacyKey);
      await deleteObject(sourcePhoto.legacyKey);
      await movePhotoTags({
        photoMetadataTableName: PHOTO_METADATA_TABLE_NAME,
        tagCatalogTableName: TAG_CATALOG_TABLE_NAME,
        tagAssignmentsTableName: TAG_ASSIGNMENTS_TABLE_NAME,
        sourcePhotoKey: sourcePhoto.canonicalKey,
        destinationPhotoKey: destinationPhoto.canonicalKey,
      });
      return response(200, {
        sourceKey,
        destinationKey: destinationPhoto.legacyKey,
        movedKeys: [destinationPhoto.legacyKey],
        photoKey: destinationPhoto.canonicalKey,
      });
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
        copiedFull ? deleteObject(destinationPhoto.fullKey) : Promise.resolve(),
        copiedThumbnail ? deleteObject(destinationPhoto.thumbnailKey) : Promise.resolve(),
      ]);
      throw error;
    }

    await Promise.all([
      deleteObject(sourcePhoto.fullKey),
      deleteOptionalObject(sourcePhoto.thumbnailKey),
    ]);

    await movePhotoTags({
      photoMetadataTableName: PHOTO_METADATA_TABLE_NAME,
      tagCatalogTableName: TAG_CATALOG_TABLE_NAME,
      tagAssignmentsTableName: TAG_ASSIGNMENTS_TABLE_NAME,
      sourcePhotoKey: sourcePhoto.canonicalKey,
      destinationPhotoKey: destinationPhoto.canonicalKey,
    });

    return response(200, {
      sourceKey,
      destinationKey: destinationPhoto.fullKey,
      movedKeys: [destinationPhoto.fullKey, destinationPhoto.thumbnailKey],
      photoKey: destinationPhoto.canonicalKey,
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return response(500, { message: "Failed to move photo.", error: message });
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

function getClaims(event: APIGatewayProxyEvent) {
  const authorizer = event.requestContext.authorizer as
    | { claims?: Record<string, string> }
    | { jwt?: { claims?: Record<string, string> } }
    | undefined;

  if (authorizer && "claims" in authorizer) return authorizer.claims;
  if (authorizer && "jwt" in authorizer) return authorizer.jwt?.claims;
  return undefined;
}

function isAdmin(claims?: Record<string, string>) {
  const groups = claims?.["cognito:groups"];
  if (!groups) return false;
  return groups.includes("admin");
}

function response(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
    },
    body: JSON.stringify(body),
  };
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

async function deleteObject(key: string) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }),
  );
}

async function deleteOptionalObject(key: string) {
  try {
    await deleteObject(key);
  } catch (error) {
    if (isMissingKeyError(error)) return;
    throw error;
  }
}

function isMissingKeyError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { name?: string; Code?: string };
  return candidate.name === "NoSuchKey" || candidate.Code === "NoSuchKey";
}
