import { Jimp } from "jimp";

const THUMBNAIL_MAX_WIDTH = Number.parseInt(process.env.THUMBNAIL_MAX_WIDTH ?? "960", 10);

export function guessContentType(filename: string) {
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

export async function readDimensions(
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

export async function createThumbnail(
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
