"use client";

import { useRef, useState } from "react";
import { useBackfillFolderUsers } from "@/lib/query/useAdminFolderUsers";
import { backfillPhotoDimensions } from "@/lib/api/photos";

type DimensionsProgress = {
  updated: number;
  failed: number;
  remaining: number;
  totalMissing: number;
};

export default function MaintenancePage() {
  const backfill = useBackfillFolderUsers();
  const [result, setResult] = useState<{ scanned: number; updated: number } | null>(null);

  const [dimensionsRunning, setDimensionsRunning] = useState(false);
  const [dimensionsProgress, setDimensionsProgress] = useState<DimensionsProgress | null>(null);
  const [dimensionsError, setDimensionsError] = useState<string | null>(null);
  const stopRequested = useRef(false);

  const runDimensionsBackfill = async () => {
    setDimensionsRunning(true);
    setDimensionsError(null);
    stopRequested.current = false;
    let updated = 0;
    let failed = 0;

    try {
      while (!stopRequested.current) {
        const res = await backfillPhotoDimensions();
        updated += res.updated;
        failed += res.failed;
        setDimensionsProgress({
          updated,
          failed,
          remaining: res.remaining,
          totalMissing: res.totalMissing,
        });
        if (res.done) break;
      }
    } catch (err) {
      setDimensionsError(err instanceof Error ? err.message : "Backfill failed.");
    } finally {
      setDimensionsRunning(false);
    }
  };

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

      <section className="rounded-lg border border-border p-5">
        <h2 className="text-sm font-medium">Backfill photo dimensions</h2>
        <p className="mt-1 text-sm text-muted">
          Downloads and measures every photo that doesn&apos;t yet have a
          stored width/height (older uploads, from before this was
          captured automatically). Runs in small batches — safe to stop
          and resume later, since already-measured photos are skipped.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={runDimensionsBackfill}
            disabled={dimensionsRunning}
            className="rounded-full bg-accent px-5 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {dimensionsRunning ? "Running…" : "Run backfill"}
          </button>
          {dimensionsRunning && (
            <button
              onClick={() => (stopRequested.current = true)}
              className="text-xs uppercase tracking-wide text-muted hover:text-foreground"
            >
              Stop after this batch
            </button>
          )}
        </div>
        {dimensionsError && <p className="mt-3 text-sm text-red-500">{dimensionsError}</p>}
        {dimensionsProgress && (
          <p className="mt-3 text-sm text-muted">
            Updated {dimensionsProgress.updated}
            {dimensionsProgress.failed > 0 && `, ${dimensionsProgress.failed} failed`} ·{" "}
            {dimensionsProgress.remaining > 0
              ? `${dimensionsProgress.remaining} of ${dimensionsProgress.totalMissing} remaining`
              : "all done"}
          </p>
        )}
      </section>
    </div>
  );
}
