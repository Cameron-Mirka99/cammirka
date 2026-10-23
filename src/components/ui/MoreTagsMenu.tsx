"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import clsx from "clsx";
import type { TagRecord } from "@/lib/api/types";

type MoreTagsMenuProps = {
  tags: TagRecord[];
  activeTag?: string;
  onSelect: (label: string) => void;
};

/**
 * Searchable dropdown for the long tail of tags, so the pill bar doesn't
 * grow unbounded as the catalog does. Uses Radix Popover so the panel
 * portals to document.body — it would otherwise get clipped by the
 * sticky pill bar's overflow-x-auto (which implicitly forces overflow-y
 * to auto too, per the CSS spec).
 */
export function MoreTagsMenu({ tags, activeTag, onSelect }: MoreTagsMenuProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const isActive = tags.some((t) => t.label === activeTag);

  const filtered = tags.filter((t) =>
    t.label.toLowerCase().includes(query.toLowerCase())
  );

  if (tags.length === 0) return null;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className={clsx(
            "flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm transition-colors",
            isActive
              ? "border-accent bg-accent text-white"
              : "border-border text-foreground hover:bg-surface"
          )}
        >
          {isActive ? activeTag : "More tags"}
          <span className={clsx("transition-transform", open && "rotate-180")}>⌄</span>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-40 w-64 rounded-lg border border-border bg-surface p-3 shadow-lg"
        >
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tags…"
            className="mb-2 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
          <ul className="max-h-64 space-y-0.5 overflow-y-auto">
            {filtered.map((t) => (
              <li key={t.tagKey}>
                <button
                  onClick={() => {
                    onSelect(t.label);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={clsx(
                    "block w-full rounded-md px-3 py-1.5 text-left text-sm",
                    t.label === activeTag
                      ? "bg-accent text-white"
                      : "hover:bg-background"
                  )}
                >
                  {t.label}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted">No matching tags.</p>
            )}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
