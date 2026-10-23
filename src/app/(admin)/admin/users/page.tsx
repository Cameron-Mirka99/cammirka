"use client";

import { useMemo, useState } from "react";
import { useAdminUsers, useUpdateUser } from "@/lib/query/useAdminUsers";
import type { FolderUser } from "@/lib/api/types";

export default function UsersPage() {
  const { data: users, isLoading } = useAdminUsers();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<FolderUser | null>(null);

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.email, u.username, u.name, u.givenName, u.familyName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [users, query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl italic">User directory</h1>
        <p className="mt-1 text-sm text-muted">Every registered user, across all folders.</p>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or email…"
        className="w-full max-w-sm rounded-md border border-border bg-background px-3 py-2 text-sm"
      />

      {isLoading && <p className="text-sm text-muted">Loading…</p>}

      <ul className="divide-y divide-border border-y border-border">
        {filtered.map((u) => (
          <li key={u.username} className="flex items-center justify-between py-3 text-sm">
            <div>
              <p>{u.name ?? u.email ?? u.username}</p>
              <p className="text-xs text-muted">
                {u.email} · {u.folderId ?? "no folder"}
              </p>
            </div>
            <button
              onClick={() => setEditing(u)}
              className="text-xs uppercase tracking-wide text-accent hover:underline"
            >
              Edit name
            </button>
          </li>
        ))}
        {filtered.length === 0 && !isLoading && (
          <p className="py-6 text-sm text-muted">No matching users.</p>
        )}
      </ul>

      {editing && <EditUserDialog user={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function EditUserDialog({ user, onClose }: { user: FolderUser; onClose: () => void }) {
  const [givenName, setGivenName] = useState(user.givenName ?? "");
  const [familyName, setFamilyName] = useState(user.familyName ?? "");
  const [error, setError] = useState<string | null>(null);
  const updateUser = useUpdateUser();

  const save = () => {
    if (!givenName.trim() || !familyName.trim()) {
      setError("First and last name are required.");
      return;
    }
    updateUser.mutate(
      { username: user.username, givenName: givenName.trim(), familyName: familyName.trim() },
      { onSuccess: onClose, onError: () => setError("Could not save.") }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5">
      <div className="w-full max-w-sm rounded-lg bg-surface p-5">
        <h2 className="font-serif text-lg italic">Edit {user.email ?? user.username}</h2>
        <div className="mt-4 space-y-3">
          <input
            value={givenName}
            onChange={(e) => setGivenName(e.target.value)}
            placeholder="First name"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="Last name"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        <div className="mt-4 flex justify-end gap-3 text-sm">
          <button onClick={onClose} className="text-muted">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={updateUser.isPending}
            className="rounded-full bg-accent px-4 py-1.5 text-white disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
