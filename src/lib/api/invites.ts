import { authFetchJson } from "./client";

export function acceptInvite(inviteCode: string): Promise<{ folderId: string }> {
  return authFetchJson("/accept-invite", {
    method: "POST",
    body: JSON.stringify({ inviteCode }),
  });
}

export function createInvite(input: {
  folderId: string;
  expiresInDays?: number;
}): Promise<{ inviteCode: string; folderId: string; expiresAt: number }> {
  return authFetchJson("/invites", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
