import { describe, it, expect, vi, beforeEach } from "vitest";
import { authFetch } from "./client";

vi.mock("aws-amplify/auth", () => ({
  fetchAuthSession: vi.fn(),
}));

import { fetchAuthSession } from "aws-amplify/auth";

describe("authFetch", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}")));
  });

  it("sends the raw ID token with no Bearer prefix when signed in", async () => {
    (fetchAuthSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      tokens: { idToken: { toString: () => "raw-token-value" } },
    });

    await authFetch("/photos");

    const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const headers = call[1].headers as Headers;
    expect(headers.get("Authorization")).toBe("raw-token-value");
  });

  it("omits the Authorization header entirely when signed out", async () => {
    (fetchAuthSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      tokens: undefined,
    });

    await authFetch("/public-photos");

    const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const headers = call[1].headers as Headers;
    expect(headers.has("Authorization")).toBe(false);
  });

  it("omits the Authorization header when the session fetch throws", async () => {
    (fetchAuthSession as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("no session")
    );

    await authFetch("/public-photos");

    const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const headers = call[1].headers as Headers;
    expect(headers.has("Authorization")).toBe(false);
  });
});
