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

  const bulkPhotos = useMemo(() => photos.filter((p) => p.category === "bulk"), [photos]);
  const finalPhotos = useMemo(() => photos.filter((p) => p.category !== "bulk"), [photos]);
  const visibleBulkPhotos = useMemo(
    () => (likedOnly ? bulkPhotos.filter((p) => p.liked) : bulkPhotos),
    [likedOnly, bulkPhotos]
  );
  const selectedFolder = folders?.find((f) => f.folderId === selectedFolderId);

  // The Bulk tab only exists while the folder actually has bulk photos --
  // once they're all liked-and-replaced or swept, it disappears and Final
  // becomes the only tab. Symmetrically, default back to Bulk whenever
  // there's nothing to show on Final yet.
  useEffect(() => {
    if (tab === "bulk" && bulkPhotos.length === 0 && finalPhotos.length > 0) {
      setTab("final");
    } else if (tab === "final" && finalPhotos.length === 0 && bulkPhotos.length > 0) {
      setTab("bulk");
    }
  }, [tab, bulkPhotos.length, finalPhotos.length]);

  const handleToggleLike = async (photo: Photo) => {
    if (!selectedFolderId) return;
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
      const message =
        error instanceof ApiError ? error.message : "Could not update like.";
      window.alert(message);
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
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-muted">
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
            <PhotoGrid photos={finalPhotos} showDownload />
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
