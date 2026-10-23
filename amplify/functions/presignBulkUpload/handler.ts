import { randomBytes } from "node:crypto";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClaims, isAdmin } from "../shared/auth.js";
import { jsonResponse } from "../shared/response.js";
import {
  buildBulkStagingKey,
  buildFullPhotoKey,
  sanitizeFolderId,
} from "../shared/photoPaths.js";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const BUCKET_NAME = process.env.BUCKET_NAME;
const FOLDERS_TABLE_NAME = process.env.FOLDERS_TABLE_NAME;
const URL_EXPIRY_SECONDS = 600;
const MAX_SUFFIX_RETRIES = 5;

type RequestedFile = { fileName?: string; contentType?: string; takenAt?: string | number };

// Sanity floor for takenAt -- rejects garbage (0, negative, tiny numbers)
// without needing the caller to get this right. Digital photos didn't exist before this.
const TAKEN_AT_MIN_MS = Date.UTC(2000, 0, 1);

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!BUCKET_NAME || !FOLDERS_TABLE_NAME) {
      return jsonResponse(event, 500, { message: "Server configuration is incomplete." }, "POST,OPTIONS");
    }

    const claims = getClaims(event);
    if (!isAdmin(claims)) {
      return jsonResponse(event, 403, { message: "Admin access required." }, "POST,OPTIONS");
    }

    const body = parseBody(event);
    const folderId = sanitizeFolderId(body?.folderId);
    if (!folderId) {
      return jsonResponse(event, 400, { message: "folderId is required." }, "POST,OPTIONS");
    }

    // Bulk-review photos must never be reachable from the public gallery --
    // same rule already enforced for the existing /upload-image path.
    if (folderId === "public") {
      return jsonResponse(event, 400, { message: "Bulk uploads cannot target the public folder." }, "POST,OPTIONS");
    }

    const folderExists = await ddb.send(
      new GetCommand({ TableName: FOLDERS_TABLE_NAME, Key: { folderId } }),
    );
    if (!folderExists.Item) {
      return jsonResponse(event, 404, { message: "Folder does not exist." }, "POST,OPTIONS");
    }

    const files: RequestedFile[] = Array.isArray(body?.files) ? body.files : [];
    if (files.length === 0) {
      return jsonResponse(event, 400, { message: "At least one file is required." }, "POST,OPTIONS");
    }

    const results = await Promise.all(
      files.map((file) => presignOne(folderId, file)),
    );

    const failed = results.filter((entry) => !entry.ok);
    return jsonResponse(event, failed.length > 0 ? 207 : 200, {
      message: failed.length > 0 ? "Some files could not be presigned." : `Presigned ${results.length} file(s).`,
      uploads: results,
    }, "POST,OPTIONS");
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(event, 500, { message: `Server error: ${message}` }, "POST,OPTIONS");
  }
};

async function presignOne(folderId: string, file: RequestedFile) {
  const originalFileName = typeof file.fileName === "string" ? file.fileName.trim() : "";
  const contentType = typeof file.contentType === "string" && file.contentType
    ? file.contentType
    : "application/octet-stream";

  if (!originalFileName) {
    return { fileName: originalFileName, ok: false as const, message: "fileName is required." };
  }

  try {
    const finalFileName = await resolveAvailableFileName(folderId, originalFileName);
    const key = buildBulkStagingKey(folderId, finalFileName);

    // takenAt is best-effort: an invalid or missing value just means the
    // photo falls back to upload-processing order downstream, never a
    // failed presign.
    const takenAtMs = parseTakenAt(file.takenAt);
    const metadata = takenAtMs !== null ? { "taken-at": String(takenAtMs) } : undefined;

    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({ Bucket: BUCKET_NAME, Key: key, ContentType: contentType, Metadata: metadata }),
      { expiresIn: URL_EXPIRY_SECONDS },
    );

    // The PUT signature covers these headers -- the caller must send them
    // verbatim or S3 will reject the upload with SignatureDoesNotMatch.
    const headers: Record<string, string> = { "Content-Type": contentType };
    if (metadata) headers["x-amz-meta-taken-at"] = metadata["taken-at"];

    return { fileName: originalFileName, finalFileName, key, uploadUrl, headers, ok: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not presign this file.";
    return { fileName: originalFileName, ok: false as const, message };
  }
}

function parseTakenAt(value: string | number | undefined): number | null {
  if (value === undefined || value === null) return null;
  // Accepts an epoch-ms number, a numeric string of one, or an ISO date string.
  const ms = typeof value === "number"
    ? value
    : /^\d+$/.test(value.trim())
      ? Number(value.trim())
      : Date.parse(value);
  if (!Number.isFinite(ms) || ms < TAKEN_AT_MIN_MS || ms > Date.now()) return null;
  return Math.trunc(ms);
}

/**
 * Never overwrites: if the canonical full-size key already exists, appends
 * a short random suffix (retrying on collision) so a camera reusing a
 * filename across shoots gets a new photo, not a silent overwrite.
 */
async function resolveAvailableFileName(folderId: string, fileName: string) {
  let candidate = fileName;

  for (let attempt = 0; attempt < MAX_SUFFIX_RETRIES; attempt++) {
    const exists = await objectExists(buildFullPhotoKey(folderId, candidate));
    if (!exists) return candidate;
    candidate = withSuffix(fileName, randomBytes(3).toString("hex"));
  }

  // Extremely unlikely to exhaust all retries; fall back to a longer suffix.
  return withSuffix(fileName, randomBytes(6).toString("hex"));
}

function withSuffix(fileName: string, suffix: string) {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot <= 0) return `${fileName}-${suffix}`;
  return `${fileName.slice(0, lastDot)}-${suffix}${fileName.slice(lastDot)}`;
}

async function objectExists(key: string) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
    return true;
  } catch (error) {
    const candidate = error as { name?: string; Code?: string; $metadata?: { httpStatusCode?: number } };
    if (candidate?.name === "NotFound" || candidate?.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

function parseBody(event: APIGatewayProxyEvent) {
  if (!event.body) return null;
  try {
    return typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  } catch {
    return null;
  }
}
