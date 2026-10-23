import { useQuery } from "@tanstack/react-query";
import { fetchPublicTags } from "@/lib/api/tags";
import { queryKeys } from "./keys";

export function usePublicTags() {
  return useQuery({
    queryKey: queryKeys.tagsPublic,
    queryFn: async () => (await fetchPublicTags()).tags,
    staleTime: 5 * 60_000,
  });
}

export function useHomeTags() {
  const { data, ...rest } = usePublicTags();
  const homeTags = (data ?? [])
    .filter((tag) => tag.showOnHome !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
  return { homeTags, ...rest };
}

export function useSecondaryTags() {
  const { data, ...rest } = usePublicTags();
  const mainTags = (data ?? [])
    .filter((tag) => tag.showOnHome !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
  const secondaryTags = (data ?? [])
    .filter((tag) => tag.showOnHome === false)
    .sort((a, b) => a.label.localeCompare(b.label));
  return { mainTags, secondaryTags, ...rest };
}
