import { fetchAuthSession } from "aws-amplify/auth";

export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  const headers = new Headers(init?.headers || {});
  if (token) {
    headers.set("Authorization", token);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
