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
  /** Generate a brand-new code and invalidate the old one, instead of reusing it. */
  rotate?: boolean;
}): Promise<{ inviteCode: string; folderId: string; expiresAt: number }> {
  return authFetchJson("/invites", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function revokeInvite(
  folderId: string
): Promise<{ folderId: string; revoked: boolean }> {
  return authFetchJson("/invites", {
    method: "POST",
    body: JSON.stringify({ folderId, revoke: true }),
  });
}
