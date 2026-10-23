import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClaims, isAdmin } from "../shared/auth.js";
import { jsonResponse } from "../shared/response.js";
import { listKnownTags } from "../shared/tagMetadata.js";

const TAG_CATALOG_TABLE_NAME = process.env.TAG_CATALOG_TABLE_NAME;

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const isPublicRead = event.httpMethod === "GET";
    const claims = getClaims(event);
    if (!isPublicRead && !isAdmin(claims)) {
      return jsonResponse(event, 403, { message: "Admin access required." }, "GET,POST,OPTIONS");
    }

    const body = parseBody(event);
    const query =
      typeof body?.query === "string"
        ? body.query
        : typeof event.queryStringParameters?.query === "string"
        ? event.queryStringParameters.query
        : "";

    const tags = await listKnownTags(TAG_CATALOG_TABLE_NAME, query);
    return jsonResponse(event, 200, { tags }, "GET,POST,OPTIONS");
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(event, 500, { message: "Failed to list tags.", error: message }, "GET,POST,OPTIONS");
  }
};

function parseBody(event: APIGatewayProxyEvent) {
  if (!event.body) return null;
  try {
    return typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  } catch {
    return null;
  }
}

