import { authFetchJson } from "./client";
import type { FolderUser } from "./types";

export function fetchAllUsers(): Promise<{ users: FolderUser[] }> {
  return authFetchJson("/users", { method: "GET" });
}

export function updateUser(input: {
  username: string;
  givenName: string;
  familyName: string;
}): Promise<{ username: string; givenName: string; familyName: string; name: string }> {
  return authFetchJson("/users/update", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
