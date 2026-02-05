import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand, AdminUpdateUserAttributesCommand } from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const INVITES_TABLE_NAME = process.env.INVITES_TABLE_NAME;
const USER_POOL_ID = process.env.USER_POOL_ID;
const FOLDER_USERS_TABLE_NAME = process.env.FOLDER_USERS_TABLE_NAME;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const cognito = new CognitoIdentityProviderClient({});

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!INVITES_TABLE_NAME || !USER_POOL_ID || !FOLDER_USERS_TABLE_NAME) {
      return response(500, { message: "Server configuration is incomplete." });
    }

    const claims = getClaims(event);
    const username =
      claims?.["cognito:username"] ?? claims?.username ?? claims?.sub;

    if (!username) {
      return response(401, { message: "Unauthorized." });
    }


    const body = parseBody(event);
    const inviteCode = body?.inviteCode?.trim();
    if (!inviteCode) {
      return response(400, { message: "inviteCode is required." });
    }

    const inviteResult = await ddb.send(
      new GetCommand({
        TableName: INVITES_TABLE_NAME,
        Key: { inviteCode },
      }),
    );

    if (!inviteResult.Item) {
      return response(404, { message: "Invite not found." });
    }

    const { folderId, expiresAt } = inviteResult.Item as {
      folderId?: string;
      expiresAt?: number;
    };

    if (!folderId) {
      return response(500, { message: "Invite missing folder mapping." });
    }

    if (expiresAt && expiresAt < Math.floor(Date.now() / 1000)) {
      return response(410, { message: "Invite has expired." });
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

    return response(200, { folderId });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return response(500, { message: "Failed to accept invite.", error: message });
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
