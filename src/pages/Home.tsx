import { Box, Button, Container, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Header } from "../components/Header";
import { Photo } from "../types/photo";
import { photoApiBaseUrl } from "../utils/apiConfig";
import { MotionParallax, MotionReveal } from "../utils/motion";

type TagTile = {
  tag: string;
  imageUrl: string | null;
};

type TagResponse = {
  tagKey?: string;
  label?: string;
  showOnHome?: boolean;
  sortOrder?: number;
};

function Home() {
  const theme = useTheme();
  const [tagTiles, setTagTiles] = useState<TagTile[]>([]);
  const [heroPhoto, setHeroPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTags = useCallback(async () => {
    if (!photoApiBaseUrl) {
      throw new Error("REACT_APP_PHOTO_API_URL is not configured");
    }

    const res = await fetch(`${photoApiBaseUrl}/tags`, { method: "GET" });
    if (!res.ok) {
      throw new Error(`Failed to fetch tags: ${res.status}`);
    }

    const data = await res.json();
    return Array.isArray(data.tags)
      ? (data.tags as TagResponse[])
          .filter((entry: TagResponse) => entry?.showOnHome !== false)
          .sort((a, b) => {
            const aOrder = typeof a?.sortOrder === "number" ? a.sortOrder : Number.MAX_SAFE_INTEGER;
            const bOrder = typeof b?.sortOrder === "number" ? b.sortOrder : Number.MAX_SAFE_INTEGER;
            if (aOrder === bOrder) {
              return (a?.label ?? "").localeCompare(b?.label ?? "", undefined, { sensitivity: "base" });
            }
            return aOrder - bOrder;
          })
          .map((entry: TagResponse) => (typeof entry?.label === "string" ? entry.label : ""))
          .filter(Boolean)
      : [];
  }, []);

  const fetchTagPreview = useCallback(async (tag: string) => {
    if (!photoApiBaseUrl) {
      throw new Error("REACT_APP_PHOTO_API_URL is not configured");
    }

    const res = await fetch(`${photoApiBaseUrl}/public-photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag, limit: 1 }),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch preview for tag "${tag}": ${res.status}`);
    }

    const data = await res.json();
    const photos: Photo[] = Array.isArray(data.photos) ? data.photos : [];
    const firstPhoto = photos[0];
    return firstPhoto?.thumbnailUrl ?? firstPhoto?.url ?? null;
  }, []);

  const fetchHeroPhoto = useCallback(async () => {
    if (!photoApiBaseUrl) {
      throw new Error("REACT_APP_PHOTO_API_URL is not configured");
    }

    const res = await fetch(`${photoApiBaseUrl}/public-photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit: 1 }),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch hero photo: ${res.status}`);
    }

    const data = await res.json();
    const photos: Photo[] = Array.isArray(data.photos) ? data.photos : [];
    const firstPhoto = photos[0];
    return firstPhoto?.thumbnailUrl ?? firstPhoto?.url ?? null;
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [tags, nextHeroPhoto] = await Promise.all([
          fetchTags(),
          fetchHeroPhoto().catch(() => null),
        ]);
        const tiles = await Promise.all(
          tags.map(async (tag: string) => ({
            tag,
            imageUrl: await fetchTagPreview(tag).catch(() => null),
          })),
        );

        if (!mounted) return;
        setTagTiles(tiles);
        setHeroPhoto(nextHeroPhoto);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to build home tag index:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [fetchHeroPhoto, fetchTagPreview, fetchTags]);

  return (
    <>
      <Header />

      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          pt: { xs: 15, md: 17 },
          pb: { xs: 6, md: 8 },
          backgroundColor: "#0F0F0C",
          backgroundImage: heroPhoto
            ? `linear-gradient(180deg, rgba(8, 8, 7, 0.26) 0%, rgba(8, 8, 7, 0.46) 38%, rgba(8, 8, 7, 0.88) 100%), linear-gradient(90deg, rgba(8, 8, 7, 0.72) 0%, rgba(8, 8, 7, 0.2) 48%, rgba(8, 8, 7, 0.56) 100%), url(${heroPhoto})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center center",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 18% 18%, rgba(184, 138, 42, 0.16), transparent 26%), radial-gradient(circle at 82% 26%, rgba(127, 138, 120, 0.14), transparent 30%), linear-gradient(180deg, rgba(12, 12, 10, 0.08) 0%, rgba(12, 12, 10, 0) 100%)",
            pointerEvents: "none",
          }}
        />

        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 5, lg: 7 } }}>
          <MotionParallax offset={42}>
            <MotionReveal
              sx={{
                maxWidth: 900,
                pb: { xs: 3.5, md: 4.5 },
                borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                position: "relative",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  left: 0,
                  bottom: -1,
                  width: { xs: 140, md: 220 },
                  height: 1.5,
                  background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.92)} 0%, transparent 100%)`,
                },
              }}
            >
              <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 1.5 }}>
                Cameron Mirka
              </Typography>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: "clamp(3rem, 13vw, 4.6rem)", md: "clamp(4.8rem, 9vw, 7rem)" },
                  color: theme.palette.text.primary,
                  maxWidth: 860,
                }}
              >
                Wildlife photographs from around Central Ohio.
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  mt: 2,
                  maxWidth: 620,
                  color: theme.palette.text.secondary,
                  fontSize: { xs: "1rem", md: "1.08rem" },
                }}
              >
                Start here, then follow the collections below to move through the archive by subject, season, and the kinds of encounters that keep bringing me back outside.
              </Typography>
              <Box sx={{ mt: 3.5, display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                <Button component={RouterLink} to="/archive" variant="contained" color="primary" sx={{ color: "#0F0F0C" }}>
                  Browse Archive
                </Button>
                <Button component={RouterLink} to="/about" variant="outlined">
                  About Cameron
                </Button>
              </Box>
            </MotionReveal>
          </MotionParallax>
        </Container>
      </Box>

      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 5, lg: 7 }, pb: { xs: 5, md: 8 } }}>
        {loading ? (
          <Box sx={{ py: 12, color: "text.secondary", textAlign: "center" }}>
            Preparing collections...
          </Box>
        ) : tagTiles.length === 0 ? (
          <Box sx={{ py: 12, color: "text.secondary", textAlign: "center" }}>
            No tagged collections are available yet.
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                xl: "repeat(3, minmax(0, 1fr))",
              },
              gap: { xs: 1.75, md: 2.25 },
            }}
          >
            {tagTiles.map((tile, index) => (
              <MotionReveal key={tile.tag} delay={Math.min(index * 45, 280)} distance={28}>
                <Box
                  component={RouterLink}
                  to={`/archive?tag=${encodeURIComponent(tile.tag)}`}
                  sx={{
                    minHeight: { xs: 260, md: 320 },
                    display: "flex",
                    alignItems: "flex-end",
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: { xs: 3.5, md: 4.5 },
                    textDecoration: "none",
                    color: "#F7F1E3",
                    backgroundColor: "#11100D",
                    backgroundImage: tile.imageUrl
                      ? `linear-gradient(180deg, rgba(10, 10, 9, 0.1) 0%, rgba(10, 10, 9, 0.18) 30%, rgba(10, 10, 9, 0.84) 100%), linear-gradient(120deg, rgba(10, 10, 9, 0.32) 0%, rgba(10, 10, 9, 0.08) 48%, rgba(10, 10, 9, 0.44) 100%), url(${tile.imageUrl})`
                      : "linear-gradient(135deg, rgba(184, 138, 42, 0.24), rgba(127, 138, 120, 0.16) 55%, rgba(15, 15, 12, 0.88))",
                    backgroundSize: "cover",
                    backgroundPosition: "center center",
                    border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                    transition:
                      "transform 420ms cubic-bezier(0.22, 1, 0.36, 1), border-color 240ms ease, box-shadow 320ms ease",
                    "&::before": tile.imageUrl
                      ? {
                          content: '""',
                          position: "absolute",
                          inset: 0,
                          backgroundImage: `url(${tile.imageUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center center",
                          transform: "scale(1.02)",
                          transition: "transform 900ms cubic-bezier(0.22, 1, 0.36, 1)",
                        }
                      : undefined,
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.14) 46%, transparent 66%)",
                      transform: "translateX(-120%)",
                      transition: "transform 900ms cubic-bezier(0.22, 1, 0.36, 1)",
                    },
                    "&:hover": {
                      transform: "translateY(-4px)",
                      borderColor: alpha(theme.palette.primary.main, 0.28),
                      boxShadow: `0 24px 60px ${alpha("#000000", 0.14)}`,
                    },
                    "&:hover::before": {
                      transform: "scale(1.08)",
                    },
                    "&:hover::after": {
                      transform: "translateX(120%)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      zIndex: 1,
                      width: "100%",
                      px: { xs: 2, md: 2.5 },
                      py: { xs: 2.25, md: 2.75 },
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.72rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.18em",
                        color: alpha("#F7F1E3", 0.78),
                        mb: 0.9,
                      }}
                    >
                      Collection
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        color: "#F7F1E3",
                        fontSize: { xs: "2rem", md: "2.55rem" },
                        maxWidth: 340,
                      }}
                    >
                      {tile.tag}
                    </Typography>
                  </Box>
                </Box>
              </MotionReveal>
            ))}
          </Box>
        )}
      </Container>
    </>
  );
}

export default Home;
