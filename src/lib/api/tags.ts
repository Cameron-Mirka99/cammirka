import { authFetchJson, publicFetchJson } from "./client";
import type { TagRecord } from "./types";

export function fetchPublicTags(query?: string): Promise<{ tags: TagRecord[] }> {
  const qs = query ? `?query=${encodeURIComponent(query)}` : "";
  return publicFetchJson(`/tags${qs}`, { method: "GET" });
}

export function searchTagsAsAdmin(query?: string): Promise<{ tags: TagRecord[] }> {
  return authFetchJson("/tags", {
    method: "POST",
    body: JSON.stringify({ query }),
  });
}

export function updateTagCatalog(input: {
  tagKey: string;
  label?: string;
  showOnHome?: boolean;
  sortOrder?: number;
}): Promise<{ tag: TagRecord }> {
  return authFetchJson("/tag-catalog", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updatePhotoTags(input: {
  photoKey: string;
  tags: string[];
}): Promise<{ photoKey: string; tags: string[] }> {
  return authFetchJson("/photo-tags", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
