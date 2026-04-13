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

export type TagRecord = {
  tagKey: string;
  label: string;
  createdAt: string;
  updatedAt: string;
  showOnHome: boolean;
  sortOrder: number;
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
        showOnHome: typeof item.showOnHome === "boolean" ? item.showOnHome : true,
        sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : Number.MAX_SAFE_INTEGER,
      });
    }

    exclusiveStartKey = response.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return tags.sort((a, b) =>
    a.sortOrder === b.sortOrder
      ? a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
      : a.sortOrder - b.sortOrder,
  );
}

async function getNextTagSortOrder(tableName: string) {
  const tags = await listKnownTags(tableName);
  if (tags.length === 0) return 0;
  return Math.max(...tags.map((tag) => (typeof tag.sortOrder === "number" ? tag.sortOrder : 0))) + 1;
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
  let nextSortOrder = -1;

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
    const existing = await ddb.send(
      new GetCommand({
        TableName: tagCatalogTableName,
        Key: { tagKey: tag.tagKey },
      }),
    );

    const existingTag = existing.Item as Partial<TagRecord> | undefined;
    if (typeof existingTag?.sortOrder !== "number") {
      if (nextSortOrder < 0) {
        nextSortOrder = await getNextTagSortOrder(tagCatalogTableName);
      }
    }

    await ddb.send(
      new PutCommand({
        TableName: tagCatalogTableName,
        Item: {
          tagKey: tag.tagKey,
          label: tag.label,
          createdAt: typeof existingTag?.createdAt === "string" ? existingTag.createdAt : now,
          updatedAt: now,
          showOnHome: typeof existingTag?.showOnHome === "boolean" ? existingTag.showOnHome : true,
          sortOrder: typeof existingTag?.sortOrder === "number" ? existingTag.sortOrder : nextSortOrder++,
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

export async function updateTagCatalogEntry(params: {
  tableName: string | undefined;
  tagKey?: string;
  label?: string;
  showOnHome?: boolean;
  sortOrder?: number;
}) {
  const { tableName, tagKey, label, showOnHome, sortOrder } = params;
  if (!tableName) {
    throw new Error("Tag catalog table is not configured.");
  }

  const normalizedLabel = typeof label === "string" ? normalizeTagLabel(label) : "";
  const resolvedTagKey = typeof tagKey === "string" && tagKey.trim()
    ? tagKey.trim().toLowerCase()
    : buildTagKey(normalizedLabel);

  if (!resolvedTagKey) {
    throw new Error("tagKey or label is required.");
  }

  const now = new Date().toISOString();
  const existing = await ddb.send(
    new GetCommand({
      TableName: tableName,
      Key: { tagKey: resolvedTagKey },
    }),
  );

  const existingTag = existing.Item as Partial<TagRecord> | undefined;
  const nextLabel = normalizedLabel || (typeof existingTag?.label === "string" ? existingTag.label : "");

  if (!nextLabel) {
    throw new Error("A label is required to update this tag.");
  }

  const nextRecord: TagRecord = {
    tagKey: resolvedTagKey,
    label: nextLabel,
    createdAt: typeof existingTag?.createdAt === "string" ? existingTag.createdAt : now,
    updatedAt: now,
    showOnHome: typeof showOnHome === "boolean" ? showOnHome : typeof existingTag?.showOnHome === "boolean" ? existingTag.showOnHome : true,
    sortOrder: typeof sortOrder === "number" ? sortOrder : typeof existingTag?.sortOrder === "number" ? existingTag.sortOrder : await getNextTagSortOrder(tableName),
  };

  await ddb.send(
    new PutCommand({
      TableName: tableName,
      Item: nextRecord,
    }),
  );

  return nextRecord;
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
