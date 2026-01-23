import { Box, CircularProgress, Container } from "@mui/material";
import { Photo } from "../pages/Home";
import { useState, useEffect, useRef, useCallback } from 'react';
import photoCache from '../utils/photoCache';
import { initializeNanogallery2, createGalleryConfig, GalleryItem } from '../utils/galleryConfig';
import { calculateThumbnailDimensions } from '../utils/gallerySizing';
import { getNewPhotos, getFirstBatchPhotos, preloadPhotoBatch, shufflePhotos } from '../utils/photoLoader';
import 'jquery';

type MainImageDisplayProps = {
  photos: Array<Photo>;
  columnsCount: number;
};

export const MainImageDisplay = ({
  photos,
  columnsCount
}: MainImageDisplayProps) => {
  const [loading, setLoading] = useState(true);
  const [visiblePhotos, setVisiblePhotos] = useState<Photo[]>([]);
  const prevKeysRef = useRef<Set<string>>(new Set());
  const galleryRef = useRef<HTMLDivElement>(null);
  const [spinnerUntilStart, setSpinnerUntilStart] = useState(true);
  
  const initializeGallery = useCallback(() => {
    if (!galleryRef.current) return;

    const dimensions = calculateThumbnailDimensions(
      galleryRef.current.offsetWidth,
      columnsCount
    );

    const galleryItems: GalleryItem[] = visiblePhotos.map((photo) => ({
      src: photoCache.get(photo.url) || photo.url,
      thumb: photoCache.get(photo.url) || photo.url,
    }));

    const config = createGalleryConfig(
      galleryItems,
      dimensions.width,
      dimensions.height
    );

    initializeNanogallery2(galleryRef.current, config);
  }, [visiblePhotos, columnsCount]);

  // When photos prop changes, preload only the newly-received images and
  // append them to visiblePhotos so the UI increments as pages arrive.
  useEffect(() => {
    let mounted = true;

    const newPhotos = getNewPhotos(photos, prevKeysRef.current);

    if (newPhotos.length === 0) {
      // Nothing new arrived; if we have any photos at all, consider initial loading finished
      if (photos.length > 0 && prevKeysRef.current.size === 0) setLoading(false);
      return () => { mounted = false; };
    }

    const preloadAndAppend = async () => {
      // Only show the full-page loader on the very first load
      if (prevKeysRef.current.size === 0) setLoading(true);

      // Hide the "waiting" spinner so the gallery can render and images will begin loading
      if (spinnerUntilStart && prevKeysRef.current.size === 0) {
        setSpinnerUntilStart(false);
      }
      
      // Only preload the first batch of images for immediate display
      // Nanogallery2's lazy loading will handle the rest
      if (prevKeysRef.current.size === 0 && newPhotos.length > 0) {
        const firstBatch = getFirstBatchPhotos(newPhotos, columnsCount);
        await preloadPhotoBatch(firstBatch);
      }

      // Shuffle new photos so each page isn't strictly ordered
      const shuffledNew = shufflePhotos(newPhotos);

      // Add a small delay so gallery can calculate and animations look nice
      setTimeout(() => {
        if (!mounted) return;
        setVisiblePhotos(prev => [...prev, ...shuffledNew]);
        // Mark initial load as finished
        if (prevKeysRef.current.size === 0) setLoading(false);

        // Update the set of seen keys to include all photos we've been given
        prevKeysRef.current = new Set(photos.map(p => p.key));
      }, 400);
    };

    preloadAndAppend();

    return () => { mounted = false; };
  }, [photos, spinnerUntilStart, columnsCount]);

  // Initialize or reinitialize the gallery whenever visiblePhotos changes
  useEffect(() => {
    if (visiblePhotos.length > 0 && !loading) {
      const timer = setTimeout(() => {
        initializeGallery();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visiblePhotos, loading, initializeGallery]);

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
    <Container maxWidth={false} sx={{ marginTop: 4, px: { xs: 2, sm: 3, md: 6 }, py: { xs: 4, md: 8 } }}>
      <style>
        {`
          .nanogallery2 .nGY2 .ngy2-i-title,
          .nanogallery2 .nGY2 .ngThumbnail .ngy2-description,
          .nGY2Gallery .ngy2-i-title,
          .nGY2Gallery .ngy2-description {
            display: none !important;
          }
          
          /* Enhanced gallery styling */
          .nGY2Gallery {
            gap: 16px !important;
          }
          
          .nGY2Gallery .ngy2-item {
            border-radius: 12px !important;
            overflow: hidden !important;
            box-shadow: 0 4px 12px rgba(255, 179, 0, 0.1) !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          
          .nGY2Gallery .ngy2-item:hover {
            box-shadow: 0 12px 32px rgba(255, 179, 0, 0.25) !important;
            transform: translateY(-4px) !important;
          }
        `}
      </style>
      <div
        id="nanogallery2"
        ref={galleryRef}
        data-nanogallery2="{ thumbnailHeight: 200, thumbnailAlignment: 'center' }"
      />
    </Container>
  );
};