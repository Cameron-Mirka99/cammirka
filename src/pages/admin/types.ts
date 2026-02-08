export type FolderSummary = {
  folderId: string;
  displayName?: string;
};

export type FolderUser = {
  username: string;
  email?: string;
  name?: string;
  givenName?: string;
  familyName?: string;
  status?: string;
  enabled?: boolean;
  createdAt?: string;
  lastModifiedAt?: string;
  bannedAt?: string;
};
