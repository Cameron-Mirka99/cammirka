import { Masonry } from "@mui/lab";
import { Container, Box, CircularProgress } from "@mui/material";
import { Photo } from "../pages/Home";
import PhotoItem from "./PhotoItem";
import { useState, useEffect, useRef } from 'react';
import photoCache from '../utils/photoCache';

type MainImageDisplayProps = {
  setSelectedPhoto: (photoUrl: Photo) => void;
  setModalOpen: (open: boolean) => void;
  photos: Array<Photo>;
  columnsCount: number;
  loadMore: () => Promise<void>;
  fetchingMore: boolean;
  hasMore: boolean;
  onImagesAppended: () => void;
};

export const MainImageDisplay = ({
  setSelectedPhoto,
  setModalOpen,
  photos,
  columnsCount
  , loadMore, fetchingMore, hasMore, onImagesAppended
}: MainImageDisplayProps) => {
  const [loading, setLoading] = useState(true);
  const [visiblePhotos, setVisiblePhotos] = useState<Photo[]>([]);
  const prevKeysRef = useRef<Set<string>>(new Set());
  const scrollRestoreRef = useRef<number | null>(null);
  // Show a full-page spinner until preloading of the first batch actually starts.
  // This ensures the spinner is visible up to the moment images begin loading,
  // then we hide it and let the gallery start rendering/animating in images.
  const [spinnerUntilStart, setSpinnerUntilStart] = useState(true);
  
  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo);
    setModalOpen(true);
  };

  // When photos prop changes, preload only the newly-received images and
  // append them to visiblePhotos so the UI increments as pages arrive.
  useEffect(() => {
    let mounted = true;

    // Determine which keys are new compared to previously-seen keys
    const newPhotos = photos.filter(p => !prevKeysRef.current.has(p.key));

    if (newPhotos.length === 0) {
      // Nothing new arrived; if we have any photos at all, consider initial loading finished
      if (photos.length > 0 && prevKeysRef.current.size === 0) setLoading(false);
      return () => { mounted = false; };
    }

    const preloadAndAppend = async () => {
      // Capture current scroll position so we can restore it after appending
      // new images. This prevents the page from jumping to the top when the
      // Masonry layout recalculates.
      try {
        scrollRestoreRef.current = window.scrollY;
      } catch (_) {
        scrollRestoreRef.current = null;
      }
      // Only show the full-page loader on the very first load
      if (prevKeysRef.current.size === 0) setLoading(true);

      // We've reached the point where preloading will start — hide the
      // "waiting" spinner so the gallery can render and images will begin
      // loading into it. This satisfies "display up to the point images
      // start loading".
      if (spinnerUntilStart && prevKeysRef.current.size === 0) {
        setSpinnerUntilStart(false);
      }
      try {
        await photoCache.preloadMany(newPhotos.map(p => p.url));
      } catch (error) {
        console.error("Error preloading images:", error);
      }

      // Shuffle new photos so each page isn't strictly ordered
      const shuffledNew = [...newPhotos].sort(() => Math.random() - 0.5);

      // Add a small delay so Masonry can calculate and animations look nice
      setTimeout(async () => {
        if (!mounted) return;
        setVisiblePhotos(prev => [...prev, ...shuffledNew]);
        // Mark initial load as finished
        if (prevKeysRef.current.size === 0) setLoading(false);

    // Update the set of seen keys to include all photos we've been given
    prevKeysRef.current = new Set(photos.map(p => p.key));

          // Wait for the newly appended images to actually start loading in
          // the DOM (listen for img load/error) before notifying the app that
          // it's safe to fetch the next page.
          const waitForImageLoads = async (keys: string[], timeout = 5000) => {
            const keysSet = new Set(keys);
            const remaining = new Set(keys);
            const start = Date.now();

            // Helper to attach listeners to any matching img elements we find
            const attachListeners = () => {
              const imgs = Array.from(document.getElementsByTagName('img')) as HTMLImageElement[];
              imgs.forEach(img => {
                const title = img.getAttribute('title') || '';
                if (!keysSet.has(title)) return;
                if (!remaining.has(title)) return;

                if (img.complete) {
                  remaining.delete(title);
                  return;
                }

                const onDone = () => {
                  img.removeEventListener('load', onDone);
                  img.removeEventListener('error', onDone);
                  remaining.delete(title);
                };

                img.addEventListener('load', onDone);
                img.addEventListener('error', onDone);
              });
            };

            // Poll until all images are observed or timeout
            return new Promise<void>((resolve) => {
              const interval = setInterval(() => {
                attachListeners();
                if (remaining.size === 0) {
                  clearInterval(interval);
                  resolve();
                } else if (Date.now() - start > timeout) {
                  // Give up after timeout and resolve anyway
                  clearInterval(interval);
                  resolve();
                }
              }, 100);
              // Run once immediately
              attachListeners();
            });
          };

          try {
            await waitForImageLoads(shuffledNew.map(p => p.key), 7000);
          } catch (_) {
            // ignore
          }

          try {
            onImagesAppended();
          } catch (err) {
            // ignore errors from parent callback
          }

          // Restore scroll position if we captured it earlier. Use a short
          // timeout to allow the browser to settle layout after images are
          // inserted; using 'auto' prevents further jumps.
          if (scrollRestoreRef.current !== null) {
            const restoreY = scrollRestoreRef.current;
            setTimeout(() => {
              try {
                window.scrollTo({ top: restoreY, left: window.scrollX, behavior: 'auto' });
              } catch (_) {
                // ignore
              }
              scrollRestoreRef.current = null;
            }, 50);
          }
      }, 400);
    };

    preloadAndAppend();

    return () => { mounted = false; };
  }, [photos]);

  // Scroll listener: when user scrolls to bottom, request more photos
  // Improved scroll trigger: only allow a new fetch when user leaves and re-enters threshold
  const wasNearBottomRef = useRef(false);
  useEffect(() => {
    const onScroll = () => {
      if (!hasMore || fetchingMore) return;
      const estimatedRowHeight = 250;
      const rowsToTrigger = 3;
      const triggerDistance = estimatedRowHeight * rowsToTrigger;
      const scrollBottom = window.innerHeight + window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const nearBottom = (docHeight - scrollBottom) <= triggerDistance;

      // Only trigger when entering the threshold (not while staying in it)
      if (nearBottom && !wasNearBottomRef.current) {
        wasNearBottomRef.current = true;
        loadMore();
      } else if (!nearBottom && wasNearBottomRef.current) {
        // Reset trigger when user scrolls away from threshold
        wasNearBottomRef.current = false;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [loadMore, fetchingMore, hasMore]);

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress />
        <Box sx={{ color: 'text.secondary' }}>Loading gallery...</Box>
      </Box>
    );
  }

  return (
    <Container maxWidth={false} sx={{ marginTop: 4 }}>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
      <Masonry columns={columnsCount} spacing={2}>
        {visiblePhotos.map((photo: Photo, index: number) => {
          // Find the original index of this photo in the photos array
          const originalIndex = photos.findIndex(p => p.key === photo.key);
          
          return (
            <Box
              key={`photo-${photo.key || index}`}
              sx={{
                opacity: 0,
                animationName: 'fadeIn',
                animationDuration: '0.8s',
                animationTimingFunction: 'ease-out',
                animationFillMode: 'forwards',
                animationDelay: `${index * 0.15}s`
              }}
            >
              <PhotoItem
                src={photo}
                alt={`Photo ${originalIndex + 1}`}
                onClick={() => handlePhotoClick(photo)}
                id={`photo-item-${originalIndex}`}
              />
            </Box>
          );
        })}
      </Masonry>
      {fetchingMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
    </Container>
  );
};