import { Box, Container, Divider, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { MotionParallax, MotionReveal } from "../../utils/motion";

type GearItem = {
  name: string;
  description: string;
};

type AboutFieldBlockProps = {
  gearItems: Array<GearItem>;
};

export function AboutFieldBlock({ gearItems }: AboutFieldBlockProps) {
  return (
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
                  background: "linear-gradient(120deg, transparent 0%, rgba(184, 138, 42, 0.08) 35%, transparent 65%)",
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
  );
}
