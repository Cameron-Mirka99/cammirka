import { acceptInvite } from "@/lib/api/invites";

const STORAGE_KEY = "inviteCode";

/** Call once on the login page mount to capture ?invite= before it's lost to the auth flow. */
export function captureInviteFromUrl(inviteParam: string | null) {
  if (inviteParam) {
    window.localStorage.setItem(STORAGE_KEY, inviteParam);
  }
}

export function getStoredInviteCode(): string | null {
  return window.localStorage.getItem(STORAGE_KEY);
}

export function clearStoredInviteCode() {
  window.localStorage.removeItem(STORAGE_KEY);
}

/**
 * Redeems the stored invite code, if any, right after sign-in. On failure
 * the code is deliberately left in place so the next successful sign-in
 * retries it, mirroring the old app's behavior.
 */
export async function redeemStoredInvite(): Promise<
  | { status: "none" }
  | { status: "redeemed"; folderId: string }
  | { status: "error"; message: string }
> {
  const code = getStoredInviteCode();
  if (!code) return { status: "none" };

  try {
    const { folderId } = await acceptInvite(code);
    clearStoredInviteCode();
    return { status: "redeemed", folderId };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Could not redeem invite.",
    };
  }
}
