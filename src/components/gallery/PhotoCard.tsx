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

  return (
    <button
      onClick={onOpen}
      className="group relative mb-4 block w-full overflow-hidden rounded-sm bg-surface"
      // Reserve space before the image's real dimensions are known, so the
      // grid doesn't jump from collapsed to full size once it loads.
      style={!loaded ? { aspectRatio: "4 / 5" } : undefined}
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
        }`}
      />
    </button>
  );
}
