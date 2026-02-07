import {
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const USER_POOL_ID = process.env.USER_POOL_ID;
const FOLDER_USERS_TABLE_NAME = process.env.FOLDER_USERS_TABLE_NAME;
const BANNED_USERS_TABLE_NAME = process.env.BANNED_USERS_TABLE_NAME;

const cognito = new CognitoIdentityProviderClient({});
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!USER_POOL_ID || !FOLDER_USERS_TABLE_NAME || !BANNED_USERS_TABLE_NAME) {
      return response(500, { message: "Server configuration is incomplete." });
    }

    const claims = getClaims(event);
    if (!isAdmin(claims)) {
      return response(403, { message: "Admin access required." });
    }

    const body = parseBody(event);
    const folderId = sanitizeFolderId(
      body?.folderId ?? event.queryStringParameters?.folderId,
    );
    if (!folderId) {
      return response(400, { message: "folderId is required." });
    }

    const users = await fetchUsersForFolder(folderId);
    const bannedUsers = await fetchBannedUsersForFolder(folderId);
    return response(200, { folderId, users, bannedUsers });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return response(500, { message: "Failed to list users.", error: message });
  }
};

async function fetchUsersForFolder(folderId: string) {
  const mappedUsers = await queryFolderUsers(folderId);
  if (mappedUsers.length === 0) {
    return [];
  }

  const users = await Promise.all(
    mappedUsers.map((entry) => fetchUser(entry.username)),
  );

  return users.filter((userEntry): userEntry is NonNullable<typeof userEntry> => Boolean(userEntry));
}

async function fetchBannedUsersForFolder(folderId: string) {
  const mappedUsers = await queryBannedFolderUsers(folderId);
  if (mappedUsers.length === 0) {
    return [];
  }

  const users = await Promise.all(
    mappedUsers.map((entry) => fetchUser(entry.username)),
  );

  return users
    .map((userEntry, index) => {
      if (!userEntry) return null;
      return {
        ...userEntry,
        bannedAt: mappedUsers[index]?.bannedAt,
      };
    })
    .filter(
      (userEntry): userEntry is NonNullable<typeof userEntry> => Boolean(userEntry),
    );
}

async function fetchUser(username: string) {
  try {
    const result = await cognito.send(
      new AdminGetUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
      }),
    );

    const attrs = result.UserAttributes ?? [];
    return {
      username,
      enabled: result.Enabled,
      status: result.UserStatus,
      createdAt: result.UserCreateDate?.toISOString(),
      lastModifiedAt: result.UserLastModifiedDate?.toISOString(),
      email: getAttribute(attrs, "email"),
      name: getAttribute(attrs, "name"),
      givenName: getAttribute(attrs, "given_name"),
      familyName: getAttribute(attrs, "family_name"),
    };
  } catch (error) {
    console.error(`Failed to fetch user ${username}`, error);
    return null;
  }
}

async function queryFolderUsers(folderId: string) {
  const entries: Array<{ username: string; createdAt?: string }> = [];
  let lastEvaluatedKey: Record<string, unknown> | undefined;
  do {
    const result = await ddb.send(
      new QueryCommand({
        TableName: FOLDER_USERS_TABLE_NAME,
        KeyConditionExpression: "folderId = :folderId",
        ExpressionAttributeValues: {
          ":folderId": folderId,
        },
        ExclusiveStartKey: lastEvaluatedKey,
      }),
    );
    for (const item of result.Items ?? []) {
      if (typeof item.username === "string") {
        entries.push({
          username: item.username,
          createdAt: typeof item.createdAt === "string" ? item.createdAt : undefined,
        });
      }
    }
    lastEvaluatedKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastEvaluatedKey);

  return entries;
}

async function queryBannedFolderUsers(folderId: string) {
  const entries: Array<{ username: string; bannedAt?: string }> = [];
  let lastEvaluatedKey: Record<string, unknown> | undefined;
  do {
    const result = await ddb.send(
      new QueryCommand({
        TableName: BANNED_USERS_TABLE_NAME,
        KeyConditionExpression: "folderId = :folderId",
        ExpressionAttributeValues: {
          ":folderId": folderId,
        },
        ExclusiveStartKey: lastEvaluatedKey,
      }),
    );
    for (const item of result.Items ?? []) {
      if (typeof item.username === "string") {
        entries.push({
          username: item.username,
          bannedAt: typeof item.bannedAt === "string" ? item.bannedAt : undefined,
        });
      }
    }
    lastEvaluatedKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastEvaluatedKey);

  return entries;
}

type CognitoAttribute = { Name?: string; Value?: string };

function getAttribute(attrs: CognitoAttribute[], name: string) {
  return attrs.find((attr) => attr.Name === name)?.Value;
}

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
      "Access-Control-Allow-Methods": "GET,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}
