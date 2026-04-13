import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchGetCommand,
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export type PhotoTagMetadata = {
  photoKey: string;
  tags: string[];
  tagKeys: string[];
  updatedAt: string;
};

type TagRecord = {
  tagKey: string;
  label: string;
  createdAt: string;
  updatedAt: string;
};

export function normalizeTagLabel(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function buildTagKey(value: string) {
  return normalizeTagLabel(value).toLowerCase();
}

export function normalizeTags(values: string[]) {
  const seen = new Map<string, string>();

  for (const rawValue of values) {
    const label = normalizeTagLabel(rawValue);
    if (!label) continue;
    const tagKey = buildTagKey(label);
    if (!tagKey || seen.has(tagKey)) continue;
    seen.set(tagKey, label);
  }

  return Array.from(seen.entries())
    .sort((a, b) => a[1].localeCompare(b[1], undefined, { sensitivity: "base" }))
    .map(([tagKey, label]) => ({ tagKey, label }));
}

export async function getPhotoTagsMap(
  tableName: string | undefined,
  photoKeys: string[],
) {
  if (!tableName || photoKeys.length === 0) {
    return new Map<string, string[]>();
  }

  const uniqueKeys = Array.from(new Set(photoKeys.filter(Boolean)));
  const results = new Map<string, string[]>();

  for (let index = 0; index < uniqueKeys.length; index += 100) {
    const chunk = uniqueKeys.slice(index, index + 100);
    const response = await ddb.send(
      new BatchGetCommand({
        RequestItems: {
          [tableName]: {
            Keys: chunk.map((photoKey) => ({ photoKey })),
          },
        },
      }),
    );

    const items = response.Responses?.[tableName] as PhotoTagMetadata[] | undefined;
    for (const item of items ?? []) {
      results.set(item.photoKey, Array.isArray(item.tags) ? item.tags : []);
    }
  }

  return results;
}

export async function listKnownTags(
  tableName: string | undefined,
  query?: string,
) {
  if (!tableName) return [];

  const normalizedQuery = normalizeTagLabel(query ?? "").toLowerCase();
  const tags: TagRecord[] = [];
  let exclusiveStartKey: Record<string, unknown> | undefined;

  do {
    const response = await ddb.send(
      new ScanCommand({
        TableName: tableName,
        ExclusiveStartKey: exclusiveStartKey,
      }),
    );

    const items = response.Items as TagRecord[] | undefined;
    for (const item of items ?? []) {
      const label = typeof item.label === "string" ? item.label : "";
      const tagKey = typeof item.tagKey === "string" ? item.tagKey : buildTagKey(label);
      if (!label || !tagKey) continue;

      if (
        normalizedQuery &&
        !label.toLowerCase().includes(normalizedQuery) &&
        !tagKey.includes(normalizedQuery)
      ) {
        continue;
      }

      tags.push({
        tagKey,
        label,
        createdAt: item.createdAt ?? "",
        updatedAt: item.updatedAt ?? "",
      });
    }

    exclusiveStartKey = response.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return tags.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
}

export async function syncPhotoTags(params: {
  photoMetadataTableName?: string;
  tagCatalogTableName?: string;
  tagAssignmentsTableName?: string;
  photoKey: string;
  tags: string[];
}) {
  const {
    photoMetadataTableName,
    tagCatalogTableName,
    tagAssignmentsTableName,
    photoKey,
    tags,
  } = params;

  if (!photoMetadataTableName || !tagCatalogTableName || !tagAssignmentsTableName || !photoKey) {
    return [];
  }

  const normalizedTags = normalizeTags(tags);
  const now = new Date().toISOString();

  const previous = await ddb.send(
    new GetCommand({
      TableName: photoMetadataTableName,
      Key: { photoKey },
    }),
  );

  const previousItem = previous.Item as PhotoTagMetadata | undefined;
  const previousTagKeys = new Set(
    Array.isArray(previousItem?.tagKeys)
      ? previousItem!.tagKeys
      : Array.isArray(previousItem?.tags)
      ? previousItem!.tags.map(buildTagKey)
      : [],
  );

  const nextTagKeys = new Set(normalizedTags.map((tag) => tag.tagKey));

  if (normalizedTags.length === 0) {
    if (previousItem) {
      await ddb.send(
        new DeleteCommand({
          TableName: photoMetadataTableName,
          Key: { photoKey },
        }),
      );
    }
  } else {
    await ddb.send(
      new PutCommand({
        TableName: photoMetadataTableName,
        Item: {
          photoKey,
          tags: normalizedTags.map((tag) => tag.label),
          tagKeys: normalizedTags.map((tag) => tag.tagKey),
          updatedAt: now,
        } satisfies PhotoTagMetadata,
      }),
    );
  }

  for (const tag of normalizedTags) {
    await ddb.send(
      new PutCommand({
        TableName: tagCatalogTableName,
        Item: {
          tagKey: tag.tagKey,
          label: tag.label,
          createdAt: now,
          updatedAt: now,
        } satisfies TagRecord,
      }),
    );
  }

  for (const tag of normalizedTags) {
    await ddb.send(
      new PutCommand({
        TableName: tagAssignmentsTableName,
        Item: {
          tagKey: tag.tagKey,
          photoKey,
          label: tag.label,
          createdAt: now,
          updatedAt: now,
        },
      }),
    );
  }

  for (const previousTagKey of previousTagKeys) {
    if (nextTagKeys.has(previousTagKey)) continue;
    await ddb.send(
      new DeleteCommand({
        TableName: tagAssignmentsTableName,
        Key: {
          tagKey: previousTagKey,
          photoKey,
        },
      }),
    );
  }

  return normalizedTags.map((tag) => tag.label);
}

export async function copyPhotoTags(params: {
  photoMetadataTableName?: string;
  tagCatalogTableName?: string;
  tagAssignmentsTableName?: string;
  sourcePhotoKey: string;
  destinationPhotoKey: string;
}) {
  const {
    photoMetadataTableName,
    tagCatalogTableName,
    tagAssignmentsTableName,
    sourcePhotoKey,
    destinationPhotoKey,
  } = params;

  if (!photoMetadataTableName || !sourcePhotoKey || !destinationPhotoKey) {
    return [];
  }

  const source = await ddb.send(
    new GetCommand({
      TableName: photoMetadataTableName,
      Key: { photoKey: sourcePhotoKey },
    }),
  );

  const item = source.Item as PhotoTagMetadata | undefined;
  const sourceTags = Array.isArray(item?.tags) ? item.tags : [];
  return syncPhotoTags({
    photoMetadataTableName,
    tagCatalogTableName,
    tagAssignmentsTableName,
    photoKey: destinationPhotoKey,
    tags: sourceTags,
  });
}

export async function movePhotoTags(params: {
  photoMetadataTableName?: string;
  tagCatalogTableName?: string;
  tagAssignmentsTableName?: string;
  sourcePhotoKey: string;
  destinationPhotoKey: string;
}) {
  const copiedTags = await copyPhotoTags(params);
  await deletePhotoTags({
    photoMetadataTableName: params.photoMetadataTableName,
    tagAssignmentsTableName: params.tagAssignmentsTableName,
    photoKey: params.sourcePhotoKey,
  });
  return copiedTags;
}

export async function deletePhotoTags(params: {
  photoMetadataTableName?: string;
  tagAssignmentsTableName?: string;
  photoKey: string;
}) {
  const { photoMetadataTableName, tagAssignmentsTableName, photoKey } = params;
  if (!photoMetadataTableName || !tagAssignmentsTableName || !photoKey) {
    return;
  }

  const existing = await ddb.send(
    new GetCommand({
      TableName: photoMetadataTableName,
      Key: { photoKey },
    }),
  );

  const item = existing.Item as PhotoTagMetadata | undefined;
  const tagKeys = Array.isArray(item?.tagKeys)
    ? item!.tagKeys
    : Array.isArray(item?.tags)
    ? item!.tags.map(buildTagKey)
    : [];

  if (item) {
    await ddb.send(
      new DeleteCommand({
        TableName: photoMetadataTableName,
        Key: { photoKey },
      }),
    );
  }

  for (const tagKey of tagKeys) {
    await ddb.send(
      new DeleteCommand({
        TableName: tagAssignmentsTableName,
        Key: { tagKey, photoKey },
      }),
    );
  }
}

export async function listPhotoKeysForTag(
  tagAssignmentsTableName: string | undefined,
  tag: string,
) {
  if (!tagAssignmentsTableName) return [];

  const tagKey = buildTagKey(tag);
  if (!tagKey) return [];

  const response = await ddb.send(
    new QueryCommand({
      TableName: tagAssignmentsTableName,
      KeyConditionExpression: "tagKey = :tagKey",
      ExpressionAttributeValues: {
        ":tagKey": tagKey,
      },
    }),
  );

  return (response.Items ?? [])
    .map((item) => (typeof item.photoKey === "string" ? item.photoKey : ""))
    .filter(Boolean);
}
