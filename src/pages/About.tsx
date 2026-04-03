import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import NorthEastIcon from "@mui/icons-material/NorthEast";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Box,
  Button,
  Container,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Header } from "../components/Header";
import { MotionParallax, MotionReveal, motionHoverLift, usePointerParallax } from "../utils/motion";
import { photoApiBaseUrl } from "../utils/apiConfig";
import { Photo } from "../types/photo";

type LocationItem = {
  name: string;
  query: string;
};

type GearItem = {
  name: string;
  description: string;
};

function About() {
  const heroParallax = usePointerParallax(14);
  const [heroPhoto, setHeroPhoto] = useState<string | null>(null);
  const locations: LocationItem[] = [
    { name: "Olentangy Trail", query: "Olentangy Trail, Columbus, OH" },
    { name: "Highbanks Metro Park", query: "Highbanks Metro Park, Lewis Center, OH" },
    { name: "Char-Mar Ridge Park", query: "Char-Mar Ridge Park, Lewis Center, OH" },
    { name: "Hoover Nature Preserve", query: "Hoover Nature Preserve, Galena, OH" },
    { name: "Hogback Ridge Park", query: "Hogback Ridge Park, Sunbury, OH" },
    { name: "Alum Creek Below Dam Recreation Area", query: "Alum Creek Below Dam Recreation Area, Galena, OH" },
  ];

  const gearItems: GearItem[] = [
    { name: "Canon R5 Mark II", description: "Primary body for speed, reach, and low-light flexibility." },
    { name: "Canon RF 100-500mm F4.5-7.1 L IS USM", description: "The lens I rely on most for wildlife work." },
    { name: "Canon RF 24-70mm F2.8 L is USM", description: "Used when the landscape matters as much as the subject." },
    { name: "Falcam TreeRoot F38 Pro Carbon Fiber Tripod", description: "Support for longer waits and steadier observation." },
    { name: "K&F Concept Hardshell Camera Backpack", description: "Carry setup for moving between trails and preserves." },
    { name: "Peak Design Cuff Camera Wrist Strap", description: "Simple, practical, and always attached." },
  ];

  const mapsSearchUrl = (query: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  useEffect(() => {
    let mounted = true;

    const loadHeroPhoto = async () => {
      try {
        if (!photoApiBaseUrl) return;

        const res = await fetch(`${photoApiBaseUrl}/public-photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ excludeKeys: [], limit: 6 }),
        });

        if (!res.ok) return;

        const data = await res.json();
        const photos: Array<Photo> = Array.isArray(data.photos) ? data.photos : [];
        const chosenPhoto = photos[1] ?? photos[0];

        if (mounted && chosenPhoto) {
          setHeroPhoto(chosenPhoto.url);
        }
      } catch {
        // Leave the fallback hero styling in place if the fetch fails.
      }
    };

    loadHeroPhoto();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <Header />

      <Box>
      <Box
        {...heroParallax.interactiveProps}
        style={heroParallax.style}
        sx={{
          minHeight: { xs: "72svh", md: "76svh" },
          display: "flex",
          alignItems: "flex-end",
          position: "relative",
          zIndex: 0,
          overflow: "hidden",
          perspective: "1600px",
          backgroundColor: "#0F0F0C",
          backgroundImage: heroPhoto
            ? `linear-gradient(180deg, rgba(10, 10, 8, 0.2) 0%, rgba(10, 10, 8, 0.56) 48%, rgba(10, 10, 8, 0.94) 100%), linear-gradient(90deg, rgba(10, 10, 8, 0.56) 0%, rgba(10, 10, 8, 0.12) 46%, rgba(10, 10, 8, 0.5) 100%), url(${heroPhoto})`
            : "linear-gradient(180deg, rgba(10, 10, 8, 0.24) 0%, rgba(10, 10, 8, 0.72) 62%, rgba(10, 10, 8, 0.94) 100%), linear-gradient(135deg, #171713 0%, #0F0F0C 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: "-8%",
            background:
              "radial-gradient(circle at 76% 24%, rgba(184, 138, 42, 0.18), transparent 18%), radial-gradient(circle at 24% 70%, rgba(127, 138, 120, 0.14), transparent 24%)",
            animation: "appGlowSweep 18s ease-in-out infinite",
          },
        }}
      >
        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 5, lg: 7 }, pt: { xs: 14, md: 15 }, pb: { xs: 7, md: 8 } }}>
          <Box
            sx={{
              maxWidth: { xs: "100%", md: 760 },
              transform: "rotateX(calc(var(--motion-rotate-x, 0deg) * 0.4)) rotateY(calc(var(--motion-rotate-y, 0deg) * 0.5))",
              transformStyle: "preserve-3d",
              transition: "transform 220ms ease-out",
            }}
          >
            <MotionReveal delay={80}>
              <Typography variant="subtitle1" sx={{ color: alpha("#F7F1E3", 0.74), mb: 2 }}>
                About Cameron
              </Typography>
            </MotionReveal>
            <MotionReveal delay={160} distance={34}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: "clamp(3rem, 13vw, 4.8rem)", md: "clamp(4.8rem, 9vw, 7rem)" },
                  color: "#F7F1E3",
                  maxWidth: 740,
                }}
              >
                Looking for the stillness before movement.
              </Typography>
            </MotionReveal>
            <MotionReveal delay={260}>
              <Typography
                variant="body1"
                sx={{
                  mt: 3,
                  maxWidth: 560,
                  color: alpha("#F7F1E3", 0.76),
                  fontSize: { xs: "1rem", md: "1.08rem" },
                }}
              >
                I photograph wildlife around Central Ohio, usually by going back to the same trails, wetlands, and tree
                lines until something familiar starts to feel new again.
              </Typography>
            </MotionReveal>
          </Box>
        </Container>
      </Box>

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          background: (theme) =>
            `linear-gradient(180deg, ${alpha(theme.palette.background.default, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.96)} 100%)`,
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 12% 18%, rgba(184, 138, 42, 0.12), transparent 24%), radial-gradient(circle at 88% 34%, rgba(127, 138, 120, 0.09), transparent 26%)",
            pointerEvents: "none",
          },
        }}
      >
      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 5, lg: 7 }, py: { xs: 7, md: 10 }, width: "100%" }}>
        <Box sx={{ maxWidth: 1040, mx: "auto" }}>
          <MotionParallax offset={44}>
            <MotionReveal
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" },
              gap: { xs: 5, md: 7 },
              alignItems: "start",
            }}
          >
            <Box>
              <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 1.5 }}>
                Perspective
              </Typography>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: "clamp(2.4rem, 10vw, 3.3rem)", md: "clamp(3.3rem, 6vw, 4.4rem)" },
                  mb: 3,
                  maxWidth: 620,
                }}
              >
                Wildlife photography became the thing that taught me how to slow down and notice more.
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 630, mb: 3 }}>
                I&apos;m Cameron Mirka, a Central Ohio photographer who feels most at home outside. Birds are usually
                what get me out the door, but what keeps me coming back is how different the same place can feel from
                one morning to the next.
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 630 }}>
                What started as a quieter way to spend time outdoors slowly turned into a way of seeing. Photography
                gave me a reason to come back, wait longer, and pay closer attention. This archive is really just the
                result of that habit.
              </Typography>
            </Box>

            <Box
              sx={{
                borderTop: (theme) => `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
                pt: 3,
                display: "grid",
                gap: 3,
              }}
            >
              <Box>
                <VisibilityOutlinedIcon sx={{ color: "primary.main", mb: 1.25 }} />
                <Typography variant="h5" sx={{ mb: 1.25 }}>
                  What I look for
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  A change in posture, a pause before takeoff, fog moving through the trees, or one brief moment where
                  the subject and the place line up just right.
                </Typography>
              </Box>
              <Box>
                <PhotoCameraOutlinedIcon sx={{ color: "primary.main", mb: 1.25 }} />
                <Typography variant="h5" sx={{ mb: 1.25 }}>
                  How I work
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Usually on foot, usually early, and usually back in places I already know, trusting patience a little
                  more than speed.
                </Typography>
              </Box>
            </Box>
            </MotionReveal>
          </MotionParallax>
        </Box>
      </Container>

      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 5, lg: 7 }, py: { xs: 7, md: 10 }, width: "100%" }}>
        <Box sx={{ maxWidth: 1040, mx: "auto", width: "100%" }}>
          <Divider sx={{ my: { xs: 6, md: 8 }, borderColor: alpha("#B88A2A", 0.16) }} />
          <MotionParallax offset={62}>
            <MotionReveal
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "0.78fr 1.22fr" },
              gap: { xs: 4, md: 6 },
              alignItems: "start",
            }}
          >
            <Box>
              <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 1.5 }}>
                Field Grounds
              </Typography>
              <Typography variant="h3" sx={{ fontSize: { xs: "clamp(2.1rem, 9vw, 3rem)", md: "clamp(3rem, 5vw, 3.9rem)" }, mb: 2 }}>
                The places I come back to most.
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 420 }}>
                These spots shape a lot of the work on this site. Going back again and again is how patterns start to
                show up.
              </Typography>
            </Box>

            <Box>
              {locations.map((location, index) => (
                <Box
                  key={location.name}
                  component="a"
                  href={mapsSearchUrl(location.query)}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: 2,
                    alignItems: "center",
                    py: 2.2,
                    textDecoration: "none",
                    borderTop: index === 0 ? (theme) => `1px solid ${alpha(theme.palette.text.primary, 0.1)}` : "none",
                    borderBottom: (theme) => `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
                    color: "text.primary",
                    ...motionHoverLift,
                    "&:hover": {
                      color: "primary.main",
                      transform: "translateX(6px)",
                    },
                  }}
                >
                  <LocationOnOutlinedIcon sx={{ color: "primary.main", fontSize: "1.1rem" }} />
                  <Typography variant="body1">{location.name}</Typography>
                  <NorthEastIcon sx={{ fontSize: "1rem" }} />
                </Box>
              ))}
                </Box>
              </MotionReveal>
          </MotionParallax>
        </Box>
      </Container>

      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 5, lg: 7 }, py: { xs: 7, md: 10 }, width: "100%" }}>
        <Box sx={{ maxWidth: 1040, mx: "auto", width: "100%" }}>
          <Divider sx={{ my: { xs: 6, md: 8 }, borderColor: alpha("#B88A2A", 0.16) }} />
          <MotionParallax offset={56}>
            <MotionReveal
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
              gap: { xs: 5, md: 7 },
            }}
          >
            <Box>
              <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 1.5 }}>
                In The Field
              </Typography>
              <Typography variant="h3" sx={{ fontSize: { xs: "clamp(2.1rem, 9vw, 3rem)", md: "clamp(3rem, 5vw, 3.9rem)" }, mb: 2 }}>
                Most of my favorite frames come from waiting longer than I planned to.
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary", mb: 2.5 }}>
                Wildlife almost never gives you the photo you imagined ahead of time. Most of the work is just paying
                attention: learning where something settles, how it moves through a space, and when the light finally
                starts helping.
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                I care as much about behavior as appearance. The photos I keep are usually the ones that say something
                about what the animal was doing, not just what it looked like.
              </Typography>
            </Box>

            <Box
              sx={{
                background: (theme) => `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.background.paper, 0.18)} 100%)`,
                border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                borderRadius: 5,
                p: { xs: 3, md: 4 },
                position: "relative",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(120deg, transparent 0%, rgba(184, 138, 42, 0.08) 35%, transparent 65%)",
                  animation: "appGlowSweep 16s ease-in-out infinite",
                  pointerEvents: "none",
                },
              }}
            >
              <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 2 }}>
                Essential Kit
              </Typography>
              <Stack spacing={2.25}>
                {gearItems.map((gear) => (
                  <Box key={gear.name}>
                    <Typography variant="h6" sx={{ fontFamily: "'Manrope', 'Segoe UI', sans-serif", mb: 0.5 }}>
                      {gear.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {gear.description}
                    </Typography>
                  </Box>
                ))}
              </Stack>
                </Box>
              </MotionReveal>
          </MotionParallax>
        </Box>
      </Container>

      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 5, lg: 7 }, py: { xs: 7, md: 10 }, width: "100%" }}>
        <Box sx={{ maxWidth: 1040, mx: "auto", width: "100%" }}>
          <Divider sx={{ my: { xs: 6, md: 8 }, borderColor: alpha("#B88A2A", 0.16) }} />
          <MotionReveal sx={{ maxWidth: 760 }}>
            <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 1.5 }}>
              Next
            </Typography>
            <Typography variant="h3" sx={{ fontSize: { xs: "clamp(2.1rem, 9vw, 3rem)", md: "clamp(3rem, 5vw, 3.9rem)" }, mb: 2 }}>
              The archive is still growing, a little at a time.
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 620 }}>
              New mornings, repeated routes, and small seasonal shifts keep changing the work. The best way to get a
              feel for it is still to spend some time with the photos themselves.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 4 }}>
              <Button component={RouterLink} to="/" variant="contained" color="primary" sx={{ color: "#0F0F0C", alignSelf: "flex-start" }}>
                View the Archive
              </Button>
              <Button component={RouterLink} to="/login" variant="text" color="inherit" sx={{ px: 0, alignSelf: "flex-start" }}>
                Private gallery access
              </Button>
            </Stack>
          </MotionReveal>
        </Box>
      </Container>
      </Box>
      </Box>
    </>
  );
}

export default About;
