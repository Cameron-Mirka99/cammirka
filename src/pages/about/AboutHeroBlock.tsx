import { Box, Container, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { MotionReveal, usePointerParallax } from "../../utils/motion";

type AboutHeroBlockProps = {
  heroPhoto: string | null;
};

export function AboutHeroBlock({ heroPhoto }: AboutHeroBlockProps) {
  const heroParallax = usePointerParallax(14);

  return (
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
  );
}
