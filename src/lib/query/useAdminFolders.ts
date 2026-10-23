import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAllFolders,
  createFolder as createFolderApi,
  deleteFolder as deleteFolderApi,
} from "@/lib/api/folders";
import type { FolderSummary } from "@/lib/api/types";
import { queryKeys } from "./keys";

export function useAdminFolders() {
  return useQuery({
    queryKey: queryKeys.adminFolders,
    queryFn: async () => (await fetchAllFolders()).folders,
  });
}

export function useCreateFolder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createFolderApi,
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.adminFolders }),
  });
}

export function useDeleteFolder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteFolderApi,
    onMutate: async (folderId: string) => {
      await client.cancelQueries({ queryKey: queryKeys.adminFolders });
      const previous = client.getQueryData<FolderSummary[]>(queryKeys.adminFolders);
      client.setQueryData<FolderSummary[]>(
        queryKeys.adminFolders,
        (prev) => prev?.filter((f) => f.folderId !== folderId) ?? []
      );
      return { previous };
    },
    onError: (_err, _folderId, context) => {
      if (context?.previous) {
        client.setQueryData(queryKeys.adminFolders, context.previous);
      }
    },
    onSettled: () => client.invalidateQueries({ queryKey: queryKeys.adminFolders }),
  });
}
