import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import { Box, Container, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { MotionParallax, MotionReveal } from "../../utils/motion";

export function AboutPerspectiveBlock() {
  return (
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
  );
}
