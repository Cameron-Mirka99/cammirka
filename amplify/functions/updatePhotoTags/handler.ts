import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getManagedPhotoKeysFromStorageKey } from "../shared/photoPaths.js";
import { syncPhotoTags } from "../shared/tagMetadata.js";

const BUCKET_NAME = process.env.BUCKET_NAME;
const PHOTO_METADATA_TABLE_NAME = process.env.PHOTO_METADATA_TABLE_NAME;
const TAG_CATALOG_TABLE_NAME = process.env.TAG_CATALOG_TABLE_NAME;
const TAG_ASSIGNMENTS_TABLE_NAME = process.env.TAG_ASSIGNMENTS_TABLE_NAME;
const s3 = new S3Client({ region: process.env.AWS_REGION });

type RequestBody = {
  photoKey?: string;
  key?: string;
  tags?: string[];
};

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
    const requestedKey = body?.photoKey?.trim() || body?.key?.trim();
    const tags = Array.isArray(body?.tags)
      ? body!.tags.filter((tag): tag is string => typeof tag === "string")
      : [];

    if (!requestedKey) {
      return response(400, { message: "photoKey is required." });
    }

    const photo = getManagedPhotoKeysFromStorageKey(requestedKey);
    const photoKey = photo?.canonicalKey ?? requestedKey;
    const storageKey = photo?.fullKey ?? photo?.legacyKey ?? requestedKey;

    const exists = await photoExists(storageKey);
    if (!exists) {
      return response(404, { message: "Photo not found." });
    }

    const normalizedTags = await syncPhotoTags({
      photoMetadataTableName: PHOTO_METADATA_TABLE_NAME,
      tagCatalogTableName: TAG_CATALOG_TABLE_NAME,
      tagAssignmentsTableName: TAG_ASSIGNMENTS_TABLE_NAME,
      photoKey,
      tags,
    });

    return response(200, {
      photoKey,
      tags: normalizedTags,
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return response(500, { message: "Failed to update photo tags.", error: message });
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
  return Boolean(groups && groups.includes("admin"));
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
