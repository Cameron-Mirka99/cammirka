import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTagCatalog } from "@/lib/api/tags";
import type { TagRecord } from "@/lib/api/types";
import { queryKeys } from "./keys";

export function useToggleTagVisibility() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (tag: TagRecord) =>
      updateTagCatalog({
        tagKey: tag.tagKey,
        label: tag.label,
        showOnHome: !tag.showOnHome,
      }),
    onMutate: async (tag) => {
      await client.cancelQueries({ queryKey: queryKeys.tagsPublic });
      const previous = client.getQueryData<TagRecord[]>(queryKeys.tagsPublic);
      client.setQueryData<TagRecord[]>(queryKeys.tagsPublic, (prev) =>
        prev?.map((t) =>
          t.tagKey === tag.tagKey ? { ...t, showOnHome: !t.showOnHome } : t
        ) ?? []
      );
      return { previous };
    },
    onError: (_err, _tag, ctx) => {
      if (ctx?.previous) client.setQueryData(queryKeys.tagsPublic, ctx.previous);
    },
    onSettled: () => client.invalidateQueries({ queryKey: queryKeys.tagsPublic }),
  });
}

export function useReorderTags() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (reordered: TagRecord[]) => {
      await Promise.all(
        reordered.map((tag, index) =>
          updateTagCatalog({ tagKey: tag.tagKey, label: tag.label, sortOrder: index })
        )
      );
    },
    onMutate: async (reordered) => {
      await client.cancelQueries({ queryKey: queryKeys.tagsPublic });
      const previous = client.getQueryData<TagRecord[]>(queryKeys.tagsPublic);
      const reorderedIds = new Set(reordered.map((t) => t.tagKey));
      client.setQueryData<TagRecord[]>(queryKeys.tagsPublic, (prev) => {
        const untouched = prev?.filter((t) => !reorderedIds.has(t.tagKey)) ?? [];
        return [
          ...reordered.map((t, index) => ({ ...t, sortOrder: index })),
          ...untouched,
        ];
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) client.setQueryData(queryKeys.tagsPublic, ctx.previous);
    },
    onSettled: () => client.invalidateQueries({ queryKey: queryKeys.tagsPublic }),
  });
}
