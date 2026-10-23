"use client";

import { useState } from "react";
import { useAdminFolders, useUpdateFolder } from "@/lib/query/useAdminFolders";

export function LikeSettingsPanel({ folderId }: { folderId: string }) {
  const { data: folders } = useAdminFolders();
  const folder = folders?.find((f) => f.folderId === folderId);
  const updateFolder = useUpdateFolder();

  const [likeLimit, setLikeLimit] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!folder?.bulkRetentionDays) {
    return (
      <section className="rounded-lg border border-border p-5">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
          Bulk review
        </h2>
        <p className="mt-2 text-sm text-muted">
          This folder was created before bulk review existed, or without a
          retention period set — it can&apos;t be enabled after the fact.
        </p>
      </section>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number.parseInt(likeLimit, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setError("Like limit must be a positive number.");
      return;
    }
    setError(null);
    updateFolder.mutate(
      { folderId, likeLimit: parsed },
      {
        onSuccess: () => setLikeLimit(""),
        onError: (err) =>
          setError(err instanceof Error ? err.message : "Could not update like limit."),
      }
    );
  };

  return (
    <section className="rounded-lg border border-border p-5">
      <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
        Bulk review
      </h2>
      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Like limit</dt>
          <dd>{folder.likeLimit ?? "Not set"}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Liked so far</dt>
          <dd>{folder.likedCount ?? 0}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Bulk retention</dt>
          <dd>{folder.bulkRetentionDays} day(s)</dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-muted">
        Retention was set when this folder was created and can&apos;t be
        changed. Like limit can be adjusted anytime.
      </p>
      <form onSubmit={submit} className="mt-4 flex items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs text-muted">New like limit</span>
          <input
            type="number"
            min={1}
            value={likeLimit}
            onChange={(e) => setLikeLimit(e.target.value)}
            className="w-28 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
        </label>
        <button
          type="submit"
          disabled={updateFolder.isPending}
          className="rounded-full bg-accent px-5 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {updateFolder.isPending ? "Saving…" : "Save"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </section>
  );
}
