import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import type { APIGatewayProxyHandlerV2 } from "aws-lambda";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET = process.env.BUCKET_NAME;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;
const MAX_SCAN = Number.parseInt(process.env.MAX_SCAN ?? "20000", 10);
const DEFAULT_LIMIT = Number.parseInt(process.env.DEFAULT_LIMIT ?? "200", 10);

type RequestBody = {
  excludeKeys?: string[];
  limit?: number;
};

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    if (!BUCKET) {
      return response(500, { message: "BUCKET_NAME is not configured" });
    }
    if (!CLOUDFRONT_DOMAIN) {
      return response(500, { message: "CLOUDFRONT_DOMAIN is not configured" });
    }

    let excludeKeys: string[] = [];
    let limit = DEFAULT_LIMIT;

    if (event?.body) {
      try {
        const body = (typeof event.body === "string"
          ? JSON.parse(event.body)
          : event.body) as RequestBody;
        if (Array.isArray(body.excludeKeys)) excludeKeys = body.excludeKeys;
        if (Number.isInteger(body.limit) && (body.limit ?? 0) > 0) {
          limit = body.limit!;
        }
      } catch {
        // ignore body parse errors
      }
    }

    const query = event?.queryStringParameters;
    if (query) {
      if (query.exclude) {
        excludeKeys = excludeKeys.concat(
          query.exclude
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
        );
      }
      if (query.limit) {
        const parsed = Number.parseInt(query.limit, 10);
        if (Number.isInteger(parsed) && parsed > 0) {
          limit = parsed;
        }
      }
    }

    const excludeSet = new Set(excludeKeys);
    const reservoir: string[] = [];
    let eligibleCount = 0;
    let scanned = 0;
    let continuationToken: string | undefined;

    do {
      const list = await s3.send(
        new ListObjectsV2Command({
          Bucket: BUCKET,
          ContinuationToken: continuationToken,
        }),
      );

      const contents = list.Contents ?? [];
      for (const obj of contents) {
        scanned++;
        if (scanned > MAX_SCAN) break;
        if (!obj.Key || obj.Size === 0 || excludeSet.has(obj.Key)) continue;

        eligibleCount++;

        if (reservoir.length < limit) {
          reservoir.push(obj.Key);
        } else {
          const j = Math.floor(Math.random() * eligibleCount);
          if (j < limit) reservoir[j] = obj.Key;
        }
      }

      if (scanned > MAX_SCAN) break;

      continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
    } while (continuationToken);

    const baseUrl = `https://${CLOUDFRONT_DOMAIN}`.replace(/\/+$/, "");
    const photos = reservoir.map((key) => ({
      key,
      url: `${baseUrl}/${encodeURI(key)}`,
    }));

    return response(200, {
      photos,
      meta: {
        requested: limit,
        returned: photos.length,
        excludedCount: excludeSet.size,
        scanned,
        eligibleCount,
      },
    });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return response(500, { message: "Error fetching photos", error: message });
  }
};

function response(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}
