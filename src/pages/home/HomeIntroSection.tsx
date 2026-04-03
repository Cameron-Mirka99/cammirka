import { Box, Container, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { MotionReveal } from "../../utils/motion";

export function HomeIntroSection() {
  const theme = useTheme();

  return (
    <MotionReveal delay={40} sx={{ width: "100%" }}>
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
            Birds, wetlands, woods, and the kinds of moments that are easy to miss if you are not standing still for them.
          </Typography>
        </Container>
      </Box>
    </MotionReveal>
  );
}
