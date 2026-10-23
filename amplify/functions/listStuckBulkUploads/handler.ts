import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClaims, isAdmin } from "../shared/auth.js";
import { jsonResponse } from "../shared/response.js";
import { BULK_STAGING_PREFIX, parseBulkStagingKey } from "../shared/photoPaths.js";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET_NAME = process.env.BUCKET_NAME;
const DEFAULT_MIN_AGE_SECONDS = 300;

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!BUCKET_NAME) {
      return jsonResponse(event, 500, { message: "BUCKET_NAME is not configured." }, "GET,OPTIONS");
    }

    const claims = getClaims(event);
    if (!isAdmin(claims)) {
      return jsonResponse(event, 403, { message: "Admin access required." }, "GET,OPTIONS");
    }

    const minAgeParam = event.queryStringParameters?.minAgeSeconds;
    const parsedMinAge = minAgeParam ? Number.parseInt(minAgeParam, 10) : NaN;
    const minAgeSeconds = Number.isInteger(parsedMinAge) && parsedMinAge >= 0
      ? parsedMinAge
      : DEFAULT_MIN_AGE_SECONDS;

    const now = Date.now();
    const items: { folderId: string; fileName: string; key: string; ageSeconds: number }[] = [];
    let continuationToken: string | undefined;

    do {
      const list = await s3.send(new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: BULK_STAGING_PREFIX,
        ContinuationToken: continuationToken,
      }));

      for (const obj of list.Contents ?? []) {
        if (!obj.Key || !obj.LastModified) continue;
        const ageSeconds = Math.floor((now - obj.LastModified.getTime()) / 1000);
        if (ageSeconds < minAgeSeconds) continue;
        const parsed = parseBulkStagingKey(obj.Key);
        if (!parsed) continue;
        items.push({ folderId: parsed.folderId, fileName: parsed.fileName, key: obj.Key, ageSeconds });
      }

      continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
    } while (continuationToken);

    return jsonResponse(event, 200, { items }, "GET,OPTIONS");
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(event, 500, { message: "Failed to list stuck uploads.", error: message }, "GET,OPTIONS");
  }
};
