export const queryKeys = {
  tagsPublic: ["tags", "public"] as const,
  adminFolders: ["admin", "folders"] as const,
  adminFolderUsers: (folderId: string) => ["admin", "folder-users", folderId] as const,
  adminUsers: ["admin", "users"] as const,
  adminFolderPhotos: (folderId: string) => ["admin", "folder-photos", folderId] as const,
};
