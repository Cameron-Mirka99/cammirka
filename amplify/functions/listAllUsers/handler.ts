import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClaims, isAdmin } from "../shared/auth.js";
import { jsonResponse } from "../shared/response.js";

const USER_POOL_ID = process.env.USER_POOL_ID;

const cognito = new CognitoIdentityProviderClient({});

type CognitoAttribute = { Name?: string; Value?: string };

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!USER_POOL_ID) {
      return jsonResponse(event, 500, { message: "Server configuration is incomplete." }, "GET,OPTIONS");
    }

    const claims = getClaims(event);
    if (!isAdmin(claims)) {
      return jsonResponse(event, 403, { message: "Admin access required." }, "GET,OPTIONS");
    }

    const users: Array<{
      username: string;
      email?: string;
      name?: string;
      givenName?: string;
      familyName?: string;
      folderId?: string;
      status?: string;
      enabled?: boolean;
      createdAt?: string;
      lastModifiedAt?: string;
    }> = [];

    let paginationToken: string | undefined;
    do {
      const result = await cognito.send(
        new ListUsersCommand({
          UserPoolId: USER_POOL_ID,
          Limit: 60,
          PaginationToken: paginationToken,
        }),
      );

      for (const user of result.Users ?? []) {
        if (!user.Username) continue;
        const attrs = user.Attributes ?? [];
        users.push({
          username: user.Username,
          email: getAttribute(attrs, "email"),
          name: getAttribute(attrs, "name"),
          givenName: getAttribute(attrs, "given_name"),
          familyName: getAttribute(attrs, "family_name"),
          folderId: getAttribute(attrs, "custom:folderId"),
          status: user.UserStatus,
          enabled: user.Enabled,
          createdAt: user.UserCreateDate?.toISOString(),
          lastModifiedAt: user.UserLastModifiedDate?.toISOString(),
        });
      }

      paginationToken = result.PaginationToken;
    } while (paginationToken);

    return jsonResponse(event, 200, { users }, "GET,OPTIONS");
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(event, 500, { message: "Failed to list users.", error: message }, "GET,OPTIONS");
  }
};

function getAttribute(attrs: CognitoAttribute[], name: string) {
  return attrs.find((attr) => attr.Name === name)?.Value;
}

