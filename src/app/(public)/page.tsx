"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchPublicPhotos } from "@/lib/api/photos";
import { useHomeTags } from "@/lib/query/useTags";
import type { TagRecord } from "@/lib/api/types";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Hero photo comes from a small, deliberately curated set, not every photo:
 * tag a handful of best shots "featured" in the admin (then hide that tag
 * from the subject-tile strip via Admin > Home Tags). One is picked at
 * random per load, so repeat visits see variety without the hero being
 * literally every photo. Falls back to an arbitrary photo if nothing is
 * tagged yet, so the page never breaks.
 */
function useHeroPhoto() {
  return useQuery({
    queryKey: ["hero-photo"],
    queryFn: async () => {
      try {
        const featured = await fetchPublicPhotos({ tag: "featured", limit: 10 });
        if (featured.photos.length > 0) {
          const index = Math.floor(Math.random() * featured.photos.length);
          return featured.photos[index];
        }
      } catch {
        // fall through to the arbitrary pick below
      }
      const fallback = await fetchPublicPhotos({ limit: 1 });
      return fallback.photos[0] ?? null;
    },
    staleTime: 5 * 60_000,
  });
}

export default function HomePage() {
  const { data: hero } = useHeroPhoto();
  const { homeTags, isLoading: tagsLoading } = useHomeTags();
  const [heroLoaded, setHeroLoaded] = useState(false);

  const heroCaption = hero?.tags?.length ? hero.tags.join(" · ") : null;

  return (
    <>
      <section className="relative flex h-[100svh] items-end overflow-hidden bg-surface">
        {hero && !heroLoaded && <Skeleton className="absolute inset-0" />}
        {hero && (
          <Image
            src={hero.url}
            alt={heroCaption ?? "Featured wildlife photograph"}
            fill
            priority
            unoptimized
            onLoad={() => setHeroLoaded(true)}
            className={`object-cover transition-opacity duration-700 ${
              heroLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/40" />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8">
          <h1 className="font-serif text-5xl italic text-white sm:text-7xl">
            Cameron Mirka
          </h1>
          <p className="mt-3 max-w-md text-sm text-white/80">
            Wildlife photography from the field grounds of Central Ohio —
            patient, unhurried, close to the ground.
          </p>
          {heroCaption && (
            <p className="mt-6 text-xs uppercase tracking-[0.2em] text-white/60">
              {heroCaption}
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <h2 className="font-serif text-xl italic text-foreground">
          Explore by subject
        </h2>
        {!tagsLoading && homeTags.length === 0 ? (
          <p className="mt-6 text-sm text-muted">
            No tagged collections are available yet.
          </p>
        ) : (
          <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
            {homeTags.map((tag) => (
              <TagTile key={tag.tagKey} tag={tag} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="flex flex-col items-start gap-4 border-t border-border pt-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-sm text-muted">
            Read more about the work, the places, and the gear behind it.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/about" className="underline-offset-4 hover:underline">
              About
            </Link>
            <Link href="/login" className="underline-offset-4 hover:underline">
              Private gallery access
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function TagTile({ tag }: { tag: TagRecord }) {
  const { data } = useQuery({
    queryKey: ["tag-preview", tag.tagKey],
    queryFn: async () => {
      const res = await fetchPublicPhotos({ tag: tag.label, limit: 1 });
      return res.photos[0] ?? null;
    },
    staleTime: 5 * 60_000,
  });
  const [loaded, setLoaded] = useState(false);

  return (
    <Link
      href={`/archive?tag=${encodeURIComponent(tag.label)}`}
      className="group relative block h-72 w-56 shrink-0 overflow-hidden rounded-sm bg-surface"
    >
      {data && !loaded && <Skeleton className="absolute inset-0" />}
      {data && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.thumbnailUrl ?? data.url}
          alt={tag.label}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={`h-full w-full object-cover transition-opacity duration-500 group-hover:scale-105 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <span className="absolute bottom-4 left-4 font-serif text-lg text-white">
        {tag.label}
      </span>
    </Link>
  );
}
