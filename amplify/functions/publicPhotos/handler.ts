import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  encodeS3Key,
  isDirectPhotoObjectKey,
  parsePhotoIdentity,
} from "../shared/photoPaths.js";
import {
  getPhotoTagsMap,
  listPhotoKeysForTag,
} from "../shared/tagMetadata.js";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET = process.env.BUCKET_NAME;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;
const PHOTO_METADATA_TABLE_NAME = process.env.PHOTO_METADATA_TABLE_NAME;
const TAG_ASSIGNMENTS_TABLE_NAME = process.env.TAG_ASSIGNMENTS_TABLE_NAME;
const MAX_SCAN = Number.parseInt(process.env.MAX_SCAN ?? "20000", 10);
const DEFAULT_LIMIT = Number.parseInt(process.env.DEFAULT_LIMIT ?? "200", 10);
const PUBLIC_PREFIX = "public/";

type ListedPhoto = {
  canonicalKey: string;
  fullKey?: string;
  thumbnailKey?: string;
  legacyKey?: string;
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

    let excludeKeys: string[] = [];
    let limit = DEFAULT_LIMIT;
    let requestedTag: string | undefined;

    if (event?.body) {
      try {
        const body = (typeof event.body === "string"
          ? JSON.parse(event.body)
          : event.body) as { excludeKeys?: string[]; limit?: number; tag?: string };
        if (Array.isArray(body.excludeKeys)) excludeKeys = body.excludeKeys;
        if (Number.isInteger(body.limit) && (body.limit ?? 0) > 0) {
          limit = body.limit!;
        }
        if (typeof body.tag === "string") {
          requestedTag = body.tag;
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
      if (query.tag) {
        requestedTag = query.tag;
      }
    }

    const excludeSet = new Set(excludeKeys);
    const candidates = new Map<string, ListedPhoto>();
    let scanned = 0;
    let continuationToken: string | undefined;

    do {
      const list = await s3.send(
        new ListObjectsV2Command({
          Bucket: BUCKET,
          ContinuationToken: continuationToken,
          Prefix: PUBLIC_PREFIX,
        }),
      );

      const contents = list.Contents ?? [];
      for (const obj of contents) {
        scanned++;
        if (scanned > MAX_SCAN) break;
        if (!obj.Key || obj.Size === 0) continue;
        if (!isDirectPhotoObjectKey(obj.Key, "public")) continue;
        const identity = parsePhotoIdentity(obj.Key);
        if (!identity) continue;

        const current = candidates.get(identity.canonicalKey) ?? {
          canonicalKey: identity.canonicalKey,
        };
        if (identity.variant === "full") {
          current.fullKey = obj.Key;
        } else if (identity.variant === "thumb") {
          current.thumbnailKey = obj.Key;
        } else {
          current.legacyKey = obj.Key;
        }
        candidates.set(identity.canonicalKey, current);
      }

      if (scanned > MAX_SCAN) break;

      continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
    } while (continuationToken);

    const taggedPhotoKeys = requestedTag
      ? new Set(await listPhotoKeysForTag(TAG_ASSIGNMENTS_TABLE_NAME, requestedTag))
      : null;

    const eligiblePhotos = Array.from(candidates.values()).filter((photo) => {
      const primaryKey = photo.fullKey ?? photo.legacyKey;
      if (!primaryKey) {
        return false;
      }

      if (taggedPhotoKeys && !taggedPhotoKeys.has(photo.canonicalKey)) {
        return false;
      }

      return !excludeSet.has(photo.canonicalKey) && !excludeSet.has(primaryKey);
    });
    const selectedPhotos = samplePhotos(eligiblePhotos, limit);
    const baseUrl = `https://${CLOUDFRONT_DOMAIN.replace(/\/+$/, "")}`;
    const photoTags = await getPhotoTagsMap(
      PHOTO_METADATA_TABLE_NAME,
      selectedPhotos.map((photo) => photo.canonicalKey),
    );
    const photos = selectedPhotos.map((photo) => {
      const storageKey = photo.fullKey ?? photo.legacyKey;
      const thumbnailKey = photo.thumbnailKey ?? photo.fullKey ?? photo.legacyKey;
      return {
        key: photo.canonicalKey,
        storageKey,
        url: `${baseUrl}/${encodeS3Key(storageKey!)}`,
        thumbnailUrl: `${baseUrl}/${encodeS3Key(thumbnailKey!)}`,
        tags: photoTags.get(photo.canonicalKey) ?? [],
      };
    });

    return response(200, {
      photos,
      meta: {
        requested: limit,
        returned: photos.length,
        excludedCount: excludeSet.size,
        scanned,
        eligibleCount: eligiblePhotos.length,
        folderId: "public",
        tag: requestedTag ?? null,
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

function samplePhotos<T>(items: T[], limit: number) {
  if (items.length <= limit) return items;
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled.slice(0, limit);
}
