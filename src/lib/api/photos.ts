import { authFetchJson, publicFetchJson } from "./client";
import type { PhotoListResponse } from "./types";

type PhotoListParams = {
  excludeKeys?: string[];
  limit?: number;
  tag?: string;
  /** Omit for the default shuffled sample; "newest" returns the most recent first. */
  sort?: "newest";
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

type UploadItem = {
  imageName: string;
  image: string;
  thumbnailImage?: string;
  thumbnailContentType?: string;
  tags?: string[];
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
