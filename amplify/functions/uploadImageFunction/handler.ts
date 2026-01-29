import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { APIGatewayProxyHandlerV2 } from "aws-lambda";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET_NAME = process.env.BUCKET_NAME;

const USERS: Record<string, string> = {
  alice: "password123",
  bob: "securepass456",
};

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    if (!BUCKET_NAME) {
      return response(500, "BUCKET_NAME is not configured");
    }

    const body = JSON.parse(event.body || "{}") as {
      username?: string;
      password?: string;
      image?: string;
      imageName?: string;
    };
    const { username, password, image, imageName } = body;

    if (!username || !password || !image || !imageName) {
      return response(400, "Missing username, password, image, or imageName");
    }

    if (USERS[username] !== password) {
      return response(401, "Invalid username or password");
    }

    let imageBuffer: Buffer;
    try {
      imageBuffer = Buffer.from(image, "base64");
    } catch {
      return response(400, "Invalid base64 image");
    }

    const imageKey = `uploads/${username}/${imageName}`;

    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: imageKey,
      Body: imageBuffer,
      ContentType: guessContentType(imageName) || "application/octet-stream",
    });

    await s3.send(putCommand);

    return response(200, `Image uploaded successfully as ${imageKey}`);
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return response(500, `Server error: ${message}`);
  }
};

function response(statusCode: number, message: string) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
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
