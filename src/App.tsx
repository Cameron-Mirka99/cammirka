import React, { useState, useEffect, useCallback } from 'react';

// Module-level flag to ensure the initial photos fetch runs only once per
// full page load. This prevents duplicate fetches caused by React StrictMode
// mounting/unmounting components in development.

import { Routes, Route } from 'react-router-dom';
import Home, { Photo } from './pages/Home';
import About from './pages/About';

let initialPhotosFetched = false;
function App() {
  // photos holds the accumulated list we have fetched so far
  const [photos, setPhotos] = useState([] as Array<Photo>);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  // Prevent requesting the next page until the current page's images have
  // been preloaded and appended into the gallery. This flag is toggled by
  // MainImageDisplay via the onImagesAppended callback.
  const [canFetchNext, setCanFetchNext] = useState(true);

  // Fetch a page of photos from the server. The server is expected to
  // accept a POST body with { excludeKeys: string[], limit: number }
  // and return { photos: Photo[] } containing up to `limit` new photos.
  const fetchPhotos = useCallback(async (excludeKeys: string[] = [], limit = 15) => {
    // Block further fetches until MainImageDisplay notifies images appended
    setCanFetchNext(false);
    setFetchingMore(true);
    try {
      const res = await fetch('https://atp0hr8g95.execute-api.us-east-1.amazonaws.com/GetPhotoList', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excludeKeys, limit }),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch photos: ${res.status}`);
      }

      const data = await res.json();

  const incoming: Array<Photo> = Array.isArray(data.photos) ? data.photos : [];

      // If server returned fewer than requested, assume we are at the end
      if (incoming.length < limit) setHasMore(false);

      // Append incoming photos to state
      setPhotos(prev => {
        // Avoid duplicates by key
        const existingKeys = new Set(prev.map(p => p.key));
        const filtered = incoming.filter(p => !existingKeys.has(p.key));
        return [...prev, ...filtered];
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch photos:', err);
      // Allow retrying or fetching again if the network request failed
      setCanFetchNext(true);
    } finally {
      setFetchingMore(false);
      setLoading(false);
    }
  }, []);

  // Initial fetch: request first 15. Use a module-level guard so this only
  // runs once per full page load (prevents duplicate requests when React
  // StrictMode mounts/unmounts components during development).
  useEffect(() => {
    if (initialPhotosFetched) return;
    initialPhotosFetched = true;
    // Only run once on page load
    fetchPhotos([], 15);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Called by UI to fetch the next page. It will pass names of already fetched images.
  const loadMorePhotos = useCallback(async () => {
    if (fetchingMore || !hasMore || !canFetchNext) return;
    const alreadyFetchedNames = photos.map(p => p.key);
    // pass the already fetched keys as `excludeKeys` in the POST body
    await fetchPhotos(alreadyFetchedNames, 15);
  }, [fetchPhotos, photos, fetchingMore, hasMore, canFetchNext]);

  // Callback passed to MainImageDisplay to signal that newly-fetched images
  // have been preloaded and appended into the gallery, and it's safe to
  // fetch the next page.
  const handleImagesAppended = useCallback(() => {
    setCanFetchNext(true);
  }, []);

  return (
    <Routes>
  <Route path="/" element={<Home photos={photos} loading={loading} loadMore={loadMorePhotos} fetchingMore={fetchingMore} hasMore={hasMore} onImagesAppended={handleImagesAppended} />} />
      <Route path="/about" element={<About />} />
    </Routes>
  );
}

export default App;
