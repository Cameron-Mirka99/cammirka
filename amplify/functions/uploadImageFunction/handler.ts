import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Jimp } from "jimp";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClaims, isAdmin } from "../shared/auth.js";
import { jsonResponse } from "../shared/response.js";
import {
  buildCanonicalPhotoKey,
  buildFullPhotoKey,
  buildThumbnailPhotoKey,
  sanitizeFolderId,
} from "../shared/photoPaths.js";
import { syncPhotoTags, type PhotoCategory } from "../shared/tagMetadata.js";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET_NAME = process.env.BUCKET_NAME;
const FOLDERS_TABLE_NAME = process.env.FOLDERS_TABLE_NAME;
const PHOTO_METADATA_TABLE_NAME = process.env.PHOTO_METADATA_TABLE_NAME;
const TAG_CATALOG_TABLE_NAME = process.env.TAG_CATALOG_TABLE_NAME;
const TAG_ASSIGNMENTS_TABLE_NAME = process.env.TAG_ASSIGNMENTS_TABLE_NAME;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const THUMBNAIL_MAX_WIDTH = Number.parseInt(process.env.THUMBNAIL_MAX_WIDTH ?? "960", 10);

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
      return jsonResponse(event, 400, {
        message: "folderId is required.",
      }, "POST,OPTIONS");
    }

    const uploads = normalizeUploads(body);
    if (uploads.length === 0) {
      return jsonResponse(event, 400, {
        message: "At least one image upload is required.",
      }, "POST,OPTIONS");
    }

    // Belt-and-suspenders alongside publicPhotos's own filter: a client's
    // private bulk-review photo must never be reachable through the public
    // gallery's folder.
    if (folderId === "public" && uploads.some((upload) => upload.category === "bulk")) {
      return jsonResponse(event, 400, {
        message: "Bulk-category photos cannot be uploaded to the public folder.",
      }, "POST,OPTIONS");
    }

    if (folderId !== "public") {
      const folderExists = await ddb.send(
        new GetCommand({
          TableName: FOLDERS_TABLE_NAME,
          Key: { folderId },
        }),
      );

      if (!folderExists.Item) {
        return jsonResponse(event, 404, { message: "Folder does not exist." }, "POST,OPTIONS");
      }
    }

    const results = await Promise.all(
      uploads.map(async (upload) => {
        let imageBuffer: Buffer;
        let thumbnailBuffer: Buffer | null = null;
        try {
          imageBuffer = Buffer.from(upload.image, "base64");
        } catch {
          return {
            imageName: upload.imageName,
            ok: false,
            message: "Invalid base64 image.",
          };
        }

        if (upload.thumbnailImage) {
          try {
            thumbnailBuffer = Buffer.from(upload.thumbnailImage, "base64");
          } catch {
            thumbnailBuffer = null;
          }
        }

        const canonicalKey = buildCanonicalPhotoKey(folderId, upload.imageName);
        const fullKey = buildFullPhotoKey(folderId, upload.imageName);
        const thumbnailKey = buildThumbnailPhotoKey(folderId, upload.imageName);
        const contentType =
          guessContentType(upload.imageName) || "application/octet-stream";
        const thumbnail = await createThumbnail(
          thumbnailBuffer ?? imageBuffer,
          upload.thumbnailContentType || contentType,
        );
        const dimensions = await readDimensions(imageBuffer);

        const putFullCommand = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: fullKey,
          Body: imageBuffer,
          ContentType: contentType,
        });

        const putThumbnailCommand = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: thumbnailKey,
          Body: thumbnail.buffer,
          ContentType: thumbnail.contentType,
        });

        try {
          await s3.send(putFullCommand);
          await s3.send(putThumbnailCommand);
          await syncPhotoTags({
            photoMetadataTableName: PHOTO_METADATA_TABLE_NAME,
            tagCatalogTableName: TAG_CATALOG_TABLE_NAME,
            tagAssignmentsTableName: TAG_ASSIGNMENTS_TABLE_NAME,
            photoKey: canonicalKey,
            tags: upload.tags ?? [],
            attributes: { ...dimensions, category: upload.category },
          });
        } catch (error) {
          await Promise.allSettled([
            deleteObjectIfPresent(fullKey),
            deleteObjectIfPresent(thumbnailKey),
          ]);
          throw error;
        }

        return {
          imageName: upload.imageName,
          ok: true,
          key: canonicalKey,
          fullKey,
          thumbnailKey,
          tags: upload.tags ?? [],
          category: upload.category,
        };
      }),
    );

    const failed = results.filter((entry) => !entry.ok);
    if (failed.length > 0) {
      return jsonResponse(event, 207, {
        message: "Some uploads failed.",
        results,
      }, "POST,OPTIONS");
    }

    return jsonResponse(event, 200, {
      message: `Uploaded ${results.length} image(s) successfully.`,
      results,
    }, "POST,OPTIONS");
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(event, 500, { message: `Server error: ${message}` }, "POST,OPTIONS");
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

function normalizeCategory(value: unknown): PhotoCategory {
  return value === "bulk" ? "bulk" : "final";
}

function normalizeUploads(body: {
  image?: string;
  imageName?: string;
  thumbnailImage?: string;
  thumbnailContentType?: string;
  tags?: string[];
  category?: string;
  images?: Array<{
    image?: string;
    imageName?: string;
    thumbnailImage?: string;
    thumbnailContentType?: string;
    tags?: string[];
    category?: string;
  }>;
}) {
  if (!body) return [];
  if (Array.isArray(body.images)) {
    return body.images
      .map((entry) => ({
        image: typeof entry?.image === "string" ? entry.image : "",
        imageName:
          typeof entry?.imageName === "string" ? entry.imageName.trim() : "",
        thumbnailImage:
          typeof entry?.thumbnailImage === "string" ? entry.thumbnailImage : "",
        thumbnailContentType:
          typeof entry?.thumbnailContentType === "string"
            ? entry.thumbnailContentType
            : "",
        tags: Array.isArray(entry?.tags)
          ? entry.tags.filter((tag): tag is string => typeof tag === "string")
          : [],
        category: normalizeCategory(entry?.category),
      }))
      .filter((entry) => entry.image && entry.imageName);
  }
  if (typeof body.image === "string" && typeof body.imageName === "string") {
    const imageName = body.imageName.trim();
    if (!imageName) return [];
    return [{
      image: body.image,
      imageName,
      thumbnailImage:
        typeof body.thumbnailImage === "string" ? body.thumbnailImage : "",
      thumbnailContentType:
        typeof body.thumbnailContentType === "string"
          ? body.thumbnailContentType
          : "",
      tags: Array.isArray(body.tags)
        ? body.tags.filter((tag): tag is string => typeof tag === "string")
        : [],
      category: normalizeCategory(body.category),
    }];
  }
  return [];
}


function guessContentType(filename: string) {
  const ext = filename.toLowerCase().split(".").pop();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    default:
      return null;
  }
}

async function readDimensions(
  imageBuffer: Buffer,
): Promise<{ width?: number; height?: number }> {
  try {
    const image = await Jimp.read(imageBuffer);
    return { width: image.width, height: image.height };
  } catch (error) {
    console.error("Could not read image dimensions", error);
    return {};
  }
}

async function createThumbnail(
  imageBuffer: Buffer,
  contentType: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  // GIFs pass through untouched — jimp doesn't round-trip animated GIFs,
  // and preserving the animation matters more than a resized thumbnail.
  if (contentType === "image/gif") {
    return { buffer: imageBuffer, contentType };
  }

  try {
    const image = await Jimp.read(imageBuffer);
    if (image.width > THUMBNAIL_MAX_WIDTH) {
      image.resize({ w: THUMBNAIL_MAX_WIDTH });
    }

    if (contentType === "image/png") {
      return { buffer: await image.getBuffer("image/png"), contentType: "image/png" };
    }
    return {
      buffer: await image.getBuffer("image/jpeg", { quality: 82 }),
      contentType: "image/jpeg",
    };
  } catch (error) {
    console.error("Thumbnail generation failed, using the original image", error);
    return { buffer: imageBuffer, contentType };
  }
}

async function deleteObjectIfPresent(key: string) {
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      }),
    );
  } catch {
    // Best-effort cleanup after partial upload failure.
  }
}
