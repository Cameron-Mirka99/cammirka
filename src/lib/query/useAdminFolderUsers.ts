import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchFolderUsers,
  addFolderUser,
  removeFolderUser,
  unbanFolderUser,
  backfillFolderUsers,
} from "@/lib/api/folders";
import { queryKeys } from "./keys";

export function useFolderUsers(folderId: string | null) {
  return useQuery({
    queryKey: queryKeys.adminFolderUsers(folderId ?? ""),
    queryFn: () => fetchFolderUsers(folderId!),
    enabled: !!folderId,
  });
}

export function useAddFolderUser(folderId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (username: string) => addFolderUser({ folderId, username }),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: queryKeys.adminFolderUsers(folderId) }),
  });
}

export function useRemoveFolderUser(folderId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (username: string) => removeFolderUser({ folderId, username }),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: queryKeys.adminFolderUsers(folderId) }),
  });
}

export function useUnbanFolderUser(folderId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (username: string) => unbanFolderUser({ folderId, username }),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: queryKeys.adminFolderUsers(folderId) }),
  });
}

export function useBackfillFolderUsers() {
  return useMutation({ mutationFn: backfillFolderUsers });
}
