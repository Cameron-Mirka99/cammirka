import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClaims, isAdmin } from "../shared/auth.js";
import { jsonResponse } from "../shared/response.js";
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
      return jsonResponse(event, 403, { message: "Admin access required." }, "POST,OPTIONS");
    }

    const body = parseBody(event);
    if (typeof body?.showOnHome !== "boolean" && typeof body?.sortOrder !== "number") {
      return jsonResponse(event, 400, { message: "showOnHome or sortOrder is required." }, "POST,OPTIONS");
    }

    const tag = await updateTagCatalogEntry({
      tableName: TAG_CATALOG_TABLE_NAME,
      tagKey: body.tagKey,
      label: body.label,
      showOnHome: body.showOnHome,
      sortOrder: body.sortOrder,
    });

    return jsonResponse(event, 200, { tag }, "POST,OPTIONS");
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(event, 500, { message: "Failed to update tag catalog.", error: message }, "POST,OPTIONS");
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

