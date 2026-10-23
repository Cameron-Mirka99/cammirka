"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { useAuth } from "@/lib/auth/AuthProvider";
import { fetchAllFolders, fetchUserFolders } from "@/lib/api/folders";
import { fetchFolderPhotos, toggleLike } from "@/lib/api/photos";
import { ApiError } from "@/lib/api/client";
import { PhotoGrid } from "@/components/gallery/PhotoGrid";
import { FolderSelector } from "@/components/ui/FolderSelector";
import type { Photo } from "@/lib/api/types";

type FolderOption = {
  folderId: string;
  displayName?: string;
  likeLimit?: number;
  likedCount?: number;
};

type Tab = "bulk" | "final";

export default function MyPhotosPage() {
  const { user } = useAuth();
  const isAdmin = user?.groups.includes("admin") ?? false;

  const [folders, setFolders] = useState<FolderOption[] | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [tab, setTab] = useState<Tab>("bulk");
  const [likedOnly, setLikedOnly] = useState(false);
  const [likeNotice, setLikeNotice] = useState<{ message: string; variant: "limit" | "error" } | null>(
    null
  );
  const likeNoticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showLikeNotice = (message: string, variant: "limit" | "error") => {
    if (likeNoticeTimer.current) clearTimeout(likeNoticeTimer.current);
    setLikeNotice({ message, variant });
    likeNoticeTimer.current = setTimeout(() => setLikeNotice(null), 5000);
  };

  // Load the folder list once: full list for admins, own folders otherwise.
  useEffect(() => {
    const load = isAdmin ? fetchAllFolders() : fetchUserFolders();
    load
      .then((res) =>
        setFolders(
          [...res.folders].sort((a, b) =>
            (a.displayName ?? a.folderId).localeCompare(b.displayName ?? b.folderId)
          )
        )
      )
      .catch(() => setFolders([]));
  }, [isAdmin]);

  // Auto-select the first folder once it loads, unless the current selection is still valid.
  useEffect(() => {
    if (!folders) return;
    if (selectedFolderId && folders.some((f) => f.folderId === selectedFolderId)) {
      return;
    }
    setSelectedFolderId(folders[0]?.folderId ?? null);
  }, [folders, selectedFolderId]);

  // Race-safe photo fetch: guards against a slow response from a folder the
  // user has already navigated away from.
  const requestSeq = useRef(0);
  const activeFolderRef = useRef<string | null>(null);

  useEffect(() => {
    setTab("bulk");
    setLikedOnly(false);
    if (!selectedFolderId) {
      setPhotos([]);
      return;
    }
    const seq = ++requestSeq.current;
    activeFolderRef.current = selectedFolderId;
    const controller = new AbortController();
    setLoadingPhotos(true);

    // Sorted + a generous limit, not the default random sample -- clients
    // need to see everything in the folder to decide what to like.
    fetchFolderPhotos(
      { folderId: selectedFolderId, sort: "newest", limit: 2000 },
      { signal: controller.signal }
    )
      .then((res) => {
        if (
          seq !== requestSeq.current ||
          activeFolderRef.current !== selectedFolderId
        ) {
          return;
        }
        const prefix = `${selectedFolderId}/`;
        const direct = res.photos.filter(
          (p) => p.key.startsWith(prefix) && !p.key.slice(prefix.length).includes("/")
        );
        const deduped = Array.from(
          new Map(direct.map((p) => [p.key, p])).values()
        );
        setPhotos(deduped);
      })
      .catch(() => {
        if (seq === requestSeq.current) setPhotos([]);
      })
      .finally(() => {
        if (seq === requestSeq.current) setLoadingPhotos(false);
      });

    return () => controller.abort();
  }, [selectedFolderId]);

  useEffect(() => {
    return () => {
      if (likeNoticeTimer.current) clearTimeout(likeNoticeTimer.current);
    };
  }, []);

  const bulkPhotos = useMemo(() => photos.filter((p) => p.category === "bulk"), [photos]);
  const finalPhotos = useMemo(() => photos.filter((p) => p.category !== "bulk"), [photos]);
  const visibleBulkPhotos = useMemo(
    () => (likedOnly ? bulkPhotos.filter((p) => p.liked) : bulkPhotos),
    [likedOnly, bulkPhotos]
  );
  const selectedFolder = folders?.find((f) => f.folderId === selectedFolderId);

  // The Bulk tab only exists while the folder actually has bulk photos --
  // once they're all liked-and-replaced or swept, it disappears and Final
  // becomes the only tab. This only forces Bulk -> Final, never the other
  // way: the user can still freely click over to an empty Final tab (it
  // shows its own empty state) without being bounced back to Bulk.
  //
  // Gated on !loadingPhotos: while a folder switch's fetch is in flight,
  // bulkPhotos/finalPhotos still reflect the PREVIOUS folder for a moment
  // (tab already reset to "bulk", but photos hasn't updated yet). Without
  // this guard, this effect could flip to "final" based on stale data
  // before the new folder's real photos ever arrive, and then never
  // recover since there's no reverse auto-switch.
  useEffect(() => {
    if (loadingPhotos) return;
    if (tab === "bulk" && bulkPhotos.length === 0 && finalPhotos.length > 0) {
      setTab("final");
    }
  }, [loadingPhotos, tab, bulkPhotos.length, finalPhotos.length]);

  const handleToggleLike = async (photo: Photo) => {
    if (!selectedFolderId) return;

    // Fast-path client check -- avoids the optimistic-flip-then-rollback
    // flicker when we already know the limit is hit. The backend's
    // conditional transact-write stays the real enforcement: this count can
    // be stale (another tab, another like just landed), so it only ever
    // blocks early, never substitutes for the server's own check.
    if (
      !photo.liked &&
      typeof selectedFolder?.likeLimit === "number" &&
      (selectedFolder.likedCount ?? 0) >= selectedFolder.likeLimit
    ) {
      showLikeNotice("Like limit reached — unlike one to pick another.", "limit");
      return;
    }

    const previousPhotos = photos;
    const previousFolders = folders;
    const delta = photo.liked ? -1 : 1;

    setPhotos((prev) =>
      prev.map((p) => (p.key === photo.key ? { ...p, liked: !p.liked } : p))
    );
    setFolders((prev) =>
      prev?.map((f) =>
        f.folderId === selectedFolderId
          ? { ...f, likedCount: (f.likedCount ?? 0) + delta }
          : f
      ) ?? prev
    );

    try {
      await toggleLike({ photoKey: photo.key, folderId: selectedFolderId });
    } catch (error) {
      setPhotos(previousPhotos);
      setFolders(previousFolders);
      if (error instanceof ApiError && error.status === 409) {
        showLikeNotice(
          "Like limit reached — unlike one to pick another.",
          "limit"
        );
      } else {
        const message =
          error instanceof ApiError ? error.message : "Could not update like.";
        showLikeNotice(message, "error");
      }
    }
  };

  const heading = user?.givenName
    ? `${user.givenName} ${user.familyName ?? ""}'s Private Gallery`.trim()
    : "Private Gallery";

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-32 sm:px-8 xl:max-w-none xl:w-[clamp(1152px,82vw,2560px)]">
      <header className="mb-8">
        <h1 className="font-serif text-3xl italic">{heading}</h1>
      </header>

      {likeNotice && (
        <div
          role="alert"
          className={clsx(
            // z-[110]: above the lightbox (z-[100]) -- liking happens from
            // inside the maximized view too, so the notice must be visible there.
            "fixed left-1/2 top-20 z-[110] flex w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2 items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg",
            likeNotice.variant === "limit" ? "bg-accent" : "bg-red-500"
          )}
        >
          <span>{likeNotice.message}</span>
          <button
            onClick={() => setLikeNotice(null)}
            aria-label="Dismiss"
            className="shrink-0 text-lg leading-none opacity-70 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}

      {folders && folders.length === 0 && (
        <p className="text-sm text-muted">
          You&apos;re not linked to a folder yet. Ask for an invite link to
          get access to a private gallery.
        </p>
      )}

      {folders && folders.length > 1 && (
        <div className="mb-8">
          <FolderSelector
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelect={setSelectedFolderId}
          />
        </div>
      )}

      {!loadingPhotos && folders && folders.length > 0 && (
        <>
          {bulkPhotos.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-center gap-10 border-b border-border">
                <TabButton active={tab === "bulk"} label="Bulk" onClick={() => setTab("bulk")} />
                <TabButton active={tab === "final"} label="Final" onClick={() => setTab("final")} />
              </div>
              {tab === "bulk" && (
                <div className="mt-4 flex flex-col items-center gap-3 text-sm text-muted">
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {typeof selectedFolder?.likeLimit === "number" && (
                      <span>
                        {selectedFolder.likedCount ?? 0} of {selectedFolder.likeLimit} liked
                      </span>
                    )}
                    <button
                      onClick={() => setLikedOnly((v) => !v)}
                      className={clsx(
                        "rounded-full border px-3 py-1 text-xs uppercase tracking-wide transition-colors",
                        likedOnly
                          ? "border-accent bg-accent text-white"
                          : "border-border hover:bg-surface"
                      )}
                    >
                      Liked only
                    </button>
                  </div>
                  <p className="text-xs">
                    Photos are newest first, filling top to bottom one column
                    before starting the next — so the photo beside one you&apos;re
                    looking at isn&apos;t necessarily the next shot. Check the one
                    below it instead.
                  </p>
                </div>
              )}
            </div>
          )}

          {tab === "bulk" ? (
            <PhotoGrid
              photos={visibleBulkPhotos}
              showDownload={false}
              onToggleLike={handleToggleLike}
              emptyMessage="No liked photos yet."
            />
          ) : (
            <PhotoGrid
              photos={finalPhotos}
              showDownload
              emptyMessage="No final photos yet."
            />
          )}
        </>
      )}

      {loadingPhotos && (
        <p className="py-24 text-center text-sm text-muted">Loading your gallery…</p>
      )}
    </div>
  );
}

function TabButton({
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
        "-mb-px border-b-2 pb-2 text-sm uppercase tracking-wide transition-colors",
        active
          ? "border-accent text-foreground"
          : "border-transparent text-muted hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}
