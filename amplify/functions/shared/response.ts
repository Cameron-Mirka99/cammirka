import type { APIGatewayProxyEvent } from "aws-lambda";

function resolveAllowedOrigin(event: APIGatewayProxyEvent) {
  const allowed = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const requestOrigin = event.headers?.origin ?? event.headers?.Origin;
  if (requestOrigin && allowed.includes(requestOrigin)) return requestOrigin;
  return undefined;
}

export function jsonResponse(
  event: APIGatewayProxyEvent,
  statusCode: number,
  body: Record<string, unknown>,
  allowedMethods: string,
) {
  const allowedOrigin = resolveAllowedOrigin(event);
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": allowedMethods,
    },
    body: JSON.stringify(body),
  };
}
