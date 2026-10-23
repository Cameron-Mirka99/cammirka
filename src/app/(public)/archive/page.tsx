"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { fetchPublicPhotos } from "@/lib/api/photos";
import { usePhotoFeed } from "@/lib/query/usePhotoFeed";
import { useSecondaryTags } from "@/lib/query/useTags";
import { PhotoGrid } from "@/components/gallery/PhotoGrid";
import { MoreTagsMenu } from "@/components/ui/MoreTagsMenu";

export default function ArchivePage() {
  return (
    <Suspense fallback={null}>
      <ArchiveContent />
    </Suspense>
  );
}

function ArchiveContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tag = searchParams.get("tag") ?? undefined;

  const { photos, loading, loadingMore, hasMore, loadMore } = usePhotoFeed(
    fetchPublicPhotos,
    tag
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
