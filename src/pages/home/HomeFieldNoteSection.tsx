import { Button, Container, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import { MotionParallax, MotionReveal } from "../../utils/motion";

export function HomeFieldNoteSection() {
  const theme = useTheme();

  return (
    <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 5, lg: 7 }, py: { xs: 8, md: 11 }, width: "100%" }}>
      <MotionParallax offset={48}>
        <MotionReveal
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
            Most of these photos start the same way: standing around longer than expected and waiting for something
            small to happen.
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
        </MotionReveal>
      </MotionParallax>
    </Container>
  );
}
