import { authFetchJson, publicFetchJson } from "./client";
import type { PhotoCategory, PhotoListResponse } from "./types";

type PhotoListParams = {
  excludeKeys?: string[];
  limit?: number;
  tag?: string;
  /** Omit for the default shuffled sample; "newest" returns the most recent first. */
  sort?: "newest";
  category?: PhotoCategory;
  likedOnly?: boolean;
};

export function fetchPublicPhotos(
  params: PhotoListParams = {}
): Promise<PhotoListResponse> {
  return publicFetchJson<PhotoListResponse>("/public-photos", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function fetchFolderPhotos(
  params: PhotoListParams & { folderId?: string } = {},
  options: { signal?: AbortSignal } = {}
): Promise<PhotoListResponse> {
  return authFetchJson<PhotoListResponse>("/photos", {
    method: "POST",
    body: JSON.stringify(params),
    signal: options.signal,
  });
}

export function fetchPhotoDownloadUrl(
  storageKey: string
): Promise<{ url: string; fileName: string }> {
  return authFetchJson("/photo-download", {
    method: "POST",
    body: JSON.stringify({ storageKey }),
  });
}

export function movePhoto(input: {
  sourceKey: string;
  destinationFolderId: string;
}): Promise<{ sourceKey: string; destinationKey: string; photoKey: string }> {
  return authFetchJson("/move-photo", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function duplicatePhoto(input: {
  sourceKey: string;
  destinationFolderId: string;
  destinationFileName?: string;
}): Promise<{ sourceKey: string; destinationKey: string; photoKey: string }> {
  return authFetchJson("/duplicate-photo", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deletePhoto(
  key: string
): Promise<{ deletedKey: string; deletedKeys: string[] }> {
  return authFetchJson("/delete-photo", {
    method: "POST",
    body: JSON.stringify({ key }),
  });
}

export function toggleLike(input: {
  photoKey: string;
  folderId: string;
}): Promise<{ photoKey: string; liked: boolean; likedCount: number }> {
  return authFetchJson("/toggle-like", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

type UploadItem = {
  imageName: string;
  image: string;
  thumbnailImage?: string;
  thumbnailContentType?: string;
  tags?: string[];
  category?: PhotoCategory;
};

type UploadResult = {
  imageName: string;
  ok: boolean;
  key?: string;
  message?: string;
};

export async function uploadImage(
  folderId: string,
  item: UploadItem
): Promise<UploadResult> {
  const res = await authFetchJson<{ results: UploadResult[] }>(
    "/upload-image",
    {
      method: "POST",
      body: JSON.stringify({ folderId, ...item }),
    }
  );
  return res.results[0];
}

export type PresignedBulkUpload = {
  fileName: string;
  ok: boolean;
  finalFileName?: string;
  key?: string;
  uploadUrl?: string;
  message?: string;
};

/** For the external bulk-upload app: a presigned S3 PUT URL per file, no API Gateway payload limit. */
export function presignBulkUpload(input: {
  folderId: string;
  files: { fileName: string; contentType: string }[];
}): Promise<{ uploads: PresignedBulkUpload[] }> {
  return authFetchJson("/presign-bulk-upload", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type StuckBulkUpload = {
  folderId: string;
  fileName: string;
  key: string;
  ageSeconds: number;
};

export function fetchStuckBulkUploads(
  minAgeSeconds?: number
): Promise<{ items: StuckBulkUpload[] }> {
  const query = minAgeSeconds ? `?minAgeSeconds=${minAgeSeconds}` : "";
  return authFetchJson(`/stuck-bulk-uploads${query}`, { method: "GET" });
}

export type BackfillDimensionsResult = {
  totalMissing: number;
  processed: number;
  updated: number;
  failed: number;
  remaining: number;
  done: boolean;
};

/** One batch per call — loop until `done` to backfill every photo. */
export function backfillPhotoDimensions(
  batchSize?: number
): Promise<BackfillDimensionsResult> {
  return authFetchJson("/backfill-photo-dimensions", {
    method: "POST",
    body: JSON.stringify({ batchSize }),
  });
}
