import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const USER_POOL_ID = process.env.USER_POOL_ID;

const cognito = new CognitoIdentityProviderClient({});

type CognitoAttribute = { Name?: string; Value?: string };

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!USER_POOL_ID) {
      return response(500, { message: "Server configuration is incomplete." });
    }

    const claims = getClaims(event);
    if (!isAdmin(claims)) {
      return response(403, { message: "Admin access required." });
    }

    const users: Array<{
      username: string;
      email?: string;
      name?: string;
      givenName?: string;
      familyName?: string;
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
          status: user.UserStatus,
          enabled: user.Enabled,
          createdAt: user.UserCreateDate?.toISOString(),
          lastModifiedAt: user.UserLastModifiedDate?.toISOString(),
        });
      }

      paginationToken = result.PaginationToken;
    } while (paginationToken);

    return response(200, { users });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return response(500, { message: "Failed to list users.", error: message });
  }
};

function getAttribute(attrs: CognitoAttribute[], name: string) {
  return attrs.find((attr) => attr.Name === name)?.Value;
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
  if (!groups) return false;
  return groups.includes("admin");
}

function response(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}
