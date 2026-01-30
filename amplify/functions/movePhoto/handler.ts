import {
  CopyObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const BUCKET_NAME = process.env.BUCKET_NAME;
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

    const fileName = sourceKey.split("/").pop();
    if (!fileName) {
      return response(400, { message: "Invalid sourceKey." });
    }

    const destinationKey = `${destinationFolderId}/${fileName}`;
    const copySource = `${BUCKET_NAME}/${encodeKey(sourceKey)}`;

    await s3.send(
      new CopyObjectCommand({
        Bucket: BUCKET_NAME,
        Key: destinationKey,
        CopySource: copySource,
      }),
    );

    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: sourceKey,
      }),
    );

    return response(200, { sourceKey, destinationKey });
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

function sanitizeFolderId(value?: string) {
  if (!value) return null;
  const trimmed = value.trim().replace(/^\/+|\/+$/g, "");
  if (!trimmed) return null;
  if (!/^[a-zA-Z0-9/_-]+$/.test(trimmed)) return null;
  return trimmed;
}

function encodeKey(key: string) {
  return encodeURIComponent(key).replace(/%2F/g, "/");
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
