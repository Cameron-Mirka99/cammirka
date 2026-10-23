import { authFetchJson } from "./client";
import type { FolderSummary, FolderUser, UserFolder } from "./types";

export function fetchAllFolders(): Promise<{ folders: FolderSummary[] }> {
  return authFetchJson("/folders", { method: "GET" });
}

export function fetchUserFolders(): Promise<{ folders: UserFolder[] }> {
  return authFetchJson("/user-folders", { method: "GET" });
}

export function createFolder(input: {
  folderId: string;
  displayName?: string;
  likeLimit?: number;
  bulkRetentionDays?: number;
}): Promise<FolderSummary> {
  return authFetchJson("/folders", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteFolder(folderId: string): Promise<{ folderId: string }> {
  return authFetchJson("/folders", {
    method: "DELETE",
    body: JSON.stringify({ folderId }),
  });
}

/** likeLimit only -- bulkRetentionDays is creation-time-only, rejected server-side. */
export function updateFolder(input: {
  folderId: string;
  likeLimit: number;
}): Promise<{ folderId: string; likeLimit: number }> {
  return authFetchJson("/folders", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function fetchFolderUsers(folderId: string): Promise<{
  folderId: string;
  users: FolderUser[];
  bannedUsers: FolderUser[];
}> {
  return authFetchJson(`/folder-users?folderId=${encodeURIComponent(folderId)}`, {
    method: "GET",
  });
}

export function addFolderUser(input: {
  folderId: string;
  username: string;
}): Promise<{ folderId: string; username: string }> {
  return authFetchJson("/folder-users-add", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function removeFolderUser(input: {
  folderId: string;
  username: string;
}): Promise<{ folderId: string; username: string }> {
  return authFetchJson("/folder-users-remove", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function unbanFolderUser(input: {
  folderId: string;
  username: string;
}): Promise<{ folderId: string; username: string }> {
  return authFetchJson("/folder-users-unban", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function backfillFolderUsers(): Promise<{
  scanned: number;
  updated: number;
}> {
  return authFetchJson("/folder-users-backfill", { method: "POST" });
}
