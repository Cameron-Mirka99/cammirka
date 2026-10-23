import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  captureInviteFromUrl,
  getStoredInviteCode,
  redeemStoredInvite,
} from "./inviteCode";

vi.mock("@/lib/api/invites", () => ({
  acceptInvite: vi.fn(),
}));
import { acceptInvite } from "@/lib/api/invites";

describe("invite code localStorage round trip", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it("stores the invite param from the URL", () => {
    captureInviteFromUrl("abc123");
    expect(getStoredInviteCode()).toBe("abc123");
  });

  it("does nothing when there is no invite param", () => {
    captureInviteFromUrl(null);
    expect(getStoredInviteCode()).toBeNull();
  });

  it("survives a simulated reload (new read of the same storage)", () => {
    captureInviteFromUrl("survives-reload");
    // Simulate a fresh page load reading storage again.
    expect(getStoredInviteCode()).toBe("survives-reload");
  });

  it("clears the code on successful redemption", async () => {
    captureInviteFromUrl("redeem-me");
    (acceptInvite as ReturnType<typeof vi.fn>).mockResolvedValue({
      folderId: "folder-1",
    });

    const result = await redeemStoredInvite();

    expect(result).toEqual({ status: "redeemed", folderId: "folder-1" });
    expect(getStoredInviteCode()).toBeNull();
  });

  it("leaves the code in place on redemption failure, for retry on next sign-in", async () => {
    captureInviteFromUrl("retry-me");
    (acceptInvite as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("expired")
    );

    const result = await redeemStoredInvite();

    expect(result.status).toBe("error");
    expect(getStoredInviteCode()).toBe("retry-me");
  });

  it("reports status none when nothing is stored", async () => {
    const result = await redeemStoredInvite();
    expect(result).toEqual({ status: "none" });
    expect(acceptInvite).not.toHaveBeenCalled();
  });
});
