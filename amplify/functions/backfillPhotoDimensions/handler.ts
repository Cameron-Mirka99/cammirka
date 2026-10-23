import { GetObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { Jimp } from "jimp";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClaims, isAdmin } from "../shared/auth.js";
import { jsonResponse } from "../shared/response.js";
import { parsePhotoIdentity } from "../shared/photoPaths.js";
import { getPhotoMetadataMap, updatePhotoDimensions } from "../shared/tagMetadata.js";

const BUCKET_NAME = process.env.BUCKET_NAME;
const PHOTO_METADATA_TABLE_NAME = process.env.PHOTO_METADATA_TABLE_NAME;
const MAX_SCAN = Number.parseInt(process.env.MAX_SCAN ?? "50000", 10);
const DEFAULT_BATCH_SIZE = 10;
const MAX_BATCH_SIZE = 50;

const s3 = new S3Client({ region: process.env.AWS_REGION });

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!BUCKET_NAME || !PHOTO_METADATA_TABLE_NAME) {
      return jsonResponse(event, 500, { message: "Server configuration is incomplete." }, "POST,OPTIONS");
    }

    const claims = getClaims(event);
    if (!isAdmin(claims)) {
      return jsonResponse(event, 403, { message: "Admin access required." }, "POST,OPTIONS");
    }

    const body = parseBody(event);
    const batchSize = Math.min(
      MAX_BATCH_SIZE,
      Math.max(1, Number.isInteger(body?.batchSize) ? body!.batchSize! : DEFAULT_BATCH_SIZE),
    );

    // Full-resolution candidates only — thumb variants are skipped, since
    // dimensions must come from the full image, not the thumbnail.
    const candidates = new Map<string, string>();
    let scanned = 0;
    let continuationToken: string | undefined;

    do {
      const list = await s3.send(
        new ListObjectsV2Command({ Bucket: BUCKET_NAME, ContinuationToken: continuationToken }),
      );

      for (const obj of list.Contents ?? []) {
        scanned++;
        if (scanned > MAX_SCAN) break;
        if (!obj.Key || obj.Size === 0) continue;
        const identity = parsePhotoIdentity(obj.Key);
        if (!identity || identity.variant === "thumb") continue;
        if (!candidates.has(identity.canonicalKey)) {
          candidates.set(identity.canonicalKey, obj.Key);
        }
      }

      if (scanned > MAX_SCAN) break;
      continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
    } while (continuationToken);

    const allCanonicalKeys = Array.from(candidates.keys());
    const existingMeta = await getPhotoMetadataMap(PHOTO_METADATA_TABLE_NAME, allCanonicalKeys);
    const needsDimensions = allCanonicalKeys.filter((key) => {
      const meta = existingMeta.get(key);
      return !(typeof meta?.width === "number" && typeof meta?.height === "number");
    });

    const batch = needsDimensions.slice(0, batchSize);
    const results = await Promise.all(
      batch.map(async (canonicalKey) => {
        const storageKey = candidates.get(canonicalKey)!;
        try {
          const object = await s3.send(
            new GetObjectCommand({ Bucket: BUCKET_NAME, Key: storageKey }),
          );
          const buffer = Buffer.from(await object.Body!.transformToByteArray());
          const image = await Jimp.read(buffer);
          await updatePhotoDimensions({
            photoMetadataTableName: PHOTO_METADATA_TABLE_NAME,
            photoKey: canonicalKey,
            width: image.width,
            height: image.height,
          });
          return { canonicalKey, ok: true };
        } catch (error) {
          console.error(`Failed to backfill dimensions for ${canonicalKey}`, error);
          return { canonicalKey, ok: false };
        }
      }),
    );

    const updated = results.filter((r) => r.ok).length;
    const failed = results.length - updated;
    const remaining = needsDimensions.length - results.length;

    return jsonResponse(event, 200, {
      totalMissing: needsDimensions.length,
      processed: results.length,
      updated,
      failed,
      remaining,
      done: remaining <= 0,
    }, "POST,OPTIONS");
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(event, 500, { message: "Failed to backfill photo dimensions.", error: message }, "POST,OPTIONS");
  }
};

function parseBody(event: APIGatewayProxyEvent): { batchSize?: number } | null {
  if (!event.body) return null;
  try {
    return typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  } catch {
    return null;
  }
}
