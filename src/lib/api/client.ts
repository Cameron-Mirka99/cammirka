import { fetchAuthSession } from "aws-amplify/auth";

export const photoApiBaseUrl = (
  process.env.NEXT_PUBLIC_PHOTO_API_URL ?? ""
).replace(/\/+$/, "");

/**
 * Mirrors the old app's authFetch: sends the raw Cognito ID token (no
 * "Bearer" prefix) as Authorization, since that's the identity source the
 * API Gateway Cognito authorizer expects. No token -> header omitted.
 */
export async function authFetch(path: string, init: RequestInit = {}) {
  let idToken: string | undefined;
  try {
    const session = await fetchAuthSession();
    idToken = session.tokens?.idToken?.toString();
  } catch {
    idToken = undefined;
  }

  const headers = new Headers(init.headers);
  if (idToken) headers.set("Authorization", idToken);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${photoApiBaseUrl}${path}`, { ...init, headers });
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function authFetchJson<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await authFetch(path, init);
  return parseJsonOrThrow<T>(res);
}

/** For routes with no Cognito authorizer (/public-photos, GET /tags). */
export async function publicFetchJson<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${photoApiBaseUrl}${path}`, { ...init, headers });
  return parseJsonOrThrow<T>(res);
}

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    throw new ApiError(res.status, data?.message ?? res.statusText);
  }
  return data as T;
}
