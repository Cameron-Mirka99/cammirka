import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePhotoFeed } from "./usePhotoFeed";
import type { PhotoListResponse } from "@/lib/api/types";

function makeResponse(keys: string[]): PhotoListResponse {
  return {
    photos: keys.map((key) => ({ key, url: `https://example.com/${key}` })),
    meta: {
      requested: keys.length,
      returned: keys.length,
      excludedCount: 0,
      scanned: keys.length,
      eligibleCount: keys.length,
      folderId: "public",
    },
  };
}

describe("usePhotoFeed seedExcludeKeys", () => {
  it("includes seedExcludeKeys in the initial fetch", async () => {
    const fetcher = vi.fn().mockResolvedValue(makeResponse(["a"]));
    renderHook(() => usePhotoFeed(fetcher, undefined, ["newest-1", "newest-2"]));

    await waitFor(() => expect(fetcher).toHaveBeenCalled());
    expect(fetcher.mock.calls[0][0].excludeKeys).toEqual(["newest-1", "newest-2"]);
  });

  it("carries seedExcludeKeys forward into loadMore alongside already-loaded keys", async () => {
    const fetcher = vi.fn().mockResolvedValue(makeResponse(["a", "b"]));
    const { result } = renderHook(() =>
      usePhotoFeed(fetcher, undefined, ["newest-1"])
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    fetcher.mockClear();

    result.current.loadMore();

    await waitFor(() => expect(fetcher).toHaveBeenCalled());
    expect(fetcher.mock.calls[0][0].excludeKeys).toEqual(["newest-1", "a", "b"]);
  });

  it("defaults to no seed keys when none are passed", async () => {
    const fetcher = vi.fn().mockResolvedValue(makeResponse([]));
    renderHook(() => usePhotoFeed(fetcher));

    await waitFor(() => expect(fetcher).toHaveBeenCalled());
    expect(fetcher.mock.calls[0][0].excludeKeys).toEqual([]);
  });
});
