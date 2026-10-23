import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClaims, isAdmin } from "../shared/auth.js";
import { isFolderMember } from "../shared/folderAccess.js";
import { jsonResponse } from "../shared/response.js";
import {
  encodeS3Key,
  isDirectPhotoObjectKey,
  parsePhotoIdentity,
  sanitizeFolderId,
} from "../shared/photoPaths.js";
import {
  getPhotoMetadataMap,
  listPhotoKeysForTag,
  type PhotoCategory,
} from "../shared/tagMetadata.js";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const BUCKET = process.env.BUCKET_NAME;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;
const FOLDER_USERS_TABLE_NAME = process.env.FOLDER_USERS_TABLE_NAME;
const PHOTO_METADATA_TABLE_NAME = process.env.PHOTO_METADATA_TABLE_NAME;
const TAG_ASSIGNMENTS_TABLE_NAME = process.env.TAG_ASSIGNMENTS_TABLE_NAME;
const MAX_SCAN = Number.parseInt(process.env.MAX_SCAN ?? "20000", 10);
const DEFAULT_LIMIT = Number.parseInt(process.env.DEFAULT_LIMIT ?? "200", 10);

type RequestBody = {
  excludeKeys?: string[];
  limit?: number;
  tag?: string;
  sort?: string;
  category?: string;
  likedOnly?: boolean;
};

type ListedPhoto = {
  canonicalKey: string;
  fullKey?: string;
  thumbnailKey?: string;
  legacyKey?: string;
  lastModified?: Date;
};

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!BUCKET) {
      return jsonResponse(event, 500, { message: "BUCKET_NAME is not configured" }, "POST,GET,OPTIONS");
    }
    if (!CLOUDFRONT_DOMAIN) {
      return jsonResponse(event, 500, { message: "CLOUDFRONT_DOMAIN is not configured" }, "POST,GET,OPTIONS");
    }

    const claims = getClaims(event);
    if (!claims) {
      return jsonResponse(event, 401, { message: "Unauthorized." }, "POST,GET,OPTIONS");
    }

    const isAdminUser = isAdmin(claims);

    let excludeKeys: string[] = [];
    let limit = DEFAULT_LIMIT;
    let requestedFolderId: string | undefined;
    let requestedTag: string | undefined;
    let sortNewest = false;
    let requestedCategory: PhotoCategory | undefined;
    let likedOnly = false;

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
        if (typeof body.tag === "string") {
          requestedTag = body.tag;
        }
        if (body.sort === "newest") {
          sortNewest = true;
        }
        if (body.category === "bulk" || body.category === "final") {
          requestedCategory = body.category;
        }
        if (body.likedOnly === true) {
          likedOnly = true;
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
      if (query.tag) {
        requestedTag = query.tag;
      }
      if (query.sort === "newest") {
        sortNewest = true;
      }
      if (query.category === "bulk" || query.category === "final") {
        requestedCategory = query.category;
      }
      if (query.likedOnly === "true") {
        likedOnly = true;
      }
    }

    const username =
      claims["cognito:username"] ?? claims.username ?? claims.sub;

    let folderId: string | null = null;
    if (isAdminUser && requestedFolderId) {
      folderId = sanitizeFolderId(requestedFolderId);
    } else if (!isAdminUser && requestedFolderId) {
      if (!FOLDER_USERS_TABLE_NAME) {
        return jsonResponse(event, 500, { message: "FOLDER_USERS_TABLE_NAME is not configured." }, "POST,GET,OPTIONS");
      }
      if (!username) {
        return jsonResponse(event, 401, { message: "Unauthorized." }, "POST,GET,OPTIONS");
      }
      const allowed = await isFolderMember(ddb, FOLDER_USERS_TABLE_NAME, username, requestedFolderId);
      if (!allowed) {
        return jsonResponse(event, 403, { message: "Folder access not available." }, "POST,GET,OPTIONS");
      }
      folderId = sanitizeFolderId(requestedFolderId);
    }

    if (!folderId) {
      folderId = sanitizeFolderId(claims["custom:folderId"]);
    }

    if (!folderId) {
      return jsonResponse(event, 403, { message: "Folder access not available." }, "POST,GET,OPTIONS");
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
          Prefix: `${folderId}/`,
        }),
      );

      const contents = list.Contents ?? [];
      for (const obj of contents) {
        scanned++;
        if (scanned > MAX_SCAN) break;
        if (!obj.Key || obj.Size === 0) continue;
        if (!isDirectPhotoObjectKey(obj.Key, folderId)) continue;
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
        if (obj.LastModified) current.lastModified = obj.LastModified;
        candidates.set(identity.canonicalKey, current);
      }

      if (scanned > MAX_SCAN) break;

      continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
    } while (continuationToken);

    const taggedPhotoKeys = requestedTag
      ? new Set(await listPhotoKeysForTag(TAG_ASSIGNMENTS_TABLE_NAME, requestedTag))
      : null;

    let eligiblePhotos = Array.from(candidates.values()).filter((photo) => {
      const primaryKey = photo.fullKey ?? photo.legacyKey;
      if (!primaryKey) {
        return false;
      }

      if (taggedPhotoKeys && !taggedPhotoKeys.has(photo.canonicalKey)) {
        return false;
      }

      return !excludeSet.has(photo.canonicalKey) && !excludeSet.has(primaryKey);
    });

    // category/likedOnly need metadata for the FULL candidate set before
    // sampling/limiting, not just the post-sample set -- otherwise a random
    // 200-item sample could filter down to near-nothing. Only pay this extra
    // BatchGetItem cost when a caller actually asks for these filters.
    const needsFullMetadata = Boolean(requestedCategory) || likedOnly;
    let photoMeta: Awaited<ReturnType<typeof getPhotoMetadataMap>> | undefined;

    if (needsFullMetadata) {
      photoMeta = await getPhotoMetadataMap(
        PHOTO_METADATA_TABLE_NAME,
        eligiblePhotos.map((photo) => photo.canonicalKey),
      );
      eligiblePhotos = eligiblePhotos.filter((photo) => {
        const meta = photoMeta!.get(photo.canonicalKey);
        if (requestedCategory && meta?.category !== requestedCategory) return false;
        if (likedOnly && !meta?.liked) return false;
        return true;
      });
    }

    const selectedPhotos = sortNewest
      ? sortByNewest(eligiblePhotos).slice(0, limit)
      : samplePhotos(eligiblePhotos, limit);
    const baseUrl = `https://${CLOUDFRONT_DOMAIN.replace(/\/+$/, "")}`;
    if (!needsFullMetadata) {
      photoMeta = await getPhotoMetadataMap(
        PHOTO_METADATA_TABLE_NAME,
        selectedPhotos.map((photo) => photo.canonicalKey),
      );
    }
    const photos = selectedPhotos.map((photo) => {
      const storageKey = photo.fullKey ?? photo.legacyKey;
      const thumbnailKey = photo.thumbnailKey ?? photo.fullKey ?? photo.legacyKey;
      const meta = photoMeta!.get(photo.canonicalKey);
      return {
        key: photo.canonicalKey,
        storageKey,
        url: `${baseUrl}/${encodeS3Key(storageKey!)}`,
        thumbnailUrl: `${baseUrl}/${encodeS3Key(thumbnailKey!)}`,
        tags: meta?.tags ?? [],
        width: meta?.width,
        height: meta?.height,
        category: meta?.category ?? "final",
        liked: meta?.liked ?? false,
        lastModified: photo.lastModified?.toISOString(),
      };
    });

    return jsonResponse(event, 200, {
      photos,
      meta: {
        requested: limit,
        returned: photos.length,
        excludedCount: excludeSet.size,
        scanned,
        eligibleCount: eligiblePhotos.length,
        folderId,
        tag: requestedTag ?? null,
      },
    }, "POST,GET,OPTIONS");
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse(event, 500, { message: "Error fetching photos", error: message }, "POST,GET,OPTIONS");
  }
};


function samplePhotos<T>(items: T[], limit: number) {
  if (items.length <= limit) return items;
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled.slice(0, limit);
}

function sortByNewest(items: ListedPhoto[]) {
  return [...items].sort((a, b) => {
    const aTime = a.lastModified?.getTime() ?? 0;
    const bTime = b.lastModified?.getTime() ?? 0;
    return bTime - aTime;
  });
}
