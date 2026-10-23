"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminFolders } from "@/lib/query/useAdminFolders";
import { usePublicTags } from "@/lib/query/useTags";
import {
  useAdminFolderPhotos,
  useDeletePhotoMutation,
  useMovePhotoMutation,
  useDuplicatePhotoMutation,
  useUpdatePhotoTagsMutation,
  useUpdatePhotoTagsBatchMutation,
} from "@/lib/query/useAdminFolderPhotos";
import { normalizeTags } from "@/lib/tagUtils";
import { TagInput } from "@/components/ui/TagInput";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Photo } from "@/lib/api/types";
import { getPhotoTitle } from "@/lib/photoTitle";

const PAGE_SIZE = 10;

export function PhotoLibrary({ folderId }: { folderId: string }) {
  const { data: photos, isLoading } = useAdminFolderPhotos(folderId);
  const { data: allTags } = usePublicTags();
  const { data: allFolders } = useAdminFolders();

  const deletePhoto = useDeletePhotoMutation(folderId);
  const movePhoto = useMovePhotoMutation(folderId);
  const duplicatePhoto = useDuplicatePhotoMutation(folderId);
  const updateTags = useUpdatePhotoTagsMutation(folderId);
  const updateTagsBatch = useUpdatePhotoTagsBatchMutation(folderId);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "bulk" | "final">("all");
  const [likedOnly, setLikedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [destinationFolderId, setDestinationFolderId] = useState("");
  const [batchAdd, setBatchAdd] = useState<string[]>([]);
  const [batchRemove, setBatchRemove] = useState<string[]>([]);

  const destinationOptions = (allFolders ?? []).filter((f) => f.folderId !== folderId);
  const tagSuggestions = (allTags ?? []).map((t) => t.label);

  const filtered = useMemo(() => {
    if (!photos) return [];
    const q = search.trim().toLowerCase();
    return photos.filter((p) => {
      if (categoryFilter !== "all" && (p.category ?? "final") !== categoryFilter) {
        return false;
      }
      if (likedOnly && !p.liked) return false;
      if (!q) return true;
      return [p.key, getPhotoTitle(p), ...(p.tags ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [photos, search, categoryFilter, likedOnly]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const toggleSelect = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectedPhotos = (photos ?? []).filter((p) => selectedKeys.has(p.key));

  const batchPreview = useMemo(() => {
    return selectedPhotos
      .map((photo) => {
        const current = photo.tags ?? [];
        const next = normalizeTags([
          ...current.filter((t) => !batchRemove.includes(t)),
          ...batchAdd,
        ]);
        return { photo, next };
      })
      .filter(({ photo, next }) => {
        const current = normalizeTags(photo.tags ?? []);
        return JSON.stringify(current) !== JSON.stringify(next);
      });
  }, [selectedPhotos, batchAdd, batchRemove]);

  const applyBatchTags = async () => {
    await updateTagsBatch.mutateAsync(
      batchPreview.map(({ photo, next }) => ({ photoKey: photo.key, tags: next }))
    );
    setBatchAdd([]);
    setBatchRemove([]);
  };

  if (isLoading) return <p className="text-sm text-muted">Loading library…</p>;

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
          Photo library ({filtered.length})
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value as "all" | "bulk" | "final");
              setPage(1);
              if (e.target.value !== "bulk") setLikedOnly(false);
            }}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          >
            <option value="all">All</option>
            <option value="bulk">Bulk</option>
            <option value="final">Final</option>
          </select>
          {categoryFilter === "bulk" && (
            <label className="flex items-center gap-1.5 text-xs text-muted">
              <input
                type="checkbox"
                checked={likedOnly}
                onChange={(e) => {
                  setLikedOnly(e.target.checked);
                  setPage(1);
                }}
              />
              Liked only
            </label>
          )}
          <input
            value={search}
            onChange={(e) => resetSearch(e.target.value)}
            placeholder="Search filename or tags…"
            className="w-56 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
        <button
          onClick={() => setSelectedKeys(new Set(pageItems.map((p) => p.key)))}
          className="underline-offset-2 hover:underline"
        >
          Select page
        </button>
        <button
          onClick={() => setSelectedKeys(new Set(filtered.map((p) => p.key)))}
          className="underline-offset-2 hover:underline"
        >
          Select all results
        </button>
        <button
          onClick={() => setSelectedKeys(new Set())}
          className="underline-offset-2 hover:underline"
        >
          Clear
        </button>
        <span>{selectedKeys.size} selected</span>

        {destinationOptions.length > 0 && (
          <select
            value={destinationFolderId}
            onChange={(e) => setDestinationFolderId(e.target.value)}
            className="ml-auto rounded-md border border-border bg-background px-2 py-1"
          >
            <option value="">Move/duplicate destination…</option>
            {destinationOptions.map((f) => (
              <option key={f.folderId} value={f.folderId}>
                {f.displayName ?? f.folderId}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedKeys.size > 0 && (
        <div className="mt-4 rounded-lg border border-border bg-surface p-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
            Batch tags ({selectedKeys.size} photos)
          </h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div>
              <span className="mb-1 block text-xs text-muted">Add tags</span>
              <TagInput
                value={batchAdd}
                onChange={(tags) => {
                  setBatchAdd(tags);
                  setBatchRemove((r) => r.filter((t) => !tags.includes(t)));
                }}
                suggestions={tagSuggestions}
              />
            </div>
            <div>
              <span className="mb-1 block text-xs text-muted">Remove tags</span>
              <TagInput
                value={batchRemove}
                onChange={(tags) => {
                  setBatchRemove(tags);
                  setBatchAdd((a) => a.filter((t) => !tags.includes(t)));
                }}
                suggestions={tagSuggestions}
              />
            </div>
          </div>
          <button
            onClick={applyBatchTags}
            disabled={batchPreview.length === 0 || updateTagsBatch.isPending}
            className="mt-3 rounded-full bg-accent px-5 py-1.5 text-sm text-white disabled:opacity-50"
          >
            Apply to {batchPreview.length} photo{batchPreview.length === 1 ? "" : "s"}
          </button>
        </div>
      )}

      <ul className="mt-4 divide-y divide-border border-y border-border">
        {pageItems.map((photo) => (
          <PhotoRow
            key={photo.key}
            photo={photo}
            folderId={folderId}
            selected={selectedKeys.has(photo.key)}
            onToggle={() => toggleSelect(photo.key)}
            destinationFolderId={destinationFolderId}
            onDelete={() => deletePhoto.mutate(photo.key)}
            onMove={() =>
              destinationFolderId &&
              movePhoto.mutate({ sourceKey: photo.key, destinationFolderId })
            }
            onDuplicate={() =>
              destinationFolderId &&
              duplicatePhoto.mutate({ sourceKey: photo.key, destinationFolderId })
            }
            onSaveTags={(tags) => updateTags.mutate({ photoKey: photo.key, tags })}
            tagSuggestions={tagSuggestions}
          />
        ))}
        {pageItems.length === 0 && (
          <p className="py-6 text-sm text-muted">No photos match.</p>
        )}
      </ul>

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="disabled:opacity-40"
          >
            ‹ Prev
          </button>
          <span className="text-muted">
            Page {page} of {pageCount}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page === pageCount}
            className="disabled:opacity-40"
          >
            Next ›
          </button>
        </div>
      )}
    </section>
  );
}

function PhotoRow({
  photo,
  selected,
  onToggle,
  destinationFolderId,
  onDelete,
  onMove,
  onDuplicate,
  onSaveTags,
  tagSuggestions,
}: {
  photo: Photo;
  folderId: string;
  selected: boolean;
  onToggle: () => void;
  destinationFolderId: string;
  onDelete: () => void;
  onMove: () => void;
  onDuplicate: () => void;
  onSaveTags: (tags: string[]) => void;
  tagSuggestions: string[];
}) {
  const [draftTags, setDraftTags] = useState<string[]>(photo.tags ?? []);
  useEffect(() => setDraftTags(photo.tags ?? []), [photo.tags]);
  const committed = JSON.stringify(normalizeTags(photo.tags ?? []));
  const draftDiverged = JSON.stringify(normalizeTags(draftTags)) !== committed;
  const [thumbLoaded, setThumbLoaded] = useState(false);

  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <input type="checkbox" checked={selected} onChange={onToggle} className="shrink-0" />
      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded bg-surface">
        {!thumbLoaded && <Skeleton className="absolute inset-0" />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.thumbnailUrl ?? photo.url}
          alt={getPhotoTitle(photo)}
          loading="lazy"
          onLoad={() => setThumbLoaded(true)}
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            thumbLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
      <span className="w-40 shrink-0 truncate text-sm">{getPhotoTitle(photo)}</span>
      {photo.category === "bulk" && (
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs uppercase tracking-wide ${
            photo.liked ? "bg-accent text-white" : "bg-surface text-muted"
          }`}
        >
          {photo.liked ? "♥ Bulk" : "Bulk"}
        </span>
      )}

      <div className="min-w-48 flex-1">
        <TagInput value={draftTags} onChange={setDraftTags} suggestions={tagSuggestions} />
      </div>

      <div className="flex shrink-0 items-center gap-2 text-xs uppercase tracking-wide">
        <button
          onClick={() => setDraftTags(photo.tags ?? [])}
          disabled={!draftDiverged}
          className="text-muted disabled:opacity-40"
        >
          Reset
        </button>
        <button
          onClick={() => onSaveTags(draftTags)}
          disabled={!draftDiverged}
          className="text-accent disabled:opacity-40"
        >
          Save
        </button>
        <button onClick={onDuplicate} disabled={!destinationFolderId} className="disabled:opacity-40">
          Duplicate
        </button>
        <button onClick={onMove} disabled={!destinationFolderId} className="disabled:opacity-40">
          Move
        </button>
        <button onClick={onDelete} className="text-red-500">
          Delete
        </button>
      </div>
    </li>
  );
}
