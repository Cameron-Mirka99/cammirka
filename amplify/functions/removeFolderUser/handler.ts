import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const FOLDER_USERS_TABLE_NAME = process.env.FOLDER_USERS_TABLE_NAME;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!FOLDER_USERS_TABLE_NAME) {
      return response(500, { message: "Server configuration is incomplete." });
    }

    const claims = getClaims(event);
    if (!isAdmin(claims)) {
      return response(403, { message: "Admin access required." });
    }

    const body = parseBody(event);
    const folderId = sanitizeFolderId(body?.folderId);
    const username = typeof body?.username === "string" ? body.username.trim() : "";

    if (!folderId || !username) {
      return response(400, { message: "folderId and username are required." });
    }

    await ddb.send(
      new DeleteCommand({
        TableName: FOLDER_USERS_TABLE_NAME,
        Key: { folderId, username },
      }),
    );

    return response(200, { folderId, username });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return response(500, { message: "Failed to remove user.", error: message });
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
