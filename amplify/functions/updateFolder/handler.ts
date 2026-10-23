import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
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
      return jsonResponse(event, 500, { message: "Server configuration is incomplete." }, "PATCH,OPTIONS");
    }

    const claims = getClaims(event);
    if (!isAdmin(claims)) {
      return jsonResponse(event, 403, { message: "Admin access required." }, "PATCH,OPTIONS");
    }

    const body = parseBody(event);
    const folderId = typeof body?.folderId === "string" ? body.folderId.trim() : "";
    if (!folderId) {
      return jsonResponse(event, 400, { message: "folderId is required." }, "PATCH,OPTIONS");
    }

    // bulkRetentionDays is creation-time-only (set in createFolder). A stray
    // request carrying it here would otherwise silently shift the retention
    // clock bulk photos in this folder are already aging against.
    if ("bulkRetentionDays" in (body ?? {})) {
      return jsonResponse(event, 400, {
        message: "bulkRetentionDays can only be set when the folder is created.",
      }, "PATCH,OPTIONS");
    }

    const likeLimit = body?.likeLimit;
    if (typeof likeLimit !== "number" || !Number.isInteger(likeLimit) || likeLimit <= 0) {
      return jsonResponse(event, 400, { message: "likeLimit must be a positive integer." }, "PATCH,OPTIONS");
    }

    await ddb.send(
      new UpdateCommand({
        TableName: FOLDERS_TABLE_NAME,
        Key: { folderId },
        ConditionExpression: "attribute_exists(folderId)",
        UpdateExpression: "SET likeLimit = :likeLimit",
        ExpressionAttributeValues: { ":likeLimit": likeLimit },
      }),
    );

    return jsonResponse(event, 200, { folderId, likeLimit }, "PATCH,OPTIONS");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("ConditionalCheckFailed")) {
      return jsonResponse(event, 404, { message: "Folder does not exist." }, "PATCH,OPTIONS");
    }
    console.error(error);
    return jsonResponse(event, 500, { message: "Failed to update folder.", error: message }, "PATCH,OPTIONS");
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
