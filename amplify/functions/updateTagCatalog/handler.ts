import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { updateTagCatalogEntry } from "../shared/tagMetadata.js";

const TAG_CATALOG_TABLE_NAME = process.env.TAG_CATALOG_TABLE_NAME;

type RequestBody = {
  tagKey?: string;
  label?: string;
  showOnHome?: boolean;
  sortOrder?: number;
};

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const claims = getClaims(event);
    if (!isAdmin(claims)) {
      return response(403, { message: "Admin access required." });
    }

    const body = parseBody(event);
    if (typeof body?.showOnHome !== "boolean" && typeof body?.sortOrder !== "number") {
      return response(400, { message: "showOnHome or sortOrder is required." });
    }

    const tag = await updateTagCatalogEntry({
      tableName: TAG_CATALOG_TABLE_NAME,
      tagKey: body.tagKey,
      label: body.label,
      showOnHome: body.showOnHome,
      sortOrder: body.sortOrder,
    });

    return response(200, { tag });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return response(500, { message: "Failed to update tag catalog.", error: message });
  }
};

function parseBody(event: APIGatewayProxyEvent): RequestBody | null {
  if (!event.body) return null;
  try {
    return typeof event.body === "string"
      ? (JSON.parse(event.body) as RequestBody)
      : (event.body as RequestBody);
  } catch {
    return null;
  }
}

function getClaims(event: APIGatewayProxyEvent) {
  const authorizer = event.requestContext.authorizer as
    | { claims?: Record<string, string> }
    | { jwt?: { claims?: Record<string, string> } }
    | undefined;

  if (authorizer && "claims" in authorizer) return authorizer.claims;
  if (authorizer && "jwt" in authorizer) return authorizer.jwt?.claims;
  return undefined;
}

function isAdmin(claims?: Record<string, string>) {
  const groups = claims?.["cognito:groups"];
  return Boolean(groups && groups.includes("admin"));
}

function response(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}
