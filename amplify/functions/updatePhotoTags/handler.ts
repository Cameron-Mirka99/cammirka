import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClaims, isAdmin } from "../shared/auth.js";
import { jsonResponse } from "../shared/response.js";
import { getManagedPhotoKeysFromStorageKey } from "../shared/photoPaths.js";
import { syncPhotoTags } from "../shared/tagMetadata.js";

const BUCKET_NAME = process.env.BUCKET_NAME;
const PHOTO_METADATA_TABLE_NAME = process.env.PHOTO_METADATA_TABLE_NAME;
const TAG_CATALOG_TABLE_NAME = process.env.TAG_CATALOG_TABLE_NAME;
const TAG_ASSIGNMENTS_TABLE_NAME = process.env.TAG_ASSIGNMENTS_TABLE_NAME;
const s3 = new S3Client({ region: process.env.AWS_REGION });

type SingleUpdate = {
  photoKey?: string;
  key?: string;
  tags?: string[];
};

type RequestBody = SingleUpdate & {
  updates?: SingleUpdate[];
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

    if (Array.isArray(body?.updates)) {
      const results = await Promise.all(body.updates.map((update) => applyUpdate(update)));
      const failed = results.filter((r) => !r.ok);
      return jsonResponse(
        event,
        failed.length > 0 ? 207 : 200,
        { results },
        "POST,OPTIONS"
      );
    }

    const result = await applyUpdate(body ?? {});
    if (!result.ok) {
      return jsonResponse(
        event,
        result.message === "photoKey is required." ? 400 : 404,
        { message: result.message },
        "POST,OPTIONS"
      );
    }

    return jsonResponse(event, 200, { photoKey: result.photoKey, tags: result.tags }, "POST,OPTIONS");
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(event, 500, { message: "Failed to update photo tags.", error: message }, "POST,OPTIONS");
  }
};

async function applyUpdate(update: SingleUpdate): Promise<{
  photoKey: string;
  tags: string[];
  ok: boolean;
  message?: string;
}> {
  const requestedKey = update.photoKey?.trim() || update.key?.trim();
  const tags = Array.isArray(update.tags)
    ? update.tags.filter((tag): tag is string => typeof tag === "string")
    : [];

  if (!requestedKey) {
    return { photoKey: "", tags: [], ok: false, message: "photoKey is required." };
  }

  const photo = getManagedPhotoKeysFromStorageKey(requestedKey);
  const photoKey = photo?.canonicalKey ?? requestedKey;
  const storageKey = photo?.fullKey ?? photo?.legacyKey ?? requestedKey;

  const exists = await photoExists(storageKey);
  if (!exists) {
    return { photoKey, tags, ok: false, message: "Photo not found." };
  }

  const normalizedTags = await syncPhotoTags({
    photoMetadataTableName: PHOTO_METADATA_TABLE_NAME,
    tagCatalogTableName: TAG_CATALOG_TABLE_NAME,
    tagAssignmentsTableName: TAG_ASSIGNMENTS_TABLE_NAME,
    photoKey,
    tags,
  });

  return { photoKey, tags: normalizedTags, ok: true };
}

function parseBody(event: APIGatewayProxyEvent): RequestBody | null {
  if (!event.body) return null;
  try {
    return typeof event.body === "string"
      ? (JSON.parse(event.body) as RequestBody)
      : (event.body as RequestBody);
  } catch {
    return null;
  }
}

async function photoExists(key: string) {
  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      }),
    );
    return true;
  } catch {
    return false;
  }
}
