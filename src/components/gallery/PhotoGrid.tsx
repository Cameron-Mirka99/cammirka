"use client";

import { useState } from "react";
import type { Photo } from "@/lib/api/types";
import { PhotoCard } from "./PhotoCard";
import { Lightbox } from "./Lightbox";

type PhotoGridProps = {
  photos: Photo[];
  showDownload?: boolean;
  emptyMessage?: string;
  onToggleLike?: (photo: Photo) => void;
};

export function PhotoGrid({
  photos,
  showDownload = false,
  emptyMessage = "No photos found.",
  onToggleLike,
}: PhotoGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <p className="py-24 text-center text-sm text-muted">{emptyMessage}</p>
    );
  }

  return (
    <>
      {/*
        CSS multi-column layout fills top-to-bottom within column 1 first,
        then column 2, then column 3 (masonry-style, packs variable aspect
        ratios without gaps). It is NOT row-major: the photo to the right of
        item 1 is not item 2, it's wherever the next column happens to start.
        A grid would give left-to-right reading order but loses the gapless
        packing.
      */}
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {photos.map((photo, index) => (
          <PhotoCard
            key={photo.key}
            photo={photo}
            onOpen={() => setSelectedIndex(index)}
            onToggleLike={onToggleLike ? () => onToggleLike(photo) : undefined}
          />
        ))}
      </div>
      <Lightbox
        photos={photos}
        selectedIndex={selectedIndex}
        setSelectedIndex={setSelectedIndex}
        showDownload={showDownload}
        onToggleLike={onToggleLike}
      />
    </>
  );
}
