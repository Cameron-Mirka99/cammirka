"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createInvite } from "@/lib/api/invites";

export function InvitePanel({ folderId }: { folderId: string }) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const mutation = useMutation({
    mutationFn: () => createInvite({ folderId }),
    onSuccess: ({ inviteCode }) => {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setInviteUrl(`${origin}/login?invite=${inviteCode}`);
    },
  });

  const copy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard unavailable — no-op
    }
  };

  return (
    <section className="rounded-lg border border-border p-5">
      <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
        Invite link
      </h2>
      <p className="mt-1 text-xs text-muted">
        One standing invite link per folder — generating again reuses the
        same code with a refreshed expiry.
      </p>
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="mt-4 rounded-full bg-accent px-5 py-1.5 text-sm text-white disabled:opacity-50"
      >
        {mutation.isPending ? "Generating…" : "Generate invite link"}
      </button>
      {inviteUrl && (
        <div className="mt-4 flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2">
          <code className="flex-1 truncate text-xs">{inviteUrl}</code>
          <button
            onClick={copy}
            className="shrink-0 text-xs uppercase tracking-wide text-accent hover:underline"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      )}
    </section>
  );
}
