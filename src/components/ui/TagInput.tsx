"use client";

import { useState } from "react";
import { normalizeTags, buildTagKey } from "@/lib/tagUtils";

type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
};

export function TagInput({ value, onChange, placeholder, suggestions = [] }: TagInputProps) {
  const [draft, setDraft] = useState("");

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    onChange(normalizeTags([...value, trimmed]));
    setDraft("");
  };

  const remove = (tag: string) => {
    onChange(value.filter((t) => buildTagKey(t) !== buildTagKey(tag)));
  };

  const matches = suggestions.filter(
    (s) =>
      draft &&
      s.toLowerCase().includes(draft.toLowerCase()) &&
      !value.some((v) => buildTagKey(v) === buildTagKey(s))
  );

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5">
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-xs"
          >
            {tag}
            <button onClick={() => remove(tag)} aria-label={`Remove ${tag}`}>
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit(draft);
            } else if (e.key === "Backspace" && !draft && value.length > 0) {
              remove(value[value.length - 1]);
            }
          }}
          placeholder={value.length === 0 ? placeholder : undefined}
          className="min-w-24 flex-1 bg-transparent text-sm outline-none"
        />
      </div>
      {matches.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-md border border-border bg-surface shadow-lg">
          {matches.slice(0, 6).map((m) => (
            <li key={m}>
              <button
                onClick={() => commit(m)}
                className="block w-full px-3 py-1.5 text-left text-sm hover:bg-background"
              >
                {m}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
