import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClaims, isAdmin } from "../shared/auth.js";
import { jsonResponse } from "../shared/response.js";
import { getManagedPhotoKeysFromStorageKey } from "../shared/photoPaths.js";
import { deletePhotoTags } from "../shared/tagMetadata.js";

const BUCKET_NAME = process.env.BUCKET_NAME;
const FOLDERS_TABLE_NAME = process.env.FOLDERS_TABLE_NAME;
const FOLDER_USERS_TABLE_NAME = process.env.FOLDER_USERS_TABLE_NAME;
const BANNED_USERS_TABLE_NAME = process.env.BANNED_USERS_TABLE_NAME;
const INVITES_TABLE_NAME = process.env.INVITES_TABLE_NAME;
const PHOTO_METADATA_TABLE_NAME = process.env.PHOTO_METADATA_TABLE_NAME;
const TAG_ASSIGNMENTS_TABLE_NAME = process.env.TAG_ASSIGNMENTS_TABLE_NAME;

const s3 = new S3Client({ region: process.env.AWS_REGION });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!BUCKET_NAME || !FOLDERS_TABLE_NAME) {
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

    const folder = await ddb.send(
      new GetCommand({ TableName: FOLDERS_TABLE_NAME, Key: { folderId } }),
    );
    const inviteCode =
      typeof folder.Item?.inviteCode === "string" ? folder.Item.inviteCode : undefined;

    const prefix = `${folderId}/`;
    const photoKeys = await deleteS3PrefixAndCollectPhotoKeys(prefix);

    for (const photoKey of photoKeys) {
      await deletePhotoTags({
        photoMetadataTableName: PHOTO_METADATA_TABLE_NAME,
        tagAssignmentsTableName: TAG_ASSIGNMENTS_TABLE_NAME,
        photoKey,
      });
    }

    await deleteAllByFolderId(FOLDER_USERS_TABLE_NAME, folderId);
    await deleteAllByFolderId(BANNED_USERS_TABLE_NAME, folderId);

    if (inviteCode && INVITES_TABLE_NAME) {
      await ddb.send(
        new DeleteCommand({
          TableName: INVITES_TABLE_NAME,
          Key: { inviteCode },
        }),
      );
    }

    // Deleted last, so a failure above leaves the folder visibly present
    // rather than silently half-deleted.
    await ddb.send(
      new DeleteCommand({
        TableName: FOLDERS_TABLE_NAME,
        Key: { folderId },
      }),
    );

    return jsonResponse(event, 200, { folderId }, "POST,OPTIONS");
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(event, 500, { message: "Failed to delete folder.", error: message }, "POST,OPTIONS");
  }
};

async function deleteS3PrefixAndCollectPhotoKeys(prefix: string) {
  const photoKeys = new Set<string>();
  let continuationToken: string | undefined;

  do {
    const list = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );

    const contents = list.Contents ?? [];
    for (const obj of contents) {
      if (!obj.Key) continue;
      const managed = getManagedPhotoKeysFromStorageKey(obj.Key);
      if (managed) photoKeys.add(managed.canonicalKey);
    }

    const objects = contents
      .filter((obj) => obj.Key)
      .map((obj) => ({ Key: obj.Key! }));
    if (objects.length > 0) {
      await s3.send(
        new DeleteObjectsCommand({
          Bucket: BUCKET_NAME,
          Delete: { Objects: objects, Quiet: true },
        }),
      );
    }

    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (continuationToken);

  return photoKeys;
}

async function deleteAllByFolderId(tableName: string | undefined, folderId: string) {
  if (!tableName) return;

  let lastEvaluatedKey: Record<string, unknown> | undefined;
  do {
    const result = await ddb.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "folderId = :folderId",
        ExpressionAttributeValues: { ":folderId": folderId },
        ExclusiveStartKey: lastEvaluatedKey,
      }),
    );

    for (const item of result.Items ?? []) {
      if (typeof item.username !== "string") continue;
      await ddb.send(
        new DeleteCommand({
          TableName: tableName,
          Key: { folderId, username: item.username },
        }),
      );
    }

    lastEvaluatedKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastEvaluatedKey);
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
