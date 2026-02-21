import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const BUCKET = process.env.BUCKET_NAME;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;
const FOLDER_USERS_TABLE_NAME = process.env.FOLDER_USERS_TABLE_NAME;
const MAX_SCAN = Number.parseInt(process.env.MAX_SCAN ?? "20000", 10);
const DEFAULT_LIMIT = Number.parseInt(process.env.DEFAULT_LIMIT ?? "200", 10);

type RequestBody = {
  excludeKeys?: string[];
  limit?: number;
};

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!BUCKET) {
      return response(500, { message: "BUCKET_NAME is not configured" });
    }
    if (!CLOUDFRONT_DOMAIN) {
      return response(500, { message: "CLOUDFRONT_DOMAIN is not configured" });
    }

    const claims = getClaims(event);
    if (!claims) {
      return response(401, { message: "Unauthorized." });
    }

    const isAdminUser = isAdmin(claims);

    let excludeKeys: string[] = [];
    let limit = DEFAULT_LIMIT;
    let requestedFolderId: string | undefined;

    if (event?.body) {
      try {
        const body = (typeof event.body === "string"
          ? JSON.parse(event.body)
          : event.body) as RequestBody & { folderId?: string };
        if (Array.isArray(body.excludeKeys)) excludeKeys = body.excludeKeys;
        if (Number.isInteger(body.limit) && (body.limit ?? 0) > 0) {
          limit = body.limit!;
        }
        if (typeof body.folderId === "string") {
          requestedFolderId = body.folderId;
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
      if (query.folderId) {
        requestedFolderId = query.folderId;
      }
    }

    const username =
      claims["cognito:username"] ?? claims.username ?? claims.sub;

    let folderId: string | null = null;
    if (isAdminUser && requestedFolderId) {
      folderId = sanitizeFolderId(requestedFolderId);
    } else if (!isAdminUser && requestedFolderId) {
      if (!FOLDER_USERS_TABLE_NAME) {
        return response(500, { message: "FOLDER_USERS_TABLE_NAME is not configured." });
      }
      if (!username) {
        return response(401, { message: "Unauthorized." });
      }
      const allowed = await isUserInFolder(username, requestedFolderId);
      if (!allowed) {
        return response(403, { message: "Folder access not available." });
      }
      folderId = sanitizeFolderId(requestedFolderId);
    }

    if (!folderId) {
      folderId = sanitizeFolderId(claims["custom:folderId"]);
    }

    if (!folderId) {
      return response(403, { message: "Folder access not available." });
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
          Prefix: `${folderId}/`,
        }),
      );

      const contents = list.Contents ?? [];
      for (const obj of contents) {
        scanned++;
        if (scanned > MAX_SCAN) break;
        if (!obj.Key || obj.Size === 0 || excludeSet.has(obj.Key)) continue;
        if (!isDirectFolderObjectKey(obj.Key, folderId)) continue;

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
        folderId,
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

function getClaims(event: APIGatewayProxyEvent) {
  const authorizer = event.requestContext.authorizer as
    | { claims?: Record<string, string> }
    | { jwt?: { claims?: Record<string, string> } }
    | undefined;

  if (authorizer && "claims" in authorizer) return authorizer.claims;
  if (authorizer && "jwt" in authorizer) return authorizer.jwt?.claims;
  return undefined;
}

function isAdmin(claims: Record<string, string>) {
  const groups = claims["cognito:groups"];
  return typeof groups === "string" && groups.includes("admin");
}

function sanitizeFolderId(value?: string) {
  if (!value) return null;
  const trimmed = value.trim().replace(/^\/+|\/+$/g, "");
  if (!trimmed) return null;
  if (!/^[a-zA-Z0-9/_-]+$/.test(trimmed)) return null;
  return trimmed;
}

function isDirectFolderObjectKey(key: string, folderId: string) {
  const prefix = `${folderId}/`;
  if (!key.startsWith(prefix)) return false;
  const remainder = key.slice(prefix.length);
  if (!remainder) return false;
  return !remainder.includes("/");
}

async function isUserInFolder(username: string, folderId: string) {
  const result = await ddb.send(
    new GetCommand({
      TableName: FOLDER_USERS_TABLE_NAME,
      Key: { folderId, username },
    }),
  );

  return Boolean(result.Item);
}
