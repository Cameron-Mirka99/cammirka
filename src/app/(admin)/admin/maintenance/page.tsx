"use client";

import { useState } from "react";
import { useBackfillFolderUsers } from "@/lib/query/useAdminFolderUsers";

export default function MaintenancePage() {
  const backfill = useBackfillFolderUsers();
  const [result, setResult] = useState<{ scanned: number; updated: number } | null>(null);

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl italic">Maintenance</h1>
        <p className="mt-1 text-sm text-muted">Operational tools, used occasionally.</p>
      </div>

      <section className="rounded-lg border border-border p-5">
        <h2 className="text-sm font-medium">Backfill folder-user mappings</h2>
        <p className="mt-1 text-sm text-muted">
          Scans every Cognito user and ensures anyone with a folder attribute
          has a corresponding membership row. Safe to run any time.
        </p>
        <button
          onClick={() =>
            backfill.mutate(undefined, { onSuccess: setResult })
          }
          disabled={backfill.isPending}
          className="mt-4 rounded-full bg-accent px-5 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {backfill.isPending ? "Scanning…" : "Run backfill"}
        </button>
        {result && (
          <p className="mt-3 text-sm text-muted">
            Scanned {result.scanned} users, updated {result.updated}.
          </p>
        )}
      </section>
    </div>
  );
}
