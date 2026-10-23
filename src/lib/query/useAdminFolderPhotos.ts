import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchFolderPhotos,
  movePhoto,
  duplicatePhoto,
  deletePhoto,
} from "@/lib/api/photos";
import { updatePhotoTags, updatePhotoTagsBatch } from "@/lib/api/tags";
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

/**
 * One network round-trip for the whole batch, so a failure rolls back the
 * entire batch as one optimistic update — not N separate ones that can
 * partially succeed and leave the UI showing a mix of old/new tags.
 */
export function useUpdatePhotoTagsBatchMutation(folderId: string) {
  const { client, key, snapshot, rollback } = usePhotoListMutation(folderId);
  return useMutation({
    mutationFn: (updates: { photoKey: string; tags: string[] }[]) =>
      updatePhotoTagsBatch(updates),
    onMutate: async (updates) => {
      await client.cancelQueries({ queryKey: key });
      const previous = snapshot();
      const nextTagsByKey = new Map(updates.map((u) => [u.photoKey, u.tags]));
      client.setQueryData<Photo[]>(key, (prev) =>
        prev?.map((p) =>
          nextTagsByKey.has(p.key) ? { ...p, tags: nextTagsByKey.get(p.key) } : p
        ) ?? []
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => rollback(ctx?.previous),
    onSuccess: (data, _vars, ctx) => {
      // Any per-item failure rolls back the whole batch, even though the
      // request itself succeeded (HTTP-level) — the backend isn't
      // transactional, so a partial failure is reported per item, not as
      // a thrown error.
      if (data.results.some((r) => !r.ok)) rollback(ctx?.previous);
    },
    onSettled: () => {
      client.invalidateQueries({ queryKey: key });
      client.invalidateQueries({ queryKey: queryKeys.tagsPublic });
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
