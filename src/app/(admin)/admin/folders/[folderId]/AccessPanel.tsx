"use client";

import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import { fetchAllUsers } from "@/lib/api/users";
import {
  useFolderUsers,
  useAddFolderUser,
  useRemoveFolderUser,
  useUnbanFolderUser,
} from "@/lib/query/useAdminFolderUsers";

export function AccessPanel({ folderId }: { folderId: string }) {
  const { data, isLoading } = useFolderUsers(folderId);
  const addUser = useAddFolderUser(folderId);
  const removeUser = useRemoveFolderUser(folderId);
  const unbanUser = useUnbanFolderUser(folderId);
  const { data: allUsersRes } = useQuery({
    queryKey: ["admin", "users", "directory-search"],
    queryFn: () => fetchAllUsers(),
  });
  const [query, setQuery] = useState("");

  const members = data?.users ?? [];
  const banned = data?.bannedUsers ?? [];
  const memberUsernames = new Set(members.map((m) => m.username));

  const candidates = (allUsersRes?.users ?? []).filter((u) => {
    if (memberUsernames.has(u.username)) return false;
    if (!query) return true;
    const haystack = [u.email, u.username, u.name, u.givenName, u.familyName]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <section className="rounded-lg border border-border p-5">
      <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
        Folder access
      </h2>

      <Tabs.Root defaultValue="members" className="mt-4">
        <Tabs.List className="flex gap-4 border-b border-border text-sm">
          <Tabs.Trigger value="members" className="pb-2 data-[state=active]:border-b-2 data-[state=active]:border-accent">
            Members ({members.length})
          </Tabs.Trigger>
          <Tabs.Trigger value="banned" className="pb-2 data-[state=active]:border-b-2 data-[state=active]:border-accent">
            Banned ({banned.length})
          </Tabs.Trigger>
          <Tabs.Trigger value="add" className="pb-2 data-[state=active]:border-b-2 data-[state=active]:border-accent">
            Add user
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="members" className="pt-4">
          {isLoading && <p className="text-sm text-muted">Loading…</p>}
          <ul className="divide-y divide-border">
            {members.map((m) => (
              <li key={m.username} className="flex items-center justify-between py-2 text-sm">
                <span>{m.name ?? m.email ?? m.username}</span>
                <button
                  onClick={() => removeUser.mutate(m.username)}
                  className="rounded-full border border-red-500 px-3 py-1 text-xs uppercase tracking-wide text-red-500 transition-colors hover:bg-red-500 hover:text-white"
                >
                  Remove
                </button>
              </li>
            ))}
            {members.length === 0 && !isLoading && (
              <p className="py-4 text-sm text-muted">No members yet.</p>
            )}
          </ul>
        </Tabs.Content>

        <Tabs.Content value="banned" className="pt-4">
          <ul className="divide-y divide-border">
            {banned.map((m) => (
              <li key={m.username} className="flex items-center justify-between py-2 text-sm">
                <span>{m.name ?? m.email ?? m.username}</span>
                <button
                  onClick={() => unbanUser.mutate(m.username)}
                  className="rounded-full border border-accent px-3 py-1 text-xs uppercase tracking-wide text-accent transition-colors hover:bg-accent hover:text-white"
                >
                  Unban
                </button>
              </li>
            ))}
            {banned.length === 0 && (
              <p className="py-4 text-sm text-muted">No banned users.</p>
            )}
          </ul>
        </Tabs.Content>

        <Tabs.Content value="add" className="pt-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
          <ul className="mt-3 max-h-56 divide-y divide-border overflow-y-auto">
            {candidates.map((u) => (
              <li
                key={u.username}
                className={clsx(
                  "flex items-center justify-between py-2 text-sm",
                  addUser.isPending && "opacity-50"
                )}
              >
                <span>{u.name ?? u.email ?? u.username}</span>
                <button
                  onClick={() => addUser.mutate(u.username)}
                  disabled={addUser.isPending}
                  className="rounded-full border border-accent px-3 py-1 text-xs uppercase tracking-wide text-accent transition-colors hover:bg-accent hover:text-white disabled:opacity-50"
                >
                  Add
                </button>
              </li>
            ))}
            {candidates.length === 0 && (
              <p className="py-4 text-sm text-muted">No matching users.</p>
            )}
          </ul>
        </Tabs.Content>
      </Tabs.Root>
    </section>
  );
}
