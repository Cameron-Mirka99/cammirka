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

/**
 * One-off/occasional maintenance action: retallies every tag's stored
 * usage count from the tagAssignments table. Needed once to seed counts
 * for tags that existed before the counter was introduced, and safe to
 * re-run any time to correct any drift.
 */
export function recomputeTagCounts(): Promise<{
  tagsUpdated: number;
  totalAssignments: number;
}> {
  return authFetchJson("/recompute-tag-counts", { method: "POST" });
}

export type BatchTagResult = {
  photoKey: string;
  tags: string[];
  ok: boolean;
  message?: string;
};

export function updatePhotoTagsBatch(
  updates: { photoKey: string; tags: string[] }[]
): Promise<{ results: BatchTagResult[] }> {
  return authFetchJson("/photo-tags", {
    method: "POST",
    body: JSON.stringify({ updates }),
  });
}
