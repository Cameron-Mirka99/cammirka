import { createThumbnailFile, toBase64 } from "./resizeImage";
import type { PhotoCategory } from "@/lib/api/types";

const MAX_UPLOAD_REQUEST_BYTES = 10 * 1024 * 1024;

export function exceedsUploadLimit(bytes: number) {
  return bytes > MAX_UPLOAD_REQUEST_BYTES;
}

export function getUploadLimitBytes() {
  return MAX_UPLOAD_REQUEST_BYTES;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export type UploadPayload = {
  imageName: string;
  image: string;
  thumbnailImage: string;
  thumbnailContentType: string;
  tags: string[];
  category: PhotoCategory;
};

export async function buildUploadPayload(
  file: File,
  tags: string[],
  category: PhotoCategory = "final"
): Promise<UploadPayload> {
  const image = await toBase64(file);
  const thumbnail = await createThumbnailFile(file);

  return {
    imageName: file.name,
    image,
    thumbnailImage: await toBase64(thumbnail),
    thumbnailContentType: thumbnail.type || file.type || "image/jpeg",
    tags,
    category,
  };
}

/** Per-file pre-flight check against the 10MB request cap before ever hitting the network. */
export function requestByteSize(payload: UploadPayload, folderId: string) {
  return new Blob([JSON.stringify({ folderId, ...payload })]).size;
}
