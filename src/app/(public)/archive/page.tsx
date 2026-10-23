"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import type { Photo } from "@/lib/api/types";
import { fetchPublicPhotos } from "@/lib/api/photos";
import { usePhotoFeed } from "@/lib/query/usePhotoFeed";
import { useSecondaryTags } from "@/lib/query/useTags";
import { PhotoGrid } from "@/components/gallery/PhotoGrid";
import { MoreTagsMenu } from "@/components/ui/MoreTagsMenu";
import { Lightbox } from "@/components/gallery/Lightbox";
import { Skeleton } from "@/components/ui/Skeleton";
import { getPhotoTitle } from "@/lib/photoTitle";

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
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-28 sm:px-8 xl:max-w-none xl:w-[clamp(1152px,82vw,2560px)]">
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
        <section className="mb-14">
          <h2 className="mb-4 font-serif text-xl italic text-foreground">
            Newest
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {newestPhotos.map((photo, index) => (
              <NewestCard
                key={photo.key}
                photo={photo}
                onOpen={() => setSelectedNewestIndex(index)}
              />
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

function NewestCard({
  photo,
  onOpen,
}: {
  photo: Photo;
  onOpen: () => void;
}) {
  const previewUrl = photo.thumbnailUrl ?? photo.url;
  const [loaded, setLoaded] = useState(false);
  const ratio = photo.width && photo.height ? photo.width / photo.height : 4 / 5;

  return (
    <button
      onClick={onOpen}
      className="group relative h-56 shrink-0 overflow-hidden rounded-sm bg-surface xl:h-64 2xl:h-72"
      style={{ aspectRatio: ratio }}
    >
      {!loaded && <Skeleton className="absolute inset-0" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={previewUrl}
        alt={getPhotoTitle(photo)}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-opacity duration-500 ease-out group-hover:scale-[1.02] ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </button>
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
