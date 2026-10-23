"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminFolders, useCreateFolder } from "@/lib/query/useAdminFolders";

export default function AdminFoldersPage() {
  const { data: folders, isLoading } = useAdminFolders();
  const createFolder = useCreateFolder();
  const [folderId, setFolderId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [likeLimit, setLikeLimit] = useState("");
  const [bulkRetentionDays, setBulkRetentionDays] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createFolder.mutate(
      {
        folderId: folderId.trim(),
        displayName: displayName.trim() || undefined,
        likeLimit: likeLimit.trim() ? Number.parseInt(likeLimit, 10) : undefined,
        bulkRetentionDays: bulkRetentionDays.trim()
          ? Number.parseInt(bulkRetentionDays, 10)
          : undefined,
      },
      {
        onSuccess: () => {
          setFolderId("");
          setDisplayName("");
          setLikeLimit("");
          setBulkRetentionDays("");
        },
        onError: (err) =>
          setError(err instanceof Error ? err.message : "Could not create folder."),
      }
    );
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-2xl italic">Folders</h1>
        <p className="mt-1 text-sm text-muted">
          Each folder is a private gallery you can invite clients into.
        </p>
      </div>

      <section className="rounded-lg border border-border p-5">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
          Create folder
        </h2>
        <form onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-xs text-muted">Folder ID</span>
            <input
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              required
              className="w-48 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-muted">Display name</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-48 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-muted">Like limit</span>
            <input
              type="number"
              min={1}
              value={likeLimit}
              onChange={(e) => setLikeLimit(e.target.value)}
              placeholder="Optional"
              className="w-28 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-muted">
              Bulk retention (days)
            </span>
            <input
              type="number"
              min={1}
              value={bulkRetentionDays}
              onChange={(e) => setBulkRetentionDays(e.target.value)}
              placeholder="Optional"
              className="w-28 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <button
            type="submit"
            disabled={createFolder.isPending}
            className="rounded-full bg-accent px-5 py-1.5 text-sm text-white disabled:opacity-50"
          >
            Create
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        <p className="mt-3 text-xs text-muted">
          Set both Like limit and Bulk retention to enable the Bulk review
          workflow for this folder. Bulk retention can only be set here, at
          creation — it can&apos;t be changed later.
        </p>
      </section>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
          All folders
        </h2>
        {isLoading && <p className="mt-4 text-sm text-muted">Loading…</p>}
        <ul className="mt-4 divide-y divide-border border-y border-border">
          {folders?.map((f) => (
            <li key={f.folderId}>
              <Link
                href={`/admin/folders/${encodeURIComponent(f.folderId)}`}
                className="flex items-center justify-between py-3 text-sm transition-colors hover:text-accent"
              >
                <span>{f.displayName ?? f.folderId}</span>
                <span className="text-xs text-muted">{f.folderId}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
