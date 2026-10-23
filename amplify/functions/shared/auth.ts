import type { APIGatewayProxyEvent } from "aws-lambda";

/**
 * The REST API's CognitoUserPoolsAuthorizer flattens `cognito:groups` into a
 * bracketed, comma-separated string (e.g. "[admin]" or "[admin, editors]"),
 * not a JSON array — this parses that into a real list.
 */
export function parseGroups(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((group) => group.trim())
    .filter(Boolean);
}

export function getClaims(event: APIGatewayProxyEvent) {
  const authorizer = event.requestContext.authorizer as
    | { claims?: Record<string, string> }
    | { jwt?: { claims?: Record<string, string> } }
    | undefined;

  if (authorizer && "claims" in authorizer) return authorizer.claims;
  if (authorizer && "jwt" in authorizer) return authorizer.jwt?.claims;
  return undefined;
}

/** Exact group membership — not a substring match on the raw claim string. */
export function isAdmin(claims?: Record<string, string>) {
  return parseGroups(claims?.["cognito:groups"]).includes("admin");
}
