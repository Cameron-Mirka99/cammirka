import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClaims, isAdmin } from "../shared/auth.js";
import { isFolderMember } from "../shared/folderAccess.js";
import { jsonResponse } from "../shared/response.js";
import { parsePhotoIdentity, sanitizeFolderId } from "../shared/photoPaths.js";
import type { PhotoTagMetadata } from "../shared/tagMetadata.js";

const FOLDERS_TABLE_NAME = process.env.FOLDERS_TABLE_NAME;
const FOLDER_USERS_TABLE_NAME = process.env.FOLDER_USERS_TABLE_NAME;
const PHOTO_METADATA_TABLE_NAME = process.env.PHOTO_METADATA_TABLE_NAME;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

type FolderItem = {
  folderId: string;
  likeLimit?: number;
  likedCount?: number;
};

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!FOLDERS_TABLE_NAME || !FOLDER_USERS_TABLE_NAME || !PHOTO_METADATA_TABLE_NAME) {
      return jsonResponse(event, 500, { message: "Server configuration is incomplete." }, "POST,OPTIONS");
    }

    const claims = getClaims(event);
    if (!claims) {
      return jsonResponse(event, 401, { message: "Unauthorized." }, "POST,OPTIONS");
    }

    const body = parseBody(event);
    const photoKey = typeof body?.photoKey === "string" ? body.photoKey.trim() : "";
    const folderId = sanitizeFolderId(body?.folderId);
    if (!photoKey || !folderId) {
      return jsonResponse(event, 400, { message: "photoKey and folderId are required." }, "POST,OPTIONS");
    }

    // The photo's own key is the source of truth for which folder it
    // belongs to -- never trust the caller's folderId on its own, or a
    // member of folder A could like/unlike a photo that actually lives in
    // folder B (and corrupt folder B's likedCount in the process).
    const identity = parsePhotoIdentity(photoKey);
    if (!identity || identity.folderId !== folderId) {
      return jsonResponse(event, 400, { message: "photoKey does not belong to folderId." }, "POST,OPTIONS");
    }

    const username = claims["cognito:username"] ?? claims.username ?? claims.sub;
    if (!isAdmin(claims)) {
      if (!username) {
        return jsonResponse(event, 401, { message: "Unauthorized." }, "POST,OPTIONS");
      }
      const allowed = await isFolderMember(ddb, FOLDER_USERS_TABLE_NAME, username, folderId);
      if (!allowed) {
        return jsonResponse(event, 403, { message: "Folder access not available." }, "POST,OPTIONS");
      }
    }

    const [photoResult, folderResult] = await Promise.all([
      ddb.send(new GetCommand({ TableName: PHOTO_METADATA_TABLE_NAME, Key: { photoKey } })),
      ddb.send(new GetCommand({ TableName: FOLDERS_TABLE_NAME, Key: { folderId } })),
    ]);

    const photoItem = photoResult.Item as PhotoTagMetadata | undefined;
    if (photoItem?.category !== "bulk") {
      return jsonResponse(event, 400, { message: "Only bulk photos can be liked." }, "POST,OPTIONS");
    }

    const folderItem = folderResult.Item as FolderItem | undefined;
    const likeLimit = folderItem?.likeLimit;
    const currentLiked = photoItem.liked === true;
    const targetLiked = !currentLiked;

    if (targetLiked && (typeof likeLimit !== "number" || likeLimit <= 0)) {
      return jsonResponse(event, 400, { message: "This folder has no bulk review limit configured." }, "POST,OPTIONS");
    }

    const currentLikedCount = typeof folderItem?.likedCount === "number" ? folderItem.likedCount : 0;
    if (targetLiked && currentLikedCount >= (likeLimit as number)) {
      return jsonResponse(event, 409, { message: "Like limit reached." }, "POST,OPTIONS");
    }

    try {
      await ddb.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Update: {
                TableName: FOLDERS_TABLE_NAME,
                Key: { folderId },
                UpdateExpression: targetLiked
                  ? "SET likedCount = if_not_exists(likedCount, :zero) + :one"
                  : "SET likedCount = if_not_exists(likedCount, :zero) - :one",
                ConditionExpression: targetLiked
                  ? "attribute_not_exists(likedCount) OR likedCount < :likeLimit"
                  : "attribute_exists(likedCount) AND likedCount > :zero",
                ExpressionAttributeValues: {
                  ":zero": 0,
                  ":one": 1,
                  ...(targetLiked ? { ":likeLimit": likeLimit } : {}),
                },
              },
            },
            {
              Update: {
                TableName: PHOTO_METADATA_TABLE_NAME,
                Key: { photoKey },
                UpdateExpression: "SET liked = :target",
                ConditionExpression: currentLiked
                  ? "liked = :current"
                  : "attribute_not_exists(liked) OR liked = :current",
                ExpressionAttributeValues: {
                  ":target": targetLiked,
                  ":current": currentLiked,
                },
              },
            },
          ],
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("TransactionCanceled")) {
        return jsonResponse(event, 409, { message: "Like state changed, please retry." }, "POST,OPTIONS");
      }
      throw error;
    }

    return jsonResponse(event, 200, {
      photoKey,
      liked: targetLiked,
      likedCount: currentLikedCount + (targetLiked ? 1 : -1),
    }, "POST,OPTIONS");
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(event, 500, { message: "Failed to update like.", error: message }, "POST,OPTIONS");
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
