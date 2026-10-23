import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClaims, isAdmin } from "../shared/auth.js";
import { jsonResponse } from "../shared/response.js";

const FOLDERS_TABLE_NAME = process.env.FOLDERS_TABLE_NAME;
const INVITES_TABLE_NAME = process.env.INVITES_TABLE_NAME;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!FOLDERS_TABLE_NAME || !INVITES_TABLE_NAME) {
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

    const folderResult = await ddb.send(
      new GetCommand({
        TableName: FOLDERS_TABLE_NAME,
        Key: { folderId },
      }),
    );

    if (!folderResult.Item) {
      return jsonResponse(event, 404, { message: "Folder not found." }, "POST,OPTIONS");
    }

    const existingInviteCode =
      typeof folderResult.Item.inviteCode === "string"
        ? folderResult.Item.inviteCode
        : undefined;

    if (body?.revoke === true) {
      if (existingInviteCode) {
        await ddb.send(
          new DeleteCommand({
            TableName: INVITES_TABLE_NAME,
            Key: { inviteCode: existingInviteCode },
          }),
        );
      }
      await ddb.send(
        new UpdateCommand({
          TableName: FOLDERS_TABLE_NAME,
          Key: { folderId },
          UpdateExpression: "REMOVE inviteCode",
        }),
      );
      return jsonResponse(event, 200, { folderId, revoked: true }, "POST,OPTIONS");
    }

    const expiresInDays =
      Number.isFinite(body?.expiresInDays) && body.expiresInDays > 0
        ? Math.floor(body.expiresInDays)
        : 30;
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInDays * 86400;
    const createdAt = new Date().toISOString();
    const createdBy =
      claims?.["cognito:username"] ?? claims?.username ?? "unknown";

    const rotate = body?.rotate === true;
    const inviteCode =
      rotate || !existingInviteCode
        ? crypto.randomBytes(16).toString("hex")
        : existingInviteCode;

    // Rotating invalidates the old link immediately, rather than leaving a
    // second valid code around — delete the old InvitesTable row first.
    if (rotate && existingInviteCode && existingInviteCode !== inviteCode) {
      await ddb.send(
        new DeleteCommand({
          TableName: INVITES_TABLE_NAME,
          Key: { inviteCode: existingInviteCode },
        }),
      );
    }

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

    if (!existingInviteCode || rotate) {
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

    return jsonResponse(event, 201, { inviteCode, folderId, expiresAt }, "POST,OPTIONS");
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(event, 500, { message: "Failed to create invite.", error: message }, "POST,OPTIONS");
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

