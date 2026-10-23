import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClaims, isAdmin } from "../shared/auth.js";
import { isFolderMember } from "../shared/folderAccess.js";
import { jsonResponse } from "../shared/response.js";
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
      return jsonResponse(event, 500, { message: "Server configuration is incomplete." }, "POST,OPTIONS");
    }

    const claims = getClaims(event);
    if (!claims) {
      return jsonResponse(event, 401, { message: "Unauthorized." }, "POST,OPTIONS");
    }

    const body = parseBody(event);
    const storageKey = typeof body?.storageKey === "string" ? body.storageKey.trim() : "";
    if (!storageKey) {
      return jsonResponse(event, 400, { message: "storageKey is required." }, "POST,OPTIONS");
    }

    const managedKeys = getManagedPhotoKeysFromStorageKey(storageKey);
    if (!managedKeys) {
      return jsonResponse(event, 400, { message: "Invalid photo key." }, "POST,OPTIONS");
    }

    const username = claims["cognito:username"] ?? claims.username ?? claims.sub;
    if (!isAdmin(claims)) {
      if (!username) {
        return jsonResponse(event, 401, { message: "Unauthorized." }, "POST,OPTIONS");
      }
      const allowed = await isFolderMember(ddb, FOLDER_USERS_TABLE_NAME, username, managedKeys.folderId);
      if (!allowed) {
        return jsonResponse(event, 403, { message: "Folder access not available." }, "POST,OPTIONS");
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

    return jsonResponse(event, 200, { url, fileName }, "POST,OPTIONS");
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(event, 500, { message: "Failed to create download URL.", error: message }, "POST,OPTIONS");
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

function sanitizeDownloadName(fileName: string) {
  return fileName.replace(/["\\]/g, "_");
}

