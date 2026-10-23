import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClaims, isAdmin } from "../shared/auth.js";
import { jsonResponse } from "../shared/response.js";

const USER_POOL_ID = process.env.USER_POOL_ID;
const FOLDER_USERS_TABLE_NAME = process.env.FOLDER_USERS_TABLE_NAME;

const cognito = new CognitoIdentityProviderClient({});
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

type CognitoAttribute = { Name?: string; Value?: string };

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!USER_POOL_ID || !FOLDER_USERS_TABLE_NAME) {
      return jsonResponse(event, 500, { message: "Server configuration is incomplete." }, "POST,OPTIONS");
    }

    const claims = getClaims(event);
    if (!isAdmin(claims)) {
      return jsonResponse(event, 403, { message: "Admin access required." }, "POST,OPTIONS");
    }

    let paginationToken: string | undefined;
    let scanned = 0;
    let updated = 0;

    do {
      const result = await cognito.send(
        new ListUsersCommand({
          UserPoolId: USER_POOL_ID,
          Limit: 60,
          PaginationToken: paginationToken,
        }),
      );

      for (const user of result.Users ?? []) {
        scanned += 1;
        const username = user.Username;
        if (!username) continue;
        const folderId = getAttribute(user.Attributes ?? [], "custom:folderId");
        if (!folderId) continue;

        await ddb.send(
          new PutCommand({
            TableName: FOLDER_USERS_TABLE_NAME,
            Item: {
              folderId,
              username,
              createdAt: new Date().toISOString(),
            },
          }),
        );
        updated += 1;
      }

      paginationToken = result.PaginationToken;
    } while (paginationToken);

    return jsonResponse(event, 200, { scanned, updated }, "POST,OPTIONS");
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(
      event,
      500,
      { message: "Failed to backfill folder users.", error: message },
      "POST,OPTIONS",
    );
  }
};

function getAttribute(attrs: CognitoAttribute[], name: string) {
  return attrs.find((attr) => attr.Name === name)?.Value;
}

