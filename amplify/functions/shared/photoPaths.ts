export const PHOTO_VARIANTS = {
  full: "full",
  thumb: "thumb",
} as const;

export type PhotoVariant = (typeof PHOTO_VARIANTS)[keyof typeof PHOTO_VARIANTS];

export type PhotoIdentity = {
  canonicalKey: string;
  folderId: string;
  fileName: string;
  variant: PhotoVariant | "legacy";
};

export type ManagedPhotoKeys = {
  canonicalKey: string;
  legacyKey: string;
  fullKey: string;
  thumbnailKey: string;
  folderId: string;
  fileName: string;
  isLegacy: boolean;
};

export function sanitizeFolderId(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim().replace(/^\/+|\/+$/g, "");
  if (!trimmed) return null;
  if (!/^[a-zA-Z0-9/_-]+$/.test(trimmed)) return null;
  return trimmed;
}

export function buildCanonicalPhotoKey(folderId: string, fileName: string) {
  return `${sanitizeRequiredFolderId(folderId)}/${sanitizeRequiredFileName(fileName)}`;
}

export function buildLegacyPhotoKey(folderId: string, fileName: string) {
  return buildCanonicalPhotoKey(folderId, fileName);
}

export function buildFullPhotoKey(folderId: string, fileName: string) {
  return `${sanitizeRequiredFolderId(folderId)}/${PHOTO_VARIANTS.full}/${sanitizeRequiredFileName(fileName)}`;
}

export function buildThumbnailPhotoKey(folderId: string, fileName: string) {
  return `${sanitizeRequiredFolderId(folderId)}/${PHOTO_VARIANTS.thumb}/${sanitizeRequiredFileName(fileName)}`;
}

export function buildPhotoUrls(cloudfrontDomain: string, folderId: string, fileName: string) {
  const baseUrl = `https://${cloudfrontDomain}`.replace(/\/+$/, "");
  return {
    url: `${baseUrl}/${encodeS3Key(buildFullPhotoKey(folderId, fileName))}`,
    thumbnailUrl: `${baseUrl}/${encodeS3Key(buildThumbnailPhotoKey(folderId, fileName))}`,
  };
}

export function getManagedPhotoKeysFromStorageKey(
  sourceKey: string,
  override?: { folderId?: string; fileName?: string },
): ManagedPhotoKeys | null {
  const identity = parsePhotoIdentity(sourceKey);
  if (!identity) return null;

  const folderId = override?.folderId
    ? sanitizeRequiredFolderId(override.folderId)
    : identity.folderId;
  const fileName = override?.fileName
    ? sanitizeRequiredFileName(override.fileName)
    : identity.fileName;

  return {
    canonicalKey: buildCanonicalPhotoKey(folderId, fileName),
    legacyKey: buildLegacyPhotoKey(folderId, fileName),
    fullKey: buildFullPhotoKey(folderId, fileName),
    thumbnailKey: buildThumbnailPhotoKey(folderId, fileName),
    folderId,
    fileName,
    isLegacy: identity.variant === "legacy",
  };
}

export function parsePhotoIdentity(key: string): PhotoIdentity | null {
  const normalized = key.trim().replace(/^\/+|\/+$/g, "");
  if (!normalized) return null;

  const segments = normalized.split("/");
  if (segments.length < 2) return null;

  const fileName = segments[segments.length - 1] ?? "";
  if (!fileName) return null;

  const maybeVariant = segments[segments.length - 2];
  if (maybeVariant === PHOTO_VARIANTS.full || maybeVariant === PHOTO_VARIANTS.thumb) {
    const folderId = segments.slice(0, -2).join("/");
    if (!folderId) return null;
    return {
      canonicalKey: buildCanonicalPhotoKey(folderId, fileName),
      folderId,
      fileName,
      variant: maybeVariant,
    };
  }

  const folderId = segments.slice(0, -1).join("/");
  if (!folderId) return null;
  return {
    canonicalKey: buildCanonicalPhotoKey(folderId, fileName),
    folderId,
    fileName,
    variant: "legacy",
  };
}

export function isDirectPhotoObjectKey(key: string, folderId: string, variant?: PhotoVariant) {
  const identity = parsePhotoIdentity(key);
  if (!identity) return false;
  if (identity.folderId !== folderId) return false;
  if (variant && identity.variant !== variant) return false;
  return true;
}

export function encodeS3Key(key: string) {
  return encodeURIComponent(key).replace(/%2F/g, "/");
}

function sanitizeRequiredFolderId(folderId: string) {
  const normalized = sanitizeFolderId(folderId);
  if (!normalized) {
    throw new Error("Invalid folderId.");
  }
  return normalized;
}

function sanitizeRequiredFileName(fileName: string) {
  const normalized = fileName.trim().replace(/^\/+|\/+$/g, "");
  if (!normalized) {
    throw new Error("Invalid fileName.");
  }
  if (normalized.includes("/")) {
    throw new Error("fileName must not include path separators.");
  }
  return normalized;
}
