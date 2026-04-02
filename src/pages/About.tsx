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
import { Link as RouterLink } from "react-router-dom";
import { Header } from "../components/Header";

type LocationItem = {
  name: string;
  query: string;
};

type GearItem = {
  name: string;
  description: string;
};

function About() {
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
    { name: "Canon EF 24-55mm f/5.6", description: "Used when the landscape matters as much as the subject." },
    { name: "Falcam TreeRoot F38 Pro Carbon Fiber Tripod", description: "Support for longer waits and steadier observation." },
    { name: "K&F Concept Hardshell Camera Backpack", description: "Carry setup for moving between trails and preserves." },
    { name: "Peak Design Cuff Camera Wrist Strap", description: "Simple, practical, and always attached." },
  ];

  const mapsSearchUrl = (query: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  return (
    <>
      <Header />

      <Box
        sx={{
          minHeight: { xs: "82svh", md: "88svh" },
          display: "flex",
          alignItems: "flex-end",
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(180deg, rgba(10, 10, 8, 0.24) 0%, rgba(10, 10, 8, 0.72) 62%, rgba(10, 10, 8, 0.94) 100%), radial-gradient(circle at 82% 22%, rgba(184, 138, 42, 0.24), transparent 22%), radial-gradient(circle at 20% 72%, rgba(127, 138, 120, 0.16), transparent 30%), linear-gradient(135deg, #171713 0%, #0F0F0C 100%)",
        }}
      >
        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 5, lg: 7 }, pt: { xs: 16, md: 18 }, pb: { xs: 8, md: 10 } }}>
          <Box sx={{ maxWidth: { xs: "100%", md: 760 } }}>
            <Typography variant="subtitle1" sx={{ color: alpha("#F7F1E3", 0.74), mb: 2 }}>
              About Cameron
            </Typography>
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
            <Typography
              variant="body1"
              sx={{
                mt: 3,
                maxWidth: 560,
                color: alpha("#F7F1E3", 0.76),
                fontSize: { xs: "1rem", md: "1.08rem" },
              }}
            >
              I photograph wildlife across Central Ohio, usually by returning to the same trails, wetlands, and tree
              lines until the ordinary starts to reveal something unexpected.
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 5, lg: 7 }, py: { xs: 7, md: 10 } }}>
        <Box sx={{ maxWidth: 1040, mx: "auto" }}>
          <Box
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
                Wildlife photography became the way I learned to pay closer attention.
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 630, mb: 3 }}>
                I&apos;m Cameron Mirka, a Central Ohio-based photographer most at home outdoors. Birds are what pull me
                back out the door most often, but the real draw is the combination of behavior, light, weather, and
                place. The same trail can feel completely different from one morning to the next.
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 630 }}>
                What began as a slower way to spend time outside turned into a way of working. Photography gave me a
                reason to return, wait longer, and notice more. The archive on this site is built out of that habit.
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
                  Small shifts in posture, a pause before takeoff, fog lifting through the trees, or the brief
                  alignment between subject and place.
                </Typography>
              </Box>
              <Box>
                <PhotoCameraOutlinedIcon sx={{ color: "primary.main", mb: 1.25 }} />
                <Typography variant="h5" sx={{ mb: 1.25 }}>
                  How I work
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Usually on foot, often early, returning to familiar locations until timing and observation do more
                  than speed ever could.
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: { xs: 6, md: 8 }, borderColor: alpha("#B88A2A", 0.16) }} />

          <Box
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
                The places I return to most.
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 420 }}>
                These are the locations that shape the archive most often. Repetition matters. Returning to the same
                ground is how patterns start to emerge.
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
                    transition: "color 180ms ease, background-color 180ms ease",
                    "&:hover": {
                      color: "primary.main",
                    },
                  }}
                >
                  <LocationOnOutlinedIcon sx={{ color: "primary.main", fontSize: "1.1rem" }} />
                  <Typography variant="body1">{location.name}</Typography>
                  <NorthEastIcon sx={{ fontSize: "1rem" }} />
                </Box>
              ))}
            </Box>
          </Box>

          <Divider sx={{ my: { xs: 6, md: 8 }, borderColor: alpha("#B88A2A", 0.16) }} />

          <Box
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
                Most good frames come from waiting longer than expected.
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary", mb: 2.5 }}>
                Wildlife rarely offers the image you planned for. Most of the work is observation: learning where
                subjects settle, how they move through a space, and when the light begins to support the moment instead
                of flatten it.
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                I&apos;m interested in behavior as much as appearance. A frame becomes more memorable when it carries
                evidence of what the animal was doing, not just what it looked like.
              </Typography>
            </Box>

            <Box
              sx={{
                background: (theme) => `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.background.paper, 0.18)} 100%)`,
                border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                borderRadius: 5,
                p: { xs: 3, md: 4 },
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
          </Box>

          <Divider sx={{ my: { xs: 6, md: 8 }, borderColor: alpha("#B88A2A", 0.16) }} />

          <Box sx={{ maxWidth: 760 }}>
            <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 1.5 }}>
              Next
            </Typography>
            <Typography variant="h3" sx={{ fontSize: { xs: "clamp(2.1rem, 9vw, 3rem)", md: "clamp(3rem, 5vw, 3.9rem)" }, mb: 2 }}>
              The archive is still growing.
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 620 }}>
              New mornings, repeated routes, and small changes in season continue to reshape the work. The best way to
              understand it is still to spend time with the photographs themselves.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 4 }}>
              <Button component={RouterLink} to="/" variant="contained" color="primary" sx={{ color: "#0F0F0C", alignSelf: "flex-start" }}>
                View the Archive
              </Button>
              <Button component={RouterLink} to="/login" variant="text" color="inherit" sx={{ px: 0, alignSelf: "flex-start" }}>
                Private gallery access
              </Button>
            </Stack>
          </Box>
        </Box>
      </Container>
    </>
  );
}

export default About;
