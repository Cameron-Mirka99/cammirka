"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { fetchAllFolders, fetchUserFolders } from "@/lib/api/folders";
import { fetchFolderPhotos } from "@/lib/api/photos";
import { PhotoGrid } from "@/components/gallery/PhotoGrid";
import type { Photo } from "@/lib/api/types";

type FolderOption = { folderId: string; displayName?: string };

export default function MyPhotosPage() {
  const { user } = useAuth();
  const isAdmin = user?.groups.includes("admin") ?? false;

  const [folders, setFolders] = useState<FolderOption[] | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  // Load the folder list once: full list for admins, own folders otherwise.
  useEffect(() => {
    const load = isAdmin ? fetchAllFolders() : fetchUserFolders();
    load
      .then((res) => setFolders(res.folders))
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
    if (!selectedFolderId) {
      setPhotos([]);
      return;
    }
    const seq = ++requestSeq.current;
    activeFolderRef.current = selectedFolderId;
    const controller = new AbortController();
    setLoadingPhotos(true);

    fetchFolderPhotos(
      { folderId: selectedFolderId, limit: 200 },
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

  const heading = user?.givenName
    ? `${user.givenName} ${user.familyName ?? ""}'s Private Gallery`.trim()
    : "Private Gallery";

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-32 sm:px-8">
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
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {folders.map((f) => (
            <button
              key={f.folderId}
              onClick={() => setSelectedFolderId(f.folderId)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors ${
                selectedFolderId === f.folderId
                  ? "border-accent bg-accent text-white"
                  : "border-border hover:bg-surface"
              }`}
            >
              {f.displayName ?? f.folderId}
            </button>
          ))}
        </div>
      )}

      {loadingPhotos ? (
        <p className="py-24 text-center text-sm text-muted">Loading your gallery…</p>
      ) : (
        folders &&
        folders.length > 0 && <PhotoGrid photos={photos} showDownload />
      )}
    </div>
  );
}
