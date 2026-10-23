export type Photo = {
  key: string;
  storageKey?: string;
  url: string;
  thumbnailUrl?: string;
  title?: string;
  tags?: string[];
};

export type PhotoListMeta = {
  requested: number;
  returned: number;
  excludedCount: number;
  scanned: number;
  eligibleCount: number;
  folderId: string;
  tag?: string;
};

export type PhotoListResponse = {
  photos: Photo[];
  meta: PhotoListMeta;
};

export type TagRecord = {
  tagKey: string;
  label: string;
  createdAt?: string;
  updatedAt?: string;
  showOnHome: boolean;
  sortOrder: number;
};

export type FolderSummary = {
  folderId: string;
  displayName?: string;
  createdAt?: string;
  createdBy?: string;
};

export type FolderUser = {
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
  bannedAt?: string;
};

export type UserFolder = {
  folderId: string;
  displayName?: string;
};
