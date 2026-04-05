import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getManagedPhotoKeysFromStorageKey } from "../shared/photoPaths.js";

const BUCKET_NAME = process.env.BUCKET_NAME;
const FOLDER_USERS_TABLE_NAME = process.env.FOLDER_USERS_TABLE_NAME;

const s3 = new S3Client({ region: process.env.AWS_REGION });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!BUCKET_NAME || !FOLDER_USERS_TABLE_NAME) {
      return response(500, { message: "Server configuration is incomplete." });
    }

    const claims = getClaims(event);
    if (!claims) {
      return response(401, { message: "Unauthorized." });
    }

    const body = parseBody(event);
    const storageKey = typeof body?.storageKey === "string" ? body.storageKey.trim() : "";
    if (!storageKey) {
      return response(400, { message: "storageKey is required." });
    }

    const managedKeys = getManagedPhotoKeysFromStorageKey(storageKey);
    if (!managedKeys) {
      return response(400, { message: "Invalid photo key." });
    }

    const username = claims["cognito:username"] ?? claims.username ?? claims.sub;
    if (!isAdmin(claims)) {
      if (!username) {
        return response(401, { message: "Unauthorized." });
      }
      const allowed = await isUserInFolder(username, managedKeys.folderId);
      if (!allowed) {
        return response(403, { message: "Folder access not available." });
      }
    }

    const fileName = managedKeys.fileName;
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: managedKeys.fullKey,
        ResponseContentDisposition: `attachment; filename="${sanitizeDownloadName(fileName)}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      }),
      { expiresIn: 120 },
    );

    return response(200, { url, fileName });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return response(500, { message: "Failed to create download URL.", error: message });
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

function isAdmin(claims: Record<string, string>) {
  const groups = claims["cognito:groups"];
  return typeof groups === "string" && groups.includes("admin");
}

async function isUserInFolder(username: string, folderId: string) {
  const result = await ddb.send(
    new GetCommand({
      TableName: FOLDER_USERS_TABLE_NAME,
      Key: { folderId, username },
    }),
  );

  return Boolean(result.Item);
}

function sanitizeDownloadName(fileName: string) {
  return fileName.replace(/["\\]/g, "_");
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
