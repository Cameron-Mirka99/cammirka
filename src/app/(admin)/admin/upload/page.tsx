"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminFolders } from "@/lib/query/useAdminFolders";
import { usePopularTagLabels } from "@/lib/query/useTags";
import { uploadImage } from "@/lib/api/photos";
import {
  buildUploadPayload,
  exceedsUploadLimit,
  requestByteSize,
  formatBytes,
} from "@/lib/upload/buildUploadPayload";
import { TagInput } from "@/components/ui/TagInput";
import { queryKeys } from "@/lib/query/keys";
import type { PhotoCategory } from "@/lib/api/types";

type FileResult = { name: string; ok: boolean; message?: string };

export default function UploadPage() {
  const { data: folders } = useAdminFolders();
  const { labels: tagSuggestions } = usePopularTagLabels();
  const queryClient = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [folderId, setFolderId] = useState("");
  const [category, setCategory] = useState<PhotoCategory>("final");
  const [files, setFiles] = useState<File[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [results, setResults] = useState<FileResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const startUpload = async () => {
    setError(null);
    if (!folderId) {
      setError("Choose a folder first.");
      return;
    }
    if (files.length === 0) {
      setError("Choose at least one file.");
      return;
    }

    setUploading(true);
    setResults([]);
    const outcomes: FileResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress({ current: i + 1, total: files.length });
      try {
        const payload = await buildUploadPayload(file, tags, category);
        const bytes = requestByteSize(payload, folderId);
        if (exceedsUploadLimit(bytes)) {
          outcomes.push({
            name: file.name,
            ok: false,
            message: `Too large (${formatBytes(bytes)}, limit ${formatBytes(
              10 * 1024 * 1024
            )})`,
          });
          continue;
        }
        const result = await uploadImage(folderId, payload);
        outcomes.push({ name: file.name, ok: result.ok, message: result.message });
      } catch (err) {
        outcomes.push({
          name: file.name,
          ok: false,
          message: err instanceof Error ? err.message : "Upload failed",
        });
      }
    }

    setResults(outcomes);
    setProgress(null);
    setUploading(false);
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    queryClient.invalidateQueries({ queryKey: queryKeys.adminFolderPhotos(folderId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.tagsPublic });
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl italic">Upload photos</h1>
        <p className="mt-1 text-sm text-muted">
          Files are resized to a 960px-wide thumbnail in your browser before
          upload — the backend doesn&apos;t resize anything server-side.
        </p>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs text-muted">Folder</span>
        <select
          value={folderId}
          onChange={(e) => setFolderId(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">Choose a folder…</option>
          <option value="public">Public Gallery</option>
          {folders?.map((f) => (
            <option key={f.folderId} value={f.folderId}>
              {f.displayName ?? f.folderId}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs text-muted">Category</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as PhotoCategory)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="final">Final (delivered product)</option>
          <option value="bulk">Bulk (client review)</option>
        </select>
      </label>

      <div>
        <span className="mb-1 block text-xs text-muted">Files</span>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-md border border-border bg-background px-4 py-2 text-sm hover:bg-muted/10"
        >
          Choose files…
        </button>
        {files.length > 0 && (
          <p className="mt-1 text-xs text-muted">
            {files.length} file{files.length === 1 ? "" : "s"} selected
          </p>
        )}
      </div>

      <div>
        <span className="mb-1 block text-xs text-muted">Tags (applied to all files)</span>
        <TagInput value={tags} onChange={setTags} suggestions={tagSuggestions} />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={startUpload}
        disabled={uploading}
        className="rounded-full bg-accent px-6 py-2 text-sm text-white disabled:opacity-50"
      >
        {uploading
          ? `Uploading ${progress?.current ?? 0} of ${progress?.total ?? 0}…`
          : `Upload ${files.length} file${files.length === 1 ? "" : "s"}`}
      </button>

      {results.length > 0 && (
        <ul className="divide-y divide-border border-y border-border text-sm">
          {results.map((r) => (
            <li key={r.name} className="flex items-center justify-between py-2">
              <span>{r.name}</span>
              <span className={r.ok ? "text-accent" : "text-red-500"}>
                {r.ok ? "Uploaded" : r.message ?? "Failed"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
