import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import { FullscreenSection, MotionReveal, usePointerParallax } from "../../utils/motion";

type HomeHeroSectionProps = {
  heroPhoto: string | null;
};

export function HomeHeroSection({ heroPhoto }: HomeHeroSectionProps) {
  const heroParallax = usePointerParallax(16);

  return (
    <FullscreenSection sx={{ minHeight: { xs: "100svh", md: "100svh" } }}>
      <Box
        {...heroParallax.interactiveProps}
        style={heroParallax.style}
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
          perspective: "1600px",
          "&::before": heroPhoto
            ? {
                content: '""',
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${heroPhoto})`,
                backgroundSize: "cover",
                backgroundPosition: "center center",
                mixBlendMode: "soft-light",
                opacity: 0.18,
                animation: "appHeroPan 22s ease-in-out infinite",
                transformOrigin: "center center",
                transform: "translate3d(0, 0, 0) scale(1.04)",
              }
            : undefined,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 78% 24%, rgba(184, 138, 42, 0.26), transparent 20%), radial-gradient(circle at 18% 78%, rgba(127, 138, 120, 0.15), transparent 28%)",
            animation: "appGlowSweep 18s ease-in-out infinite",
            transform: "translate3d(calc((var(--motion-glow-x, 50%) - 50%) * 0.12), calc((var(--motion-glow-y, 50%) - 50%) * 0.12), 0)",
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
          <Box
            sx={{
              maxWidth: { xs: "100%", sm: 560, md: 680 },
              position: "relative",
              zIndex: 1,
              transform: "rotateX(calc(var(--motion-rotate-x, 0deg) * 0.45)) rotateY(calc(var(--motion-rotate-y, 0deg) * 0.55)) translate3d(0, 0, 0)",
              transformStyle: "preserve-3d",
              transition: "transform 220ms ease-out",
            }}
          >
            <MotionReveal delay={80}>
              <Typography variant="subtitle1" sx={{ color: alpha("#F7F1E3", 0.76), mb: 2 }}>
                Central Ohio Archive
              </Typography>
            </MotionReveal>
            <MotionReveal delay={160} distance={36}>
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
            </MotionReveal>
            <MotionReveal delay={240}>
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
            </MotionReveal>
            <MotionReveal delay={320}>
              <Typography
                variant="body1"
                sx={{
                  mt: 3,
                  maxWidth: 520,
                  color: alpha("#F7F1E3", 0.76),
                  fontSize: { xs: "1rem", md: "1.08rem" },
                }}
              >
                A collection of mornings, small encounters, and time spent outside around Central Ohio.
              </Typography>
            </MotionReveal>
            <MotionReveal delay={420}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 4 }}>
                <Button component={RouterLink} to="/archive" variant="contained" color="primary" sx={{ alignSelf: { xs: "stretch", sm: "flex-start" }, color: "#0F0F0C" }}>
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
            </MotionReveal>
          </Box>
        </Container>
      </Box>
    </FullscreenSection>
  );
}
