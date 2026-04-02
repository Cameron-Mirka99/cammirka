import { Box, Button, Container, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import { Header } from "../components/Header";
import { MainImageDisplay } from "../components/MainImageDisplay";
import { Photo } from "../types/photo";
import { photoApiBaseUrl } from "../utils/apiConfig";

function Home() {
  const theme = useTheme();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const heroPhoto = useMemo(
    () => photos[0]?.thumbnailUrl ?? photos[0]?.url ?? null,
    [photos],
  );
  const previewPhotos = useMemo(() => photos.slice(0, 12), [photos]);

  const fetchPhotos = useCallback(async (excludeKeys: string[] = [], limit = 24) => {
    try {
      if (!photoApiBaseUrl) {
        throw new Error("REACT_APP_PHOTO_API_URL is not configured");
      }

      const res = await fetch(`${photoApiBaseUrl}/public-photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excludeKeys, limit }),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch photos: ${res.status}`);
      }

      const data = await res.json();
      const incoming: Array<Photo> = Array.isArray(data.photos) ? data.photos : [];

      setPhotos((prev) => {
        const existingKeys = new Set(prev.map((p) => p.key));
        const filtered = incoming.filter((p) => !existingKeys.has(p.key));
        return [...prev, ...filtered];
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to fetch photos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotos([], 24);
  }, [fetchPhotos]);

  return (
    <>
      <Header />

      <Box
        sx={{
          mt: { xs: "-88px", md: "-96px" },
          minHeight: { xs: "100svh", md: "96svh" },
          display: "flex",
          alignItems: "flex-end",
          position: "relative",
          zIndex: 1,
          overflow: "hidden",
          backgroundColor: "#0F0F0C",
          backgroundImage: heroPhoto
            ? `linear-gradient(180deg, rgba(8, 8, 7, 0.22) 0%, rgba(8, 8, 7, 0.42) 36%, rgba(8, 8, 7, 0.88) 100%), linear-gradient(90deg, rgba(8, 8, 7, 0.72) 0%, rgba(8, 8, 7, 0.18) 48%, rgba(8, 8, 7, 0.5) 100%), url(${heroPhoto})`
            : "linear-gradient(180deg, rgba(13, 13, 10, 0.7) 0%, rgba(13, 13, 10, 0.92) 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center center",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 78% 24%, rgba(184, 138, 42, 0.26), transparent 20%), radial-gradient(circle at 18% 78%, rgba(127, 138, 120, 0.15), transparent 28%)",
          }}
        />
        <Container
          maxWidth={false}
          sx={{
            position: "relative",
            px: { xs: 2, sm: 3, md: 5, lg: 7 },
            pb: { xs: 9, sm: 10, md: 12 },
            pt: { xs: 14, md: 16 },
          }}
        >
          <Box sx={{ maxWidth: { xs: "100%", sm: 560, md: 680 } }}>
            <Typography
              variant="subtitle1"
              sx={{
                color: alpha("#F7F1E3", 0.76),
                mb: 2,
              }}
            >
              Central Ohio Archive
            </Typography>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "clamp(3.4rem, 15vw, 5.2rem)", md: "clamp(5.2rem, 11vw, 8.4rem)" },
                color: "#F7F1E3",
              }}
            >
              Cameron
              <Box component="span" sx={{ display: "block" }}>
                Mirka
              </Box>
            </Typography>
            <Typography
              sx={{
                mt: 2,
                fontSize: { xs: "0.95rem", sm: "1rem", md: "1.05rem" },
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: alpha("#F7F1E3", 0.84),
              }}
            >
              Wildlife Photography
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mt: 3,
                maxWidth: 520,
                color: alpha("#F7F1E3", 0.76),
                fontSize: { xs: "1rem", md: "1.08rem" },
              }}
            >
              Field notes in light, motion, and quiet from Central Ohio.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 4 }}>
              <Button
                component={RouterLink}
                to="/archive"
                variant="contained"
                color="primary"
                sx={{
                  alignSelf: { xs: "stretch", sm: "flex-start" },
                  color: "#0F0F0C",
                }}
              >
                Enter Archive
              </Button>
              <Button
                component={RouterLink}
                to="/about"
                variant="outlined"
                sx={{
                  alignSelf: { xs: "stretch", sm: "flex-start" },
                  color: "#F7F1E3",
                  borderColor: alpha("#F7F1E3", 0.26),
                  "&:hover": {
                    borderColor: alpha("#F7F1E3", 0.42),
                    backgroundColor: alpha("#F7F1E3", 0.06),
                    color: "#F7F1E3",
                  },
                }}
              >
                About Cameron
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      <Box
        sx={{
          borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
          borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
          backgroundColor: alpha(theme.palette.background.paper, 0.92),
        }}
      >
        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 5, lg: 7 }, py: { xs: 3, md: 4 } }}>
          <Typography
            variant="body1"
            sx={{
              maxWidth: 880,
              color: theme.palette.text.primary,
              fontSize: { xs: "1rem", md: "1.18rem" },
            }}
          >
            An evolving archive of birds, wetlands, forests, and the fleeting moments that most people walk past.
          </Typography>
        </Container>
      </Box>

      <Box id="archive" sx={{ pt: { xs: 7, md: 9 } }}>
        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 5, lg: 7 } }}>
          <Box sx={{ maxWidth: 620, mb: { xs: 4, md: 5 } }}>
            <Typography variant="subtitle1" sx={{ color: theme.palette.primary.main, mb: 1.5 }}>
              Selected Archive
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: "clamp(2.5rem, 11vw, 3.6rem)", md: "clamp(3.6rem, 7vw, 5rem)" },
                color: theme.palette.text.primary,
              }}
            >
              A fast first look into the public archive.
            </Typography>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mt: 1.5, maxWidth: 560 }}>
              The homepage stays focused and responsive. The full archive lives on its own page for deeper browsing.
            </Typography>
          </Box>
        </Container>
        <MainImageDisplay photos={previewPhotos} loading={loading} variant="preview" />
        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 5, lg: 7 }, pb: { xs: 2, md: 4 } }}>
          <Button component={RouterLink} to="/archive" variant="outlined">
            Open Full Archive
          </Button>
        </Container>
      </Box>

      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 5, lg: 7 }, py: { xs: 8, md: 11 } }}>
        <Box
          sx={{
            borderTop: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
            pt: { xs: 4, md: 5 },
            maxWidth: 760,
          }}
        >
          <Typography variant="subtitle1" sx={{ color: theme.palette.primary.main, mb: 1.5 }}>
            Field Note
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: { xs: "1rem", md: "1.1rem" },
            }}
          >
            Most of this work begins the same way: standing still, waiting longer than expected, and paying attention
            to movement before it happens.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 4 }}>
            <Button component={RouterLink} to="/about" variant="text" color="primary" sx={{ px: 0, alignSelf: "flex-start" }}>
              Read the story
            </Button>
            <Button component={RouterLink} to="/archive" variant="text" color="inherit" sx={{ px: 0, alignSelf: "flex-start" }}>
              Browse full archive
            </Button>
            <Button component={RouterLink} to="/login" variant="text" color="inherit" sx={{ px: 0, alignSelf: "flex-start" }}>
              Private gallery access
            </Button>
          </Stack>
        </Box>
      </Container>
    </>
  );
}

export default Home;
