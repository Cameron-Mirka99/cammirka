"use client";

import { useState } from "react";
import type { Photo } from "@/lib/api/types";
import { PhotoCard } from "./PhotoCard";
import { Lightbox } from "./Lightbox";

type PhotoGridProps = {
  photos: Photo[];
  showDownload?: boolean;
  emptyMessage?: string;
};

export function PhotoGrid({
  photos,
  showDownload = false,
  emptyMessage = "No photos found.",
}: PhotoGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <p className="py-24 text-center text-sm text-muted">{emptyMessage}</p>
    );
  }

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {photos.map((photo, index) => (
          <PhotoCard
            key={photo.key}
            photo={photo}
            onOpen={() => setSelectedIndex(index)}
          />
        ))}
      </div>
      <Lightbox
        photos={photos}
        selectedIndex={selectedIndex}
        setSelectedIndex={setSelectedIndex}
        showDownload={showDownload}
      />
    </>
  );
}
