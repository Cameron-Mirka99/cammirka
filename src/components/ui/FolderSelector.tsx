"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import clsx from "clsx";

type FolderOption = { folderId: string; displayName?: string };

type FolderSelectorProps = {
  folders: FolderOption[];
  selectedFolderId: string | null;
  onSelect: (folderId: string) => void;
};

/**
 * Single combobox for picking a folder: a compact trigger showing the
 * current selection, opening a searchable list. Scales from a couple of
 * folders to however many an admin has without a pill row growing
 * unbounded. Radix Popover portals to document.body for the panel.
 */
export function FolderSelector({
  folders,
  selectedFolderId,
  onSelect,
}: FolderSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = folders.find((f) => f.folderId === selectedFolderId);

  const filtered = folders.filter((f) =>
    (f.displayName ?? f.folderId).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <Popover.Trigger asChild>
        <button
          className="flex w-full max-w-xs items-center justify-between gap-2 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-surface"
        >
          <span className="truncate">
            {selected?.displayName ?? selected?.folderId ?? "Select a folder"}
          </span>
          <span className={clsx("shrink-0 transition-transform", open && "rotate-180")}>
            ⌄
          </span>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-40 w-72 rounded-lg border border-border bg-surface p-3 shadow-lg"
        >
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search folders…"
            className="mb-2 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
          <ul className="max-h-72 space-y-0.5 overflow-y-auto">
            {filtered.map((f) => (
              <li key={f.folderId}>
                <button
                  onClick={() => {
                    onSelect(f.folderId);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={clsx(
                    "block w-full rounded-md px-3 py-1.5 text-left text-sm",
                    f.folderId === selectedFolderId
                      ? "bg-accent text-white"
                      : "hover:bg-background"
                  )}
                >
                  {f.displayName ?? f.folderId}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted">No matching folders.</p>
            )}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
