import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getManagedPhotoKeysFromStorageKey } from "../shared/photoPaths.js";

const BUCKET_NAME = process.env.BUCKET_NAME;
const s3 = new S3Client({ region: process.env.AWS_REGION });

type RequestBody = {
  key?: string;
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
    const key = body?.key?.trim();

    if (!key) {
      return response(400, { message: "key is required." });
    }

    const photo = getManagedPhotoKeysFromStorageKey(key);
    if (!photo) {
      return response(400, { message: "Invalid key." });
    }

    if (photo.isLegacy) {
      await deleteObject(photo.legacyKey);
      return response(200, { deletedKey: photo.legacyKey, deletedKeys: [photo.legacyKey] });
    }

    await Promise.all([
      deleteObject(photo.fullKey),
      deleteOptionalObject(photo.thumbnailKey),
    ]);

    return response(200, {
      deletedKey: photo.fullKey,
      deletedKeys: [photo.fullKey, photo.thumbnailKey],
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return response(500, { message: "Failed to delete photo.", error: message });
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
