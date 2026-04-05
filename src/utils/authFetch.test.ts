import { authFetch } from "./authFetch";

const mockFetchAuthSession = jest.fn();
const mockFetch = jest.fn();

jest.mock("aws-amplify/auth", () => ({
  fetchAuthSession: (...args: unknown[]) => mockFetchAuthSession(...args),
}));

describe("authFetch", () => {
  beforeEach(() => {
    mockFetchAuthSession.mockReset();
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it("adds the Cognito id token to the Authorization header", async () => {
    mockFetchAuthSession.mockResolvedValue({
      tokens: {
        idToken: {
          toString: () => "token-123",
        },
      },
    });
    mockFetch.mockResolvedValue(new Response(null, { status: 200 }));

    await authFetch("https://api.example.com/private", { method: "GET" });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/private",
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );

    const headers = mockFetch.mock.calls[0][1].headers as Headers;
    expect(headers.get("Authorization")).toBe("token-123");
  });

  it("leaves Authorization unset when there is no id token", async () => {
    mockFetchAuthSession.mockResolvedValue({ tokens: undefined });
    mockFetch.mockResolvedValue(new Response(null, { status: 200 }));

    await authFetch("https://api.example.com/public", { method: "GET" });

    const headers = mockFetch.mock.calls[0][1].headers as Headers;
    expect(headers.get("Authorization")).toBeNull();
  });
});
