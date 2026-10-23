import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

/**
 * Checks FolderUsersTable for an existing (folderId, username) link.
 * Shared by every handler that needs to know whether a non-admin caller
 * may act within a given folder (list its photos, download from it, like
 * a bulk photo in it).
 */
export async function isFolderMember(
  ddb: DynamoDBDocumentClient,
  tableName: string | undefined,
  username: string,
  folderId: string,
) {
  if (!tableName) return false;

  const result = await ddb.send(
    new GetCommand({
      TableName: tableName,
      Key: { folderId, username },
    }),
  );

  return Boolean(result.Item);
}
