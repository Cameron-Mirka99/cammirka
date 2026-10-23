import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClaims, isAdmin } from "../shared/auth.js";
import { jsonResponse } from "../shared/response.js";

const FOLDERS_TABLE_NAME = process.env.FOLDERS_TABLE_NAME;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!FOLDERS_TABLE_NAME) {
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

    const displayName = body?.displayName?.trim() || folderId;
    const createdAt = new Date().toISOString();
    const createdBy =
      claims?.["cognito:username"] ?? claims?.username ?? "unknown";

    const likeLimit = positiveInteger(body?.likeLimit);
    const bulkRetentionDays = positiveInteger(body?.bulkRetentionDays);

    await ddb.send(
      new PutCommand({
        TableName: FOLDERS_TABLE_NAME,
        Item: {
          folderId,
          displayName,
          createdAt,
          createdBy,
          // bulkRetentionDays is intentionally settable only here, at
          // creation -- updateFolder rejects it outright so the retention
          // clock a bulk photo is already aging against can never shift.
          ...(likeLimit !== undefined ? { likeLimit } : {}),
          ...(bulkRetentionDays !== undefined ? { bulkRetentionDays } : {}),
        },
        ConditionExpression: "attribute_not_exists(folderId)",
      }),
    );

    return jsonResponse(event, 201, { folderId, displayName }, "POST,OPTIONS");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("ConditionalCheckFailed")) {
      return jsonResponse(event, 409, { message: "Folder already exists." }, "POST,OPTIONS");
    }
    console.error(error);
    return jsonResponse(event, 500, { message: "Failed to create folder.", error: message }, "POST,OPTIONS");
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

function positiveInteger(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    return undefined;
  }
  return value;
}

function sanitizeFolderId(value?: string) {
  if (!value) return null;
  const trimmed = value.trim().replace(/^\/+|\/+$/g, "");
  if (!trimmed) return null;
  if (!/^[a-zA-Z0-9/_-]+$/.test(trimmed)) return null;
  return trimmed;
}

