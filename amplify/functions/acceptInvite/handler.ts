import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand, AdminUpdateUserAttributesCommand } from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClaims } from "../shared/auth.js";
import { jsonResponse } from "../shared/response.js";

const INVITES_TABLE_NAME = process.env.INVITES_TABLE_NAME;
const USER_POOL_ID = process.env.USER_POOL_ID;
const FOLDER_USERS_TABLE_NAME = process.env.FOLDER_USERS_TABLE_NAME;
const BANNED_USERS_TABLE_NAME = process.env.BANNED_USERS_TABLE_NAME;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const cognito = new CognitoIdentityProviderClient({});

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!INVITES_TABLE_NAME || !USER_POOL_ID || !FOLDER_USERS_TABLE_NAME || !BANNED_USERS_TABLE_NAME) {
      return jsonResponse(event, 500, { message: "Server configuration is incomplete." }, "POST,OPTIONS");
    }

    const claims = getClaims(event);
    const username =
      claims?.["cognito:username"] ?? claims?.username ?? claims?.sub;

    if (!username) {
      return jsonResponse(event, 401, { message: "Unauthorized." }, "POST,OPTIONS");
    }


    const body = parseBody(event);
    const inviteCode = body?.inviteCode?.trim();
    if (!inviteCode) {
      return jsonResponse(event, 400, { message: "inviteCode is required." }, "POST,OPTIONS");
    }

    const inviteResult = await ddb.send(
      new GetCommand({
        TableName: INVITES_TABLE_NAME,
        Key: { inviteCode },
      }),
    );

    if (!inviteResult.Item) {
      return jsonResponse(event, 404, { message: "Invite not found." }, "POST,OPTIONS");
    }

    const { folderId, expiresAt } = inviteResult.Item as {
      folderId?: string;
      expiresAt?: number;
    };

    if (!folderId) {
      return jsonResponse(event, 500, { message: "Invite missing folder mapping." }, "POST,OPTIONS");
    }

    if (expiresAt && expiresAt < Math.floor(Date.now() / 1000)) {
      return jsonResponse(event, 410, { message: "Invite has expired." }, "POST,OPTIONS");
    }

    const banResult = await ddb.send(
      new GetCommand({
        TableName: BANNED_USERS_TABLE_NAME,
        Key: { folderId, username },
      }),
    );

    if (banResult.Item) {
      return jsonResponse(event, 403, { message: "You are banned from this folder." }, "POST,OPTIONS");
    }

    const currentFolder = claims?.["custom:folderId"];
    if (!currentFolder) {
      await cognito.send(
        new AdminUpdateUserAttributesCommand({
          UserPoolId: USER_POOL_ID,
          Username: username,
          UserAttributes: [
            {
              Name: "custom:folderId",
              Value: folderId,
            },
          ],
        }),
      );
    }

    await cognito.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        GroupName: "user",
      }),
    );

    await ddb.send(
      new PutCommand({
        TableName: FOLDER_USERS_TABLE_NAME,
        Item: {
          folderId,
          username,
          createdAt: new Date().toISOString(),
        },
      }),
    );

    return jsonResponse(event, 200, { folderId }, "POST,OPTIONS");
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(event, 500, { message: "Failed to accept invite.", error: message }, "POST,OPTIONS");
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


