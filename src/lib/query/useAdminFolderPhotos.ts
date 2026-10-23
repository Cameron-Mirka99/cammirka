import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchFolderPhotos,
  movePhoto,
  duplicatePhoto,
  deletePhoto,
} from "@/lib/api/photos";
import { updatePhotoTags } from "@/lib/api/tags";
import type { Photo } from "@/lib/api/types";
import { queryKeys } from "./keys";

export function useAdminFolderPhotos(folderId: string | null) {
  return useQuery({
    queryKey: queryKeys.adminFolderPhotos(folderId ?? ""),
    queryFn: async () => {
      const res = await fetchFolderPhotos({ folderId: folderId!, limit: 1000 });
      const prefix = `${folderId}/`;
      const direct = res.photos.filter(
        (p) => p.key.startsWith(prefix) && !p.key.slice(prefix.length).includes("/")
      );
      return Array.from(new Map(direct.map((p) => [p.key, p])).values());
    },
    enabled: !!folderId,
  });
}

function usePhotoListMutation(folderId: string) {
  const client = useQueryClient();
  const key = queryKeys.adminFolderPhotos(folderId);
  return {
    client,
    key,
    snapshot: () => client.getQueryData<Photo[]>(key),
    rollback: (previous: Photo[] | undefined) => {
      if (previous) client.setQueryData(key, previous);
    },
  };
}

export function useDeletePhotoMutation(folderId: string) {
  const { client, key, snapshot, rollback } = usePhotoListMutation(folderId);
  return useMutation({
    mutationFn: (photoKey: string) => deletePhoto(photoKey),
    onMutate: async (photoKey: string) => {
      await client.cancelQueries({ queryKey: key });
      const previous = snapshot();
      client.setQueryData<Photo[]>(key, (prev) =>
        prev?.filter((p) => p.key !== photoKey) ?? []
      );
      return { previous };
    },
    onError: (_err, _key, ctx) => rollback(ctx?.previous),
    onSettled: () => client.invalidateQueries({ queryKey: key }),
  });
}

export function useMovePhotoMutation(folderId: string) {
  const { client, key, snapshot, rollback } = usePhotoListMutation(folderId);
  return useMutation({
    mutationFn: (input: { sourceKey: string; destinationFolderId: string }) =>
      movePhoto(input),
    onMutate: async ({ sourceKey }) => {
      await client.cancelQueries({ queryKey: key });
      const previous = snapshot();
      client.setQueryData<Photo[]>(key, (prev) =>
        prev?.filter((p) => p.key !== sourceKey) ?? []
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => rollback(ctx?.previous),
    onSettled: (_data, _err, vars) => {
      client.invalidateQueries({ queryKey: key });
      client.invalidateQueries({
        queryKey: queryKeys.adminFolderPhotos(vars.destinationFolderId),
      });
    },
  });
}

export function useDuplicatePhotoMutation(folderId: string) {
  const client = useQueryClient();
  const key = queryKeys.adminFolderPhotos(folderId);
  return useMutation({
    mutationFn: (input: {
      sourceKey: string;
      destinationFolderId: string;
      destinationFileName?: string;
    }) => duplicatePhoto(input),
    onSuccess: (_data, vars) => {
      client.invalidateQueries({ queryKey: key });
      client.invalidateQueries({
        queryKey: queryKeys.adminFolderPhotos(vars.destinationFolderId),
      });
    },
  });
}

export function useUpdatePhotoTagsMutation(folderId: string) {
  const { client, key, snapshot, rollback } = usePhotoListMutation(folderId);
  return useMutation({
    mutationFn: (input: { photoKey: string; tags: string[] }) =>
      updatePhotoTags(input),
    onMutate: async ({ photoKey, tags }) => {
      await client.cancelQueries({ queryKey: key });
      const previous = snapshot();
      client.setQueryData<Photo[]>(key, (prev) =>
        prev?.map((p) => (p.key === photoKey ? { ...p, tags } : p)) ?? []
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => rollback(ctx?.previous),
    onSettled: () => {
      client.invalidateQueries({ queryKey: key });
      client.invalidateQueries({ queryKey: queryKeys.tagsPublic });
    },
  });
}
