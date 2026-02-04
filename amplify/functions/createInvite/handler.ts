import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const FOLDERS_TABLE_NAME = process.env.FOLDERS_TABLE_NAME;
const INVITES_TABLE_NAME = process.env.INVITES_TABLE_NAME;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!FOLDERS_TABLE_NAME || !INVITES_TABLE_NAME) {
      return response(500, { message: "Server configuration is incomplete." });
    }

    const claims = getClaims(event);
    if (!isAdmin(claims)) {
      return response(403, { message: "Admin access required." });
    }

    const body = parseBody(event);
    const folderId = sanitizeFolderId(body?.folderId);
    if (!folderId) {
      return response(400, { message: "folderId is required." });
    }

    const folderResult = await ddb.send(
      new GetCommand({
        TableName: FOLDERS_TABLE_NAME,
        Key: { folderId },
      }),
    );

    if (!folderResult.Item) {
      return response(404, { message: "Folder not found." });
    }

    const expiresInDays =
      Number.isFinite(body?.expiresInDays) && body.expiresInDays > 0
        ? Math.floor(body.expiresInDays)
        : 30;
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInDays * 86400;
    const createdAt = new Date().toISOString();
    const createdBy =
      claims?.["cognito:username"] ?? claims?.username ?? "unknown";

    const existingInviteCode =
      typeof folderResult.Item.inviteCode === "string"
        ? folderResult.Item.inviteCode
        : undefined;
    const inviteCode = existingInviteCode ?? crypto.randomBytes(16).toString("hex");

    await ddb.send(
      new PutCommand({
        TableName: INVITES_TABLE_NAME,
        Item: {
          inviteCode,
          folderId,
          expiresAt,
          createdAt,
          createdBy,
        },
      }),
    );

    if (!existingInviteCode) {
      await ddb.send(
        new UpdateCommand({
          TableName: FOLDERS_TABLE_NAME,
          Key: { folderId },
          UpdateExpression: "SET inviteCode = :inviteCode",
          ExpressionAttributeValues: {
            ":inviteCode": inviteCode,
          },
        }),
      );
    }

    return response(201, { inviteCode, folderId, expiresAt });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return response(500, { message: "Failed to create invite.", error: message });
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
