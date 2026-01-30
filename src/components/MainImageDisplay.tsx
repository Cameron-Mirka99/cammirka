import { Box, CircularProgress, Container } from "@mui/material";
import { Photo } from "../types/photo";
import { useState, useEffect, useRef, useCallback } from "react";
import photoCache from "../utils/photoCache";
import {
  initializeNanogallery2,
  createGalleryConfig,
  GalleryItem,
} from "../utils/galleryConfig";
import { calculateThumbnailDimensions } from "../utils/gallerySizing";
import {
  getNewPhotos,
  getFirstBatchPhotos,
  preloadPhotoBatch,
  shufflePhotos,
} from "../utils/photoLoader";
import "jquery";

type MainImageDisplayProps = {
  photos: Array<Photo>;
  columnsCount: number;
  loading?: boolean;
};

export const MainImageDisplay = ({ photos, columnsCount, loading: loadingProp }: MainImageDisplayProps) => {
  const [loading, setLoading] = useState(true);
  const [visiblePhotos, setVisiblePhotos] = useState<Photo[]>([]);
  const [spinnerUntilStart, setSpinnerUntilStart] = useState(true);

  const prevKeysRef = useRef<Set<string>>(new Set());
  const galleryRef = useRef<HTMLDivElement>(null);
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const galleryInitializedRef = useRef(false);

  const destroyGallery = useCallback(() => {
    if (!galleryRef.current) return;

    try {
      const w = window as any;
      if (w.jQuery) {
        const $el = w.jQuery(galleryRef.current);
        try {
          $el.nanogallery2("destroy");
        } catch {}
        $el.removeData("nanogallery2");
      }

      galleryRef.current.innerHTML = "";
      galleryRef.current.className = "";
      galleryRef.current.removeAttribute("data-nanogallery2");
    } catch (err) {
      console.error("[MainImageDisplay] destroyGallery", err);
    }

    galleryInitializedRef.current = false;
  }, []);

  const initializeGallery = useCallback(() => {
    if (!galleryRef.current || visiblePhotos.length === 0) return;

    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
    }

    initTimeoutRef.current = setTimeout(() => {
      if (!galleryRef.current) return;

      if (galleryInitializedRef.current) {
        destroyGallery();
      }

      const dimensions = calculateThumbnailDimensions(
        galleryRef.current.offsetWidth,
        columnsCount
      );

      const items: GalleryItem[] = visiblePhotos.map((photo) => ({
        src: photoCache.get(photo.url) || photo.url,
        thumb: photoCache.get(photo.url) || photo.url,
      }));

      const config = createGalleryConfig(
        items,
        dimensions.width,
        dimensions.height
      );

      initializeNanogallery2(galleryRef.current, config);
      galleryInitializedRef.current = true;
      initTimeoutRef.current = null;
    }, 50);
  }, [visiblePhotos, columnsCount, destroyGallery]);

  // Load & append photos
  useEffect(() => {
    let mounted = true;

    const newPhotos = getNewPhotos(photos, prevKeysRef.current);

    if (newPhotos.length === 0) {
      if (photos.length > 0 && prevKeysRef.current.size === 0) {
        setLoading(false);
      }
      return () => {
        mounted = false;
      };
    }

    const run = async () => {
      if (prevKeysRef.current.size === 0) {
        setLoading(true);
      }

      if (spinnerUntilStart && prevKeysRef.current.size === 0) {
        setSpinnerUntilStart(false);
      }

      if (prevKeysRef.current.size === 0) {
        const firstBatch = getFirstBatchPhotos(newPhotos, columnsCount);
        await preloadPhotoBatch(firstBatch);
      }

      if (!mounted) return;

      setVisiblePhotos((prev) => [...prev, ...shufflePhotos(newPhotos)]);
      setLoading(false);
      prevKeysRef.current = new Set(photos.map((p) => p.key));
    };

    run();

    return () => {
      mounted = false;
    };
  }, [photos, spinnerUntilStart, columnsCount]);

  // Init gallery when ready
  useEffect(() => {
    if (!loading && visiblePhotos.length > 0) {
      initializeGallery();
    }
  }, [visiblePhotos, loading, initializeGallery]);

  // Cleanup on route change
  useEffect(() => {
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
      destroyGallery();
    };
  }, [destroyGallery]);

  const isLoading = loadingProp ?? loading;

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress />
        <Box sx={{ color: "text.secondary" }}>Loading gallery...</Box>
      </Box>
    );
  }

  if (!isLoading && visiblePhotos.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "30vh",
          flexDirection: "column",
          gap: 2,
          color: "text.secondary",
        }}
      >
        No photos found.
      </Box>
    );
  }

  return (
    <Container
      maxWidth={false}
      sx={{ mt: 4, px: { xs: 2, sm: 3, md: 6 }, py: { xs: 4, md: 8 } }}
    >
      <style>
        {`
          .nanogallery2 .nGY2 .ngy2-i-title,
          .nanogallery2 .nGY2 .ngThumbnail .ngy2-description,
          .nGY2Gallery .ngy2-i-title,
          .nGY2Gallery .ngy2-description {
            display: none !important;
          }

          .nGY2Gallery { gap: 16px !important; }

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

      <div id="nanogallery2" ref={galleryRef} />
    </Container>
  );
};
