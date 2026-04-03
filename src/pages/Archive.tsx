import { Container, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Header } from "../components/Header";
import { MainImageDisplay } from "../components/MainImageDisplay";
import { Photo } from "../types/photo";
import { photoApiBaseUrl } from "../utils/apiConfig";
import { MotionParallax, MotionReveal } from "../utils/motion";

const PAGE_SIZE = 24;

export default function Archive() {
  const theme = useTheme();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const photoKeys = useMemo(() => photos.map((photo) => photo.key), [photos]);

  const fetchPhotos = useCallback(async (excludeKeys: string[] = []) => {
    if (!photoApiBaseUrl) {
      throw new Error("REACT_APP_PHOTO_API_URL is not configured");
    }

    const res = await fetch(`${photoApiBaseUrl}/public-photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ excludeKeys, limit: PAGE_SIZE }),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch photos: ${res.status}`);
    }

    const data = await res.json();
    const incoming: Array<Photo> = Array.isArray(data.photos) ? data.photos : [];
    return incoming;
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadInitial = async () => {
      try {
        const incoming = await fetchPhotos([]);
        if (!mounted) return;
        setPhotos(incoming);
        setHasMore(incoming.length === PAGE_SIZE);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch archive photos:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadInitial();
    return () => {
      mounted = false;
    };
  }, [fetchPhotos]);

  const handleLoadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const incoming = await fetchPhotos(photoKeys);
      setPhotos((current) => {
        const existing = new Set(current.map((photo) => photo.key));
        const deduped = incoming.filter((photo) => !existing.has(photo.key));
        return [...current, ...deduped];
      });
      setHasMore(incoming.length === PAGE_SIZE);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to load more archive photos:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPhotos, photoKeys]);

  return (
    <>
      <Header />

      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 5, lg: 7 }, pt: { xs: 4, md: 6 }, pb: { xs: 2, md: 3 } }}>
        <MotionParallax offset={52}>
          <MotionReveal
          sx={{
            borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
            pb: { xs: 3, md: 4 },
            mb: { xs: 4, md: 5 },
            maxWidth: 820,
            position: "relative",
            "&::after": {
              content: '""',
              position: "absolute",
              left: 0,
              bottom: -1,
              width: { xs: 120, md: 180 },
              height: 1.5,
              background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.9)} 0%, transparent 100%)`,
              animation: "appLinePulse 10s ease-in-out infinite",
              transformOrigin: "left center",
            },
          }}
        >
          <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 1.5 }}>
            Public Archive
          </Typography>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: "clamp(2.5rem, 11vw, 3.6rem)", md: "clamp(3.6rem, 7vw, 5rem)" },
              color: theme.palette.text.primary,
              mb: 1.5,
            }}
          >
            Spend a little more time with the archive.
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary, maxWidth: 640 }}>
            This page is meant for wandering a bit: birds, wetlands, woods, and the changing conditions that shape how
            each frame comes together.
          </Typography>
          </MotionReveal>
        </MotionParallax>
      </Container>

      <MainImageDisplay
        photos={photos}
        loading={loading}
        variant="archive"
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={handleLoadMore}
      />
    </>
  );
}
