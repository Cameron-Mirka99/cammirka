import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClaims, isAdmin } from "../shared/auth.js";
import { jsonResponse } from "../shared/response.js";

const TAG_CATALOG_TABLE_NAME = process.env.TAG_CATALOG_TABLE_NAME;
const TAG_ASSIGNMENTS_TABLE_NAME = process.env.TAG_ASSIGNMENTS_TABLE_NAME;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

/**
 * One-off/occasional maintenance action: retallies every tag's stored
 * `count` from the tagAssignments table (the source of truth), rather than
 * trusting the incremental ADD/SUBTRACT counters to have never drifted.
 * Needed once to seed counts for tags that existed before the counter was
 * introduced, and safe to re-run any time to correct any drift.
 */
export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!TAG_CATALOG_TABLE_NAME || !TAG_ASSIGNMENTS_TABLE_NAME) {
      return jsonResponse(event, 500, { message: "Server configuration is incomplete." }, "POST,OPTIONS");
    }

    const claims = getClaims(event);
    if (!isAdmin(claims)) {
      return jsonResponse(event, 403, { message: "Admin access required." }, "POST,OPTIONS");
    }

    const { counts, totalAssignments } = await scanAssignmentCounts(TAG_ASSIGNMENTS_TABLE_NAME);
    const tagKeys = await scanCatalogTagKeys(TAG_CATALOG_TABLE_NAME);

    // Every catalog tag gets an explicit count, including 0 for tags with
    // no current assignments -- a missing row here would just mean "still
    // whatever it was before," which defeats the point of a recompute.
    await Promise.all(
      tagKeys.map((tagKey) =>
        ddb.send(
          new UpdateCommand({
            TableName: TAG_CATALOG_TABLE_NAME,
            Key: { tagKey },
            UpdateExpression: "SET #count = :count",
            ExpressionAttributeNames: { "#count": "count" },
            ExpressionAttributeValues: { ":count": counts.get(tagKey) ?? 0 },
          }),
        ),
      ),
    );

    return jsonResponse(
      event,
      200,
      { tagsUpdated: tagKeys.length, totalAssignments },
      "POST,OPTIONS",
    );
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(event, 500, { message: "Failed to recompute tag counts.", error: message }, "POST,OPTIONS");
  }
};

async function scanAssignmentCounts(tableName: string) {
  const counts = new Map<string, number>();
  let totalAssignments = 0;
  let exclusiveStartKey: Record<string, unknown> | undefined;

  do {
    const response = await ddb.send(
      new ScanCommand({
        TableName: tableName,
        ProjectionExpression: "tagKey",
        ExclusiveStartKey: exclusiveStartKey,
      }),
    );

    for (const item of response.Items ?? []) {
      const tagKey = typeof item.tagKey === "string" ? item.tagKey : undefined;
      if (!tagKey) continue;
      counts.set(tagKey, (counts.get(tagKey) ?? 0) + 1);
      totalAssignments += 1;
    }

    exclusiveStartKey = response.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return { counts, totalAssignments };
}

async function scanCatalogTagKeys(tableName: string) {
  const tagKeys: string[] = [];
  let exclusiveStartKey: Record<string, unknown> | undefined;

  do {
    const response = await ddb.send(
      new ScanCommand({
        TableName: tableName,
        ProjectionExpression: "tagKey",
        ExclusiveStartKey: exclusiveStartKey,
      }),
    );

    for (const item of response.Items ?? []) {
      if (typeof item.tagKey === "string") tagKeys.push(item.tagKey);
    }

    exclusiveStartKey = response.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return tagKeys;
}
