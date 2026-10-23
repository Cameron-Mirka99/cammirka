import { useCallback, useEffect, useRef, useState } from "react";
import type { Photo, PhotoListResponse } from "@/lib/api/types";

const PAGE_SIZE = 24;

type FeedFetcher = (params: {
  excludeKeys: string[];
  limit: number;
  tag?: string;
}) => Promise<PhotoListResponse>;

/**
 * The backend returns a *shuffled sample*, not a stable page — "load more"
 * works by growing an excludeKeys list, not a cursor. hasMore is inferred
 * from whether a full page came back (per the old app's behavior).
 */
export function usePhotoFeed(fetcher: FeedFetcher, tag?: string) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const requestSeq = useRef(0);

  useEffect(() => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setPhotos([]);
    setHasMore(false);

    fetcher({ excludeKeys: [], limit: PAGE_SIZE, tag })
      .then((res) => {
        if (seq !== requestSeq.current) return;
        setPhotos(res.photos);
        setHasMore(res.photos.length === PAGE_SIZE);
      })
      .catch(() => {
        if (seq !== requestSeq.current) return;
        setPhotos([]);
        setHasMore(false);
      })
      .finally(() => {
        if (seq === requestSeq.current) setLoading(false);
      });
  }, [fetcher, tag]);

  const loadMore = useCallback(() => {
    const seq = requestSeq.current;
    setLoadingMore(true);
    fetcher({
      excludeKeys: photos.map((p) => p.key),
      limit: PAGE_SIZE,
      tag,
    })
      .then((res) => {
        if (seq !== requestSeq.current) return;
        setPhotos((prev) => {
          const seen = new Set(prev.map((p) => p.key));
          const fresh = res.photos.filter((p) => !seen.has(p.key));
          return [...prev, ...fresh];
        });
        setHasMore(res.photos.length === PAGE_SIZE);
      })
      .catch(() => setHasMore(false))
      .finally(() => setLoadingMore(false));
  }, [fetcher, photos, tag]);

  return { photos, loading, loadingMore, hasMore, loadMore };
}
