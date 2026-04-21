import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Container, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "../components/Header";
import { MainImageDisplay } from "../components/MainImageDisplay";
import { Photo } from "../types/photo";
import { photoApiBaseUrl } from "../utils/apiConfig";
import { MotionParallax, MotionReveal } from "../utils/motion";

const PAGE_SIZE = 24;

type TagResponse = {
  label?: string;
  showOnHome?: boolean;
};

export default function Archive() {
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [mainTags, setMainTags] = useState<string[]>([]);
  const [secondaryTags, setSecondaryTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [secondaryExpanded, setSecondaryExpanded] = useState(false);
  const selectedTag = searchParams.get("tag");

  const photoKeys = useMemo(() => photos.map((photo) => photo.key), [photos]);

  const applySelectedTag = useCallback((tag: string | null) => {
    const nextParams = new URLSearchParams(searchParams);
    if (tag) {
      nextParams.set("tag", tag);
    } else {
      nextParams.delete("tag");
    }
    setSearchParams(nextParams, { replace: false });
  }, [searchParams, setSearchParams]);

  const fetchPhotos = useCallback(async (excludeKeys: string[] = [], tag?: string | null) => {
    if (!photoApiBaseUrl) {
      throw new Error("REACT_APP_PHOTO_API_URL is not configured");
    }

    const res = await fetch(`${photoApiBaseUrl}/public-photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ excludeKeys, limit: PAGE_SIZE, tag: tag ?? undefined }),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch photos: ${res.status}`);
    }

    const data = await res.json();
    const incoming: Array<Photo> = Array.isArray(data.photos) ? data.photos : [];
    return incoming;
  }, []);

  const fetchTags = useCallback(async () => {
    if (!photoApiBaseUrl) {
      throw new Error("REACT_APP_PHOTO_API_URL is not configured");
    }

    const res = await fetch(`${photoApiBaseUrl}/tags`, {
      method: "GET",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch tags: ${res.status}`);
    }

    const data = await res.json();
    const incoming = Array.isArray(data.tags) ? (data.tags as TagResponse[]) : [];
    const alphabetical = incoming
      .map((entry) => ({
        label: typeof entry?.label === "string" ? entry.label : "",
        showOnHome: entry?.showOnHome !== false,
      }))
      .filter((entry) => entry.label)
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

    return {
      mainTags: alphabetical.filter((entry) => entry.showOnHome).map((entry) => entry.label),
      secondaryTags: alphabetical.filter((entry) => !entry.showOnHome).map((entry) => entry.label),
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadInitial = async () => {
      if (mounted) {
        setLoading(true);
      }
      try {
        const [incoming, tags] = await Promise.all([
          fetchPhotos([], selectedTag),
          fetchTags(),
        ]);
        if (!mounted) return;
        setPhotos(incoming);
        setMainTags(tags.mainTags);
        setSecondaryTags(tags.secondaryTags);
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
  }, [fetchPhotos, fetchTags, selectedTag]);

  const handleLoadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const incoming = await fetchPhotos(photoKeys, selectedTag);
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
  }, [fetchPhotos, photoKeys, selectedTag]);

  const hasSecondaryTags = secondaryTags.length > 0;
  const selectedTagIsSecondary = selectedTag !== null && secondaryTags.includes(selectedTag);

  useEffect(() => {
    if (selectedTagIsSecondary) {
      setSecondaryExpanded(true);
    }
  }, [selectedTagIsSecondary]);

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
          {selectedTag && (
            <Typography sx={{ mt: 1.5, color: theme.palette.primary.main, fontSize: "0.9rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Filtering by tag: {selectedTag}
            </Typography>
          )}
          <Box sx={{ mt: 3, display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              size="small"
              variant={selectedTag === null ? "contained" : "outlined"}
              onClick={() => applySelectedTag(null)}
            >
              All tags
            </Button>
            {mainTags.map((tag) => (
              <Button
                key={tag}
                size="small"
                variant={selectedTag === tag ? "contained" : "outlined"}
                onClick={() => applySelectedTag(tag)}
              >
                {tag}
              </Button>
            ))}
          </Box>
          {hasSecondaryTags && (
            <Accordion
              disableGutters
              expanded={secondaryExpanded || selectedTagIsSecondary}
              onChange={(_event, expanded) => setSecondaryExpanded(expanded)}
              sx={{
                mt: 2,
                background: "transparent",
                boxShadow: "none",
                borderTop: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                "&::before": {
                  display: "none",
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: theme.palette.text.secondary }} />}
                sx={{
                  px: 0,
                  minHeight: 52,
                  "& .MuiAccordionSummary-content": {
                    my: 1.5,
                    alignItems: "center",
                    gap: 1.5,
                  },
                }}
              >
                <Typography sx={{ fontSize: "0.86rem", letterSpacing: "0.12em", textTransform: "uppercase", color: theme.palette.text.secondary }}>
                  Explore More Tags
                </Typography>
                <Typography sx={{ fontSize: "0.92rem", color: theme.palette.text.disabled }}>
                  {secondaryTags.length} additional collections
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pt: 0, pb: 0 }}>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", pb: 1 }}>
                  {secondaryTags.map((tag) => (
                    <Button
                      key={tag}
                      size="small"
                      variant={selectedTag === tag ? "contained" : "outlined"}
                      onClick={() => applySelectedTag(tag)}
                    >
                      {tag}
                    </Button>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}
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
