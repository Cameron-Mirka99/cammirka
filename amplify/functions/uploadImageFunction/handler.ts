import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET_NAME = process.env.BUCKET_NAME;
const FOLDERS_TABLE_NAME = process.env.FOLDERS_TABLE_NAME;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!BUCKET_NAME || !FOLDERS_TABLE_NAME) {
      return response(500, { message: "Server configuration is incomplete." });
    }

    const claims = getClaims(event);
    if (!isAdmin(claims)) {
      return response(403, { message: "Admin access required." });
    }

    const body = parseBody(event);
    const image = body?.image;
    const imageName = body?.imageName;
    const folderId = sanitizeFolderId(body?.folderId);

    if (!folderId) {
      return response(400, {
        message: "folderId is required.",
      });
    }

    const uploads = normalizeUploads(body);
    if (uploads.length === 0) {
      return response(400, {
        message: "At least one image upload is required.",
      });
    }

    if (folderId !== "public") {
      const folderExists = await ddb.send(
        new GetCommand({
          TableName: FOLDERS_TABLE_NAME,
          Key: { folderId },
        }),
      );

      if (!folderExists.Item) {
        return response(404, { message: "Folder does not exist." });
      }
    }

    const results = await Promise.all(
      uploads.map(async (upload) => {
        let imageBuffer: Buffer;
        try {
          imageBuffer = Buffer.from(upload.image, "base64");
        } catch {
          return {
            imageName: upload.imageName,
            ok: false,
            message: "Invalid base64 image.",
          };
        }

        const imageKey = `${folderId}/${upload.imageName}`;

        const putCommand = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: imageKey,
          Body: imageBuffer,
          ContentType:
            guessContentType(upload.imageName) || "application/octet-stream",
        });

        await s3.send(putCommand);

        return {
          imageName: upload.imageName,
          ok: true,
          key: imageKey,
        };
      }),
    );

    const failed = results.filter((entry) => !entry.ok);
    if (failed.length > 0) {
      return response(207, {
        message: "Some uploads failed.",
        results,
      });
    }

    return response(200, {
      message: `Uploaded ${results.length} image(s) successfully.`,
      results,
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return response(500, { message: `Server error: ${message}` });
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

function normalizeUploads(body: {
  image?: string;
  imageName?: string;
  images?: Array<{ image?: string; imageName?: string }>;
}) {
  if (!body) return [];
  if (Array.isArray(body.images)) {
    return body.images
      .map((entry) => ({
        image: typeof entry?.image === "string" ? entry.image : "",
        imageName:
          typeof entry?.imageName === "string" ? entry.imageName.trim() : "",
      }))
      .filter((entry) => entry.image && entry.imageName);
  }
  if (typeof body.image === "string" && typeof body.imageName === "string") {
    const imageName = body.imageName.trim();
    if (!imageName) return [];
    return [{ image: body.image, imageName }];
  }
  return [];
}

function sanitizeFolderId(value?: string) {
  if (!value) return null;
  const trimmed = value.trim().replace(/^\/+|\/+$/g, "");
  if (!trimmed) return null;
  if (!/^[a-zA-Z0-9/_-]+$/.test(trimmed)) return null;
  return trimmed;
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

function isAdmin(claims?: Record<string, string>) {
  const groups = claims?.["cognito:groups"];
  if (!groups) return false;
  return groups.includes("admin");
}

function response(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
    },
    body: JSON.stringify(body),
  };
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
    default:
      return null;
  }
}
