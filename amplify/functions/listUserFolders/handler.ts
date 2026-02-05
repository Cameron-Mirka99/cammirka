import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchGetCommand,
  DynamoDBDocumentClient,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const FOLDER_USERS_TABLE_NAME = process.env.FOLDER_USERS_TABLE_NAME;
const FOLDERS_TABLE_NAME = process.env.FOLDERS_TABLE_NAME;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

type FolderEntry = {
  folderId: string;
  displayName?: string;
};

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!FOLDER_USERS_TABLE_NAME || !FOLDERS_TABLE_NAME) {
      return response(500, { message: "Server configuration is incomplete." });
    }

    const claims = getClaims(event);
    const username =
      claims?.["cognito:username"] ?? claims?.username ?? claims?.sub;
    if (!username) {
      return response(401, { message: "Unauthorized." });
    }

    const folderIds = await queryUserFolders(username);
    if (folderIds.length === 0) {
      return response(200, { folders: [] });
    }

    const folders = await loadFolderDisplayNames(folderIds);
    return response(200, { folders });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return response(500, { message: "Failed to list user folders.", error: message });
  }
};

async function queryUserFolders(username: string) {
  const folderIds: string[] = [];
  let lastEvaluatedKey: Record<string, unknown> | undefined;
  do {
    const result = await ddb.send(
      new QueryCommand({
        TableName: FOLDER_USERS_TABLE_NAME,
        IndexName: "byUsername",
        KeyConditionExpression: "username = :username",
        ExpressionAttributeValues: {
          ":username": username,
        },
        ExclusiveStartKey: lastEvaluatedKey,
      }),
    );

    for (const item of result.Items ?? []) {
      if (typeof item.folderId === "string") {
        folderIds.push(item.folderId);
      }
    }

    lastEvaluatedKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastEvaluatedKey);

  return folderIds;
}

async function loadFolderDisplayNames(folderIds: string[]) {
  const folders: FolderEntry[] = [];
  const chunks = chunk(folderIds, 100);

  for (const batch of chunks) {
    const result = await ddb.send(
      new BatchGetCommand({
        RequestItems: {
          [FOLDERS_TABLE_NAME as string]: {
            Keys: batch.map((folderId) => ({ folderId })),
          },
        },
      }),
    );

    const items = result.Responses?.[FOLDERS_TABLE_NAME as string] ?? [];
    for (const item of items) {
      if (typeof item.folderId === "string") {
        folders.push({
          folderId: item.folderId,
          displayName: typeof item.displayName === "string" ? item.displayName : undefined,
        });
      }
    }
  }

  return folders;
}

function chunk<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
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
      "Access-Control-Allow-Methods": "GET,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}
