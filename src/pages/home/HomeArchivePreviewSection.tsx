import { Button, Container, Typography, useTheme } from "@mui/material";
import { Box } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { Photo } from "../../types/photo";
import { MainImageDisplay } from "../../components/MainImageDisplay";
import { MotionParallax, MotionReveal } from "../../utils/motion";

type HomeArchivePreviewSectionProps = {
  photos: Array<Photo>;
  loading: boolean;
};

export function HomeArchivePreviewSection({ photos, loading }: HomeArchivePreviewSectionProps) {
  const theme = useTheme();

  return (
    <Box id="archive" sx={{ pt: { xs: 7, md: 9 }, width: "100%" }}>
      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 5, lg: 7 } }}>
        <MotionParallax offset={72}>
          <MotionReveal sx={{ maxWidth: 620, mb: { xs: 4, md: 5 } }}>
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
              A few favorites from the public archive.
            </Typography>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mt: 1.5, maxWidth: 560 }}>
              This is a small selection. The full archive has the rest if you want to spend more time with it.
            </Typography>
          </MotionReveal>
        </MotionParallax>
      </Container>

      <MainImageDisplay photos={photos} loading={loading} variant="preview" />

      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 5, lg: 7 }, pb: { xs: 2, md: 4 } }}>
        <MotionReveal delay={60}>
          <Button component={RouterLink} to="/archive" variant="outlined">
            Open Full Archive
          </Button>
        </MotionReveal>
      </Container>
    </Box>
  );
}
