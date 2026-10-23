"use client";

import { useState } from "react";
import type { Photo } from "@/lib/api/types";
import { getPhotoTitle } from "@/lib/photoTitle";
import { Skeleton } from "@/components/ui/Skeleton";

type PhotoCardProps = {
  photo: Photo;
  onOpen: () => void;
  priority?: boolean;
};

export function PhotoCard({ photo, onOpen }: PhotoCardProps) {
  const previewUrl = photo.thumbnailUrl ?? photo.url;
  const [loaded, setLoaded] = useState(false);

  // Photos uploaded after the width/height backend change know their real
  // ratio up front — no guess, no reflow once loaded. Older photos without
  // stored dimensions fall back to a guessed placeholder that's cleared
  // once the real image loads (the old behavior, still has a small reflow).
  const knownRatio =
    photo.width && photo.height ? `${photo.width} / ${photo.height}` : undefined;
  const placeholderRatio = knownRatio ?? "4 / 5";
  const aspectRatio = knownRatio ?? (!loaded ? placeholderRatio : undefined);

  return (
    <button
      onClick={onOpen}
      className="group relative mb-4 block w-full overflow-hidden rounded-sm bg-surface"
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {!loaded && <Skeleton className="absolute inset-0" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={previewUrl}
        alt={getPhotoTitle(photo)}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`w-full object-cover transition-opacity duration-500 ease-out group-hover:scale-[1.02] ${
          loaded ? "opacity-100" : "absolute inset-0 h-full opacity-0"
        } ${knownRatio ? "h-full" : ""}`}
      />
    </button>
  );
}
