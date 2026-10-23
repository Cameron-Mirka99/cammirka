"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { Photo } from "@/lib/api/types";
import { getPhotoTitle } from "@/lib/photoTitle";
import { preloadBlob, getCachedBlob } from "@/lib/hooks/useBlobCache";
import { fetchPhotoDownloadUrl } from "@/lib/api/photos";
import { Skeleton } from "@/components/ui/Skeleton";

type LightboxProps = {
  photos: Photo[];
  selectedIndex: number | null;
  setSelectedIndex: (updater: (prev: number | null) => number | null) => void;
  showDownload?: boolean;
  onToggleLike?: (photo: Photo) => void;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.18;

export function Lightbox({
  photos,
  selectedIndex,
  setSelectedIndex,
  showDownload = false,
  onToggleLike,
}: LightboxProps) {
  const open = selectedIndex !== null;
  const photo = selectedIndex !== null ? photos[selectedIndex] : null;

  const [src, setSrc] = useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [downloading, setDownloading] = useState(false);
  const dragState = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const goTo = useCallback(
    (delta: number) => {
      setSelectedIndex((prev) => {
        if (prev === null || photos.length === 0) return prev;
        return (prev + delta + photos.length) % photos.length;
      });
    },
    [photos.length, setSelectedIndex]
  );

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setImgLoaded(false);
    if (!photo) {
      setSrc(null);
      return;
    }
    const cached = getCachedBlob(photo.url);
    setSrc(cached ?? photo.url);
    preloadBlob(photo.url).then(setSrc).catch(() => {});

    // Preload neighbors so arrow-nav feels instant.
    if (selectedIndex !== null && photos.length > 1) {
      const next = photos[(selectedIndex + 1) % photos.length];
      const prev = photos[(selectedIndex - 1 + photos.length) % photos.length];
      preloadBlob(next.url).catch(() => {});
      preloadBlob(prev.url).catch(() => {});
    }
  }, [photo, selectedIndex, photos]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(1);
      else if (e.key === "ArrowLeft") goTo(-1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, goTo]);

  const close = () => setSelectedIndex(() => null);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => clamp(z + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP), MIN_ZOOM, MAX_ZOOM));
  };

  const onImageClick = () => {
    setZoom((z) => (z > 1 ? 1 : 2));
    setPan({ x: 0, y: 0 });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragState.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current || zoom <= 1) return;
    const dx = e.clientX - dragState.current.x;
    const dy = e.clientY - dragState.current.y;
    const maxX = 240 * (zoom - 1);
    const maxY = 180 * (zoom - 1);
    setPan({
      x: clamp(dragState.current.panX + dx, -maxX, maxX),
      y: clamp(dragState.current.panY + dy, -maxY, maxY),
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (dragState.current && zoom <= 1) {
      const dx = e.clientX - dragState.current.x;
      const dy = e.clientY - dragState.current.y;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
        goTo(dx < 0 ? 1 : -1);
      }
    }
    dragState.current = null;
  };

  const handleDownload = async () => {
    if (!photo || downloading) return;
    setDownloading(true);
    try {
      const { url, fileName } = await fetchPhotoDownloadUrl(
        photo.storageKey ?? photo.key
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      window.open(photo.url, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/95 data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-[100] flex h-dvh w-dvw flex-col outline-none"
        >
          <Dialog.Title className="sr-only">
            {photo ? getPhotoTitle(photo) : "Photo viewer"}
          </Dialog.Title>

          {photo && (
            <div className="relative flex min-h-0 flex-1 flex-col">
              <div
                className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden"
                onWheel={onWheel}
              >
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={() => goTo(-1)}
                      aria-label="Previous photo"
                      className="absolute left-2 top-1/2 z-10 hidden h-16 w-16 -translate-y-1/2 items-center justify-center rounded-full text-3xl text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:flex"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() => goTo(1)}
                      aria-label="Next photo"
                      className="absolute right-2 top-1/2 z-10 hidden h-16 w-16 -translate-y-1/2 items-center justify-center rounded-full text-3xl text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:flex"
                    >
                      ›
                    </button>
                  </>
                )}

                {!imgLoaded && <Skeleton className="absolute inset-0" />}
                {src && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={getPhotoTitle(photo)}
                    onLoad={() => setImgLoaded(true)}
                    onClick={onImageClick}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onContextMenu={(e) => e.preventDefault()}
                    draggable={false}
                    className={`absolute inset-0 h-full w-full touch-none select-none object-contain transition-[transform,opacity] duration-150 ${
                      imgLoaded ? "opacity-100" : "opacity-0"
                    }`}
                    style={{
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                      cursor: zoom > 1 ? "grab" : "zoom-in",
                    }}
                  />
                )}
              </div>

              <div className="flex items-center justify-between gap-4 px-5 py-4 text-sm text-white/80">
                <span className="truncate font-serif text-base text-white">
                  {getPhotoTitle(photo)}
                </span>
                <div className="flex shrink-0 items-center gap-4">
                  {selectedIndex !== null && (
                    <span className="text-xs uppercase tracking-wide text-white/50">
                      Frame {selectedIndex + 1} of {photos.length}
                    </span>
                  )}
                  {onToggleLike && photo.category === "bulk" && (
                    <button
                      onClick={() => onToggleLike(photo)}
                      className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wide transition-colors ${
                        photo.liked
                          ? "border-accent bg-accent text-white"
                          : "border-white/30 text-white/90 hover:bg-white/10"
                      }`}
                    >
                      {photo.liked ? "♥ Liked" : "♡ Like"}
                    </button>
                  )}
                  {showDownload && (
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-wide text-white/90 transition-colors hover:bg-white/10 disabled:opacity-50"
                    >
                      {downloading ? "Preparing…" : "Download"}
                    </button>
                  )}
                  <Dialog.Close
                    aria-label="Close"
                    className="text-xl text-white/70 transition-colors hover:text-white"
                  >
                    ×
                  </Dialog.Close>
                </div>
              </div>

              {photos.length > 1 && (
                <div className="flex items-center justify-center gap-6 pb-4 text-xs text-white/50 sm:hidden">
                  <button onClick={() => goTo(-1)}>‹ Previous</button>
                  <span>Swipe or tap</span>
                  <button onClick={() => goTo(1)}>Next ›</button>
                </div>
              )}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
