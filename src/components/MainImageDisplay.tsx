import CloseIcon from "@mui/icons-material/Close";
import EastIcon from "@mui/icons-material/East";
import WestIcon from "@mui/icons-material/West";
import React from "react";
import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Container,
  Fade,
  IconButton,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";
import { Photo } from "../types/photo";
import photoCache from "../utils/photoCache";

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
  const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null;

  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedIndex(null);
      } else if (event.key === "ArrowRight") {
        setSelectedIndex((current) => {
          if (current === null) return current;
          return (current + 1) % photos.length;
        });
      } else if (event.key === "ArrowLeft") {
        setSelectedIndex((current) => {
          if (current === null) return current;
          return (current - 1 + photos.length) % photos.length;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, photos.length]);

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
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "end", mb: 3.5, flexWrap: "wrap" }}>
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
          </Box>
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

      <Backdrop
        open={selectedIndex !== null}
        onClick={() => setSelectedIndex(null)}
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 1,
          backgroundColor: "rgba(6, 6, 6, 0.92)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Fade in={selectedIndex !== null}>
          <Box
            onClick={(event) => event.stopPropagation()}
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              px: { xs: 1.5, sm: 3, md: 6 },
              py: { xs: 7, md: 5 },
            }}
          >
            <IconButton
              aria-label="Close image"
              onClick={() => setSelectedIndex(null)}
              sx={{
                position: "absolute",
                top: { xs: 12, md: 24 },
                right: { xs: 12, md: 24 },
                color: "#F7F1E3",
                backgroundColor: alpha("#F7F1E3", 0.08),
              }}
            >
              <CloseIcon />
            </IconButton>

            {photos.length > 1 && (
              <>
                <IconButton
                  aria-label="Previous image"
                  onClick={() => setSelectedIndex((current) => (current === null ? current : (current - 1 + photos.length) % photos.length))}
                  sx={{
                    position: "absolute",
                    left: { xs: 10, md: 24 },
                    color: "#F7F1E3",
                    backgroundColor: alpha("#F7F1E3", 0.08),
                  }}
                >
                  <WestIcon />
                </IconButton>
                <IconButton
                  aria-label="Next image"
                  onClick={() => setSelectedIndex((current) => (current === null ? current : (current + 1) % photos.length))}
                  sx={{
                    position: "absolute",
                    right: { xs: 10, md: 24 },
                    color: "#F7F1E3",
                    backgroundColor: alpha("#F7F1E3", 0.08),
                  }}
                >
                  <EastIcon />
                </IconButton>
              </>
            )}

            {selectedPhoto && (
              <Box sx={{ width: "100%", maxWidth: "min(1400px, 100%)", maxHeight: "100%", display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box
                  component="img"
                  src={photoCache.get(selectedPhoto.url) || selectedPhoto.url}
                  alt=""
                  sx={{
                    display: "block",
                    width: "100%",
                    maxHeight: "calc(100vh - 120px)",
                    objectFit: "contain",
                    borderRadius: 2,
                  }}
                />
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center", px: { xs: 0.5, md: 0 } }}>
                  <Typography sx={{ color: alpha("#F7F1E3", 0.76), letterSpacing: "0.14em", textTransform: "uppercase", fontSize: "0.7rem" }}>
                    Frame {selectedIndex! + 1} of {photos.length}
                  </Typography>
                  <Typography sx={{ color: alpha("#F7F1E3", 0.54), fontSize: "0.82rem" }}>
                    Use arrow keys to move through the archive
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Fade>
      </Backdrop>
    </>
  );
};

const ArchiveTile = React.memo(function ArchiveTile({
  photo,
  index,
  variant,
  onOpen,
}: {
  photo: Photo;
  index: number;
  variant: "preview" | "archive" | "private";
  onOpen: (index: number) => void;
}) {
  const previewUrl = photo.thumbnailUrl ?? photo.url;
  const resolvedUrl = photoCache.get(previewUrl) || previewUrl;
  const feature = variant === "preview" && index === 0;

  return (
    <Box
      component="button"
      type="button"
      onClick={() => onOpen(index)}
      sx={{
        width: "100%",
        display: "block",
        position: "relative",
        p: 0,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        textAlign: "left",
        borderRadius: { xs: 3, md: 4 },
        overflow: "hidden",
        minHeight: 0,
        gridColumn: feature ? { xs: "auto", lg: "span 2" } : "auto",
        "&:hover .archive-image": {
          transform: "scale(1.02)",
        },
        "&:hover .archive-overlay": {
          opacity: 1,
        },
      }}
    >
      <Box
        component="img"
        src={resolvedUrl}
        alt=""
        loading="lazy"
        className="archive-image"
        sx={{
          display: "block",
          width: "100%",
          aspectRatio: feature ? { xs: "4 / 5", lg: "16 / 10" } : variant === "private" ? "4 / 3" : "4 / 5",
          objectFit: "cover",
          borderRadius: { xs: 3, md: 4 },
          transition: "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
          backgroundColor: "rgba(255,255,255,0.04)",
        }}
      />
      <Box
        className="archive-overlay"
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          px: 2,
          py: 1.75,
          borderRadius: { xs: 3, md: 4 },
          background: "linear-gradient(180deg, rgba(12, 12, 10, 0) 42%, rgba(12, 12, 10, 0.72) 100%)",
          color: "#F7F1E3",
          opacity: 0,
          transition: "opacity 220ms ease",
          "@media (hover: none)": {
            opacity: 1,
          },
        }}
      >
        <Typography sx={{ fontSize: "0.72rem", letterSpacing: "0.16em", textTransform: "uppercase" }}>
          Open frame
        </Typography>
        <EastIcon sx={{ fontSize: "1rem" }} />
      </Box>
    </Box>
  );
});
