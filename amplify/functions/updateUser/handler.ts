import {
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClaims, isAdmin } from "../shared/auth.js";
import { jsonResponse } from "../shared/response.js";

const USER_POOL_ID = process.env.USER_POOL_ID;

const cognito = new CognitoIdentityProviderClient({});

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!USER_POOL_ID) {
      return jsonResponse(event, 500, { message: "Server configuration is incomplete." }, "POST,OPTIONS");
    }

    const claims = getClaims(event);
    if (!isAdmin(claims)) {
      return jsonResponse(event, 403, { message: "Admin access required." }, "POST,OPTIONS");
    }

    const body = parseBody(event);
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const givenName = typeof body?.givenName === "string" ? body.givenName.trim() : "";
    const familyName = typeof body?.familyName === "string" ? body.familyName.trim() : "";

    if (!username) {
      return jsonResponse(event, 400, { message: "username is required." }, "POST,OPTIONS");
    }

    if (!givenName || !familyName) {
      return jsonResponse(event, 400, { message: "First name and last name are required." }, "POST,OPTIONS");
    }

    await cognito.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        UserAttributes: [
          {
            Name: "given_name",
            Value: givenName,
          },
          {
            Name: "family_name",
            Value: familyName,
          },
          {
            Name: "name",
            Value: `${givenName} ${familyName}`.trim(),
          },
        ],
      }),
    );

    return jsonResponse(event, 200, {
      username,
      givenName,
      familyName,
      name: `${givenName} ${familyName}`.trim(),
    }, "POST,OPTIONS");
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(event, 500, { message: "Failed to update user.", error: message }, "POST,OPTIONS");
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

