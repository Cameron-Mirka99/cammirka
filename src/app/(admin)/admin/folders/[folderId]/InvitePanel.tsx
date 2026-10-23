"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createInvite } from "@/lib/api/invites";

export function InvitePanel({ folderId }: { folderId: string }) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmingRotate, setConfirmingRotate] = useState(false);

  const buildUrl = (inviteCode: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/login?invite=${inviteCode}`;
  };

  const generate = useMutation({
    mutationFn: () => createInvite({ folderId }),
    onSuccess: ({ inviteCode }) => setInviteUrl(buildUrl(inviteCode)),
  });

  const rotate = useMutation({
    mutationFn: () => createInvite({ folderId, rotate: true }),
    onSuccess: ({ inviteCode }) => {
      setInviteUrl(buildUrl(inviteCode));
      setConfirmingRotate(false);
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
        same code with a refreshed expiry. Rotating invalidates the old
        link immediately.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
          className="rounded-full bg-accent px-5 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {generate.isPending ? "Generating…" : "Generate invite link"}
        </button>

        {confirmingRotate ? (
          <span className="flex items-center gap-2 text-sm">
            <span className="text-muted">Invalidate the old link?</span>
            <button
              onClick={() => rotate.mutate()}
              disabled={rotate.isPending}
              className="text-red-500 underline disabled:opacity-50"
            >
              {rotate.isPending ? "Rotating…" : "Confirm"}
            </button>
            <button onClick={() => setConfirmingRotate(false)} className="text-muted">
              Cancel
            </button>
          </span>
        ) : (
          <button
            onClick={() => setConfirmingRotate(true)}
            className="text-xs uppercase tracking-wide text-red-500 hover:underline"
          >
            Rotate (invalidates old link)
          </button>
        )}
      </div>
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
