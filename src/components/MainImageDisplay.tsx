import { Box, Button, CircularProgress, Container, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { ArchiveTile } from "./gallery/ArchiveTile";
import { LightboxOverlay } from "./gallery/LightboxOverlay";
import { Photo } from "../types/photo";
import { MotionReveal } from "../utils/motion";

type MainImageDisplayProps = {
  photos: Array<Photo>;
  loading?: boolean;
  variant?: "preview" | "archive" | "private";
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
};

export const MainImageDisplay = ({
  photos,
  loading = false,
  variant = "archive",
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: MainImageDisplayProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const archiveStats = useMemo(() => {
    if (photos.length === 0) return "";
    return `${photos.length} frames`;
  }, [photos.length]);

  if (loading && photos.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "42vh",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress color="primary" />
        <Typography sx={{ color: "text.secondary", fontSize: "0.78rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Preparing archive
        </Typography>
      </Box>
    );
  }

  if (!loading && photos.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "30vh",
          flexDirection: "column",
          gap: 2,
          color: "text.secondary",
        }}
      >
        No photos found.
      </Box>
    );
  }

  return (
    <>
      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 5, lg: 7 }, pb: { xs: 4, md: 8 } }}>
        {variant !== "private" && (
          <MotionReveal sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "end", mb: 3.5, flexWrap: "wrap" }}>
            <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 520 }}>
              {variant === "preview"
                ? "A selected set of recent frames from the public archive."
                : "Browse the full public archive of wildlife encounters, repeated routes, and changing conditions."}
            </Typography>
            <Typography
              sx={{
                color: "primary.main",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                fontSize: "0.72rem",
                fontWeight: 700,
              }}
            >
              {archiveStats}
            </Typography>
          </MotionReveal>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: variant === "preview" ? "repeat(3, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))",
            },
            gap: { xs: 1.5, md: 2.25 },
          }}
        >
          {photos.map((photo, index) => (
            <ArchiveTile key={photo.key} photo={photo} index={index} variant={variant} onOpen={setSelectedIndex} />
          ))}
        </Box>

        {onLoadMore && (
          <Box sx={{ display: "flex", justifyContent: "center", pt: { xs: 4, md: 5 } }}>
            {hasMore ? (
              <Button variant="outlined" onClick={onLoadMore} disabled={loadingMore}>
                {loadingMore ? "Loading..." : "Load More"}
              </Button>
            ) : (
              <Typography sx={{ color: "text.secondary", fontSize: "0.78rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                End of archive
              </Typography>
            )}
          </Box>
        )}
      </Container>

      <LightboxOverlay photos={photos} selectedIndex={selectedIndex} setSelectedIndex={setSelectedIndex} />
    </>
  );
};
