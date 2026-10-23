"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { fetchPublicPhotos } from "@/lib/api/photos";
import { usePhotoFeed } from "@/lib/query/usePhotoFeed";
import { useSecondaryTags } from "@/lib/query/useTags";
import { PhotoGrid } from "@/components/gallery/PhotoGrid";
import { MoreTagsMenu } from "@/components/ui/MoreTagsMenu";
import { Lightbox } from "@/components/gallery/Lightbox";

const NEWEST_COUNT = 8;

export default function ArchivePage() {
  return (
    <Suspense fallback={null}>
      <ArchiveContent />
    </Suspense>
  );
}

function useNewestPhotos(tag?: string) {
  return useQuery({
    queryKey: ["archive-newest", tag ?? null],
    queryFn: async () =>
      (await fetchPublicPhotos({ limit: NEWEST_COUNT, sort: "newest", tag })).photos,
    staleTime: 60_000,
  });
}

function ArchiveContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tag = searchParams.get("tag") ?? undefined;

  const { data: newestPhotos = [] } = useNewestPhotos(tag);
  const newestKeys = newestPhotos.map((p) => p.key);
  const [selectedNewestIndex, setSelectedNewestIndex] = useState<number | null>(null);

  const { photos, loading, loadingMore, hasMore, loadMore } = usePhotoFeed(
    fetchPublicPhotos,
    tag,
    newestKeys
  );
  const { mainTags, secondaryTags } = useSecondaryTags();

  const applyTag = (next?: string) => {
    const params = new URLSearchParams(searchParams);
    if (next) params.set("tag", next);
    else params.delete("tag");
    router.push(`/archive${params.size ? `?${params}` : ""}`);
  };

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-28 sm:px-8">
      <header className="mb-8">
        <h1 className="font-serif text-3xl italic">Archive</h1>
        <p className="mt-2 text-sm text-muted">
          {photos.length} frame{photos.length === 1 ? "" : "s"}
          {tag ? ` tagged "${tag}"` : ""}
        </p>
      </header>

      <div className="sticky top-16 z-30 -mx-5 mb-8 flex gap-2 overflow-x-auto bg-background/90 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <TagPill active={!tag} label="All" onClick={() => applyTag(undefined)} />
        {mainTags.map((t) => (
          <TagPill
            key={t.tagKey}
            active={tag === t.label}
            label={t.label}
            onClick={() => applyTag(t.label)}
          />
        ))}
        <MoreTagsMenu tags={secondaryTags} activeTag={tag} onSelect={applyTag} />
      </div>

      {newestPhotos.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
            Newest
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {newestPhotos.map((photo, index) => (
              <button
                key={photo.key}
                onClick={() => setSelectedNewestIndex(index)}
                className="h-40 w-40 shrink-0 overflow-hidden rounded-sm bg-surface"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.thumbnailUrl ?? photo.url}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </button>
            ))}
          </div>
          <Lightbox
            photos={newestPhotos}
            selectedIndex={selectedNewestIndex}
            setSelectedIndex={setSelectedNewestIndex}
            showDownload={false}
          />
        </section>
      )}

      {loading ? (
        <p className="py-24 text-center text-sm text-muted">
          Preparing archive…
        </p>
      ) : (
        <PhotoGrid photos={photos} showDownload={false} />
      )}

      {!loading && hasMore && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-full border border-border px-6 py-2 text-sm uppercase tracking-wide transition-colors hover:bg-surface disabled:opacity-50"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
      {!loading && !hasMore && photos.length > 0 && (
        <p className="mt-10 text-center text-xs uppercase tracking-wide text-muted">
          End of archive
        </p>
      )}
    </div>
  );
}

function TagPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors",
        active
          ? "border-accent bg-accent text-white"
          : "border-border text-foreground hover:bg-surface"
      )}
    >
      {label}
    </button>
  );
}
