import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
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
      return jsonResponse(event, 500, { message: "Server configuration is incomplete." }, "GET,OPTIONS");
    }

    const claims = getClaims(event);
    if (!isAdmin(claims)) {
      return jsonResponse(event, 403, { message: "Admin access required." }, "GET,OPTIONS");
    }

    const items: Record<string, unknown>[] = [];
    let lastEvaluatedKey: Record<string, unknown> | undefined;
    do {
      const result = await ddb.send(
        new ScanCommand({
          TableName: FOLDERS_TABLE_NAME,
          ExclusiveStartKey: lastEvaluatedKey,
        }),
      );
      items.push(...(result.Items ?? []));
      lastEvaluatedKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (lastEvaluatedKey);

    return jsonResponse(event, 200, {
      folders: items.map((item) => ({
        folderId: item.folderId,
        displayName: item.displayName ?? item.folderId,
        createdAt: item.createdAt,
        createdBy: item.createdBy,
        likeLimit: item.likeLimit,
        likedCount: item.likedCount,
        bulkRetentionDays: item.bulkRetentionDays,
      })),
    }, "GET,OPTIONS");
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(event, 500, { message: "Failed to list folders.", error: message }, "GET,OPTIONS");
  }
};

