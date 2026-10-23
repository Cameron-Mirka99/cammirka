import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClaims, isAdmin } from "../shared/auth.js";
import { jsonResponse } from "../shared/response.js";
import { getManagedPhotoKeysFromStorageKey } from "../shared/photoPaths.js";
import { deletePhotoTags } from "../shared/tagMetadata.js";

const BUCKET_NAME = process.env.BUCKET_NAME;
const PHOTO_METADATA_TABLE_NAME = process.env.PHOTO_METADATA_TABLE_NAME;
const TAG_ASSIGNMENTS_TABLE_NAME = process.env.TAG_ASSIGNMENTS_TABLE_NAME;
const s3 = new S3Client({ region: process.env.AWS_REGION });

type RequestBody = {
  key?: string;
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
    const key = body?.key?.trim();

    if (!key) {
      return jsonResponse(event, 400, { message: "key is required." }, "POST,OPTIONS");
    }

    const photo = getManagedPhotoKeysFromStorageKey(key);
    if (!photo) {
      return jsonResponse(event, 400, { message: "Invalid key." }, "POST,OPTIONS");
    }

    if (photo.isLegacy) {
      await deleteObject(photo.legacyKey);
      await deletePhotoTags({
        photoMetadataTableName: PHOTO_METADATA_TABLE_NAME,
        tagAssignmentsTableName: TAG_ASSIGNMENTS_TABLE_NAME,
        photoKey: photo.canonicalKey,
      });
      return jsonResponse(event, 200, { deletedKey: photo.legacyKey, deletedKeys: [photo.legacyKey] }, "POST,OPTIONS");
    }

    await Promise.all([
      deleteObject(photo.fullKey),
      deleteOptionalObject(photo.thumbnailKey),
    ]);
    await deletePhotoTags({
      photoMetadataTableName: PHOTO_METADATA_TABLE_NAME,
      tagAssignmentsTableName: TAG_ASSIGNMENTS_TABLE_NAME,
      photoKey: photo.canonicalKey,
    });

    return jsonResponse(event, 200, {
      deletedKey: photo.fullKey,
      deletedKeys: [photo.fullKey, photo.thumbnailKey],
    }, "POST,OPTIONS");
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(event, 500, { message: "Failed to delete photo.", error: message }, "POST,OPTIONS");
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
