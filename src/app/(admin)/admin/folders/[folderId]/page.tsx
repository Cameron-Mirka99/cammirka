"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminFolders, useDeleteFolder } from "@/lib/query/useAdminFolders";
import { InvitePanel } from "./InvitePanel";
import { AccessPanel } from "./AccessPanel";
import { LikeSettingsPanel } from "./LikeSettingsPanel";
import { PhotoLibrary } from "./PhotoLibrary";

export default function FolderDetailPage() {
  const { folderId: raw } = useParams<{ folderId: string }>();
  const folderId = decodeURIComponent(raw);
  const router = useRouter();
  const { data: folders } = useAdminFolders();
  const deleteFolder = useDeleteFolder();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const folder = folders?.find((f) => f.folderId === folderId);
  const isPublic = folderId === "public";

  const handleDelete = () => {
    deleteFolder.mutate(folderId, { onSuccess: () => router.replace("/admin") });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl italic">
            {folder?.displayName ?? folderId}
          </h1>
          <p className="mt-1 text-sm text-muted">{folderId}</p>
        </div>
        {!isPublic && (
          <div>
            {confirmingDelete ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted">Delete this folder and all its photos?</span>
                <button
                  onClick={handleDelete}
                  className="rounded-full border border-red-500 px-3 py-1 text-xs uppercase tracking-wide text-red-500 transition-colors hover:bg-red-500 hover:text-white"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-wide text-muted transition-colors hover:bg-surface"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingDelete(true)}
                className="rounded-full border border-red-500 px-3 py-1 text-xs uppercase tracking-wide text-red-500 transition-colors hover:bg-red-500 hover:text-white"
              >
                Delete folder
              </button>
            )}
          </div>
        )}
      </div>

      {!isPublic && (
        <div className="grid gap-6 lg:grid-cols-2">
          <InvitePanel folderId={folderId} />
          <AccessPanel folderId={folderId} />
          <LikeSettingsPanel folderId={folderId} />
        </div>
      )}

      <PhotoLibrary folderId={folderId} />
    </div>
  );
}
