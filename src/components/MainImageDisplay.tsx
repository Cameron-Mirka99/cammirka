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
  Portal,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";
import { Photo } from "../types/photo";
import photoCache from "../utils/photoCache";
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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [imageSurface, setImageSurface] = useState({ width: 0, height: 0 });
  const [dragState, setDragState] = useState<{
    active: boolean;
    moved: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  }>({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });
  const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null;
  const imageRef = React.useRef<HTMLImageElement | null>(null);

  const clampZoom = (value: number) => Math.min(4, Math.max(1, value));
  const clampPan = (value: number, axis: "x" | "y", currentZoom: number) => {
    if (currentZoom <= 1) return 0;

    const limit = axis === "x" ? 240 * (currentZoom - 1) : 180 * (currentZoom - 1);
    return Math.max(-limit, Math.min(limit, value));
  };

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

  useEffect(() => {
    if (selectedIndex === null) return undefined;

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousTouchAction = body.style.touchAction;

    body.style.overflow = "hidden";
    documentElement.style.overflow = "hidden";
    body.style.touchAction = "none";

    return () => {
      body.style.overflow = previousBodyOverflow;
      documentElement.style.overflow = previousHtmlOverflow;
      body.style.touchAction = previousTouchAction;
    };
  }, [selectedIndex]);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setImageSurface({ width: 0, height: 0 });
    setDragState({
      active: false,
      moved: false,
      startX: 0,
      startY: 0,
      originX: 0,
      originY: 0,
    });
  }, [selectedIndex]);

  useEffect(() => {
    const imageElement = imageRef.current;
    if (!imageElement) return undefined;

    const updateSurface = () => {
      setImageSurface({
        width: imageElement.clientWidth,
        height: imageElement.clientHeight,
      });
    };

    updateSurface();

    const resizeObserver = new ResizeObserver(() => updateSurface());
    resizeObserver.observe(imageElement);
    window.addEventListener("resize", updateSurface);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateSurface);
    };
  }, [selectedPhoto]);

  const handleZoomWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const delta = event.deltaY;
    const nextZoom = clampZoom(zoom + (delta < 0 ? 0.18 : -0.18));
    setZoom(nextZoom);
    if (nextZoom === 1) {
      setPan({ x: 0, y: 0 });
    } else {
      setPan((current) => ({
        x: clampPan(current.x, "x", nextZoom),
        y: clampPan(current.y, "y", nextZoom),
      }));
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (zoom <= 1) return;

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragState({
      active: true,
      moved: false,
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.x,
      originY: pan.y,
    });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.active || zoom <= 1) return;

    event.preventDefault();
    event.stopPropagation();
    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    const moved = Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4;

    setPan({
      x: clampPan(dragState.originX + deltaX, "x", zoom),
      y: clampPan(dragState.originY + deltaY, "y", zoom),
    });
    if (moved && !dragState.moved) {
      setDragState((current) => ({
        ...current,
        moved: true,
      }));
    }
  };

  const endDrag = () => {
    setDragState((current) => ({
      ...current,
      active: false,
    }));
  };

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

      <Portal>
        <Backdrop
          open={selectedIndex !== null}
          onClick={() => setSelectedIndex(null)}
          onContextMenu={(event) => event.preventDefault()}
          sx={{
            zIndex: (theme) => theme.zIndex.modal + 1,
            backgroundColor: "rgba(6, 6, 6, 0.92)",
            backdropFilter: "blur(10px)",
            overscrollBehavior: "contain",
          }}
        >
          <Fade in={selectedIndex !== null}>
            <Box
              sx={{
                width: "100vw",
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                px: { xs: 1.5, sm: 3, md: 6 },
                py: { xs: 7, md: 5 },
                overflow: "hidden",
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
              <Box
                sx={{
                  width: "100%",
                  maxWidth: "100%",
                  height: "100%",
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1.5,
                  mx: "auto",
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    maxWidth: "100vw",
                    height: "calc(100vh - 96px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                  onContextMenu={(event) => event.preventDefault()}
                >
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: imageSurface.width > 0 ? `${imageSurface.width}px` : "auto",
                      height: imageSurface.height > 0 ? `${imageSurface.height}px` : "auto",
                      maxWidth: "100%",
                      maxHeight: "100%",
                      cursor: zoom > 1 ? (dragState.active ? "grabbing" : "grab") : "zoom-in",
                    }}
                    onWheel={handleZoomWheel}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    onPointerLeave={endDrag}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (dragState.moved) return;
                      setZoom((current) => {
                        const next = current > 1 ? 1 : 2;
                        if (next === 1) {
                          setPan({ x: 0, y: 0 });
                        }
                        return next;
                      });
                    }}
                    onContextMenu={(event) => event.preventDefault()}
                  >
                    <Box
                      component="img"
                      ref={imageRef}
                      src={photoCache.get(selectedPhoto.url) || selectedPhoto.url}
                      alt=""
                      draggable={false}
                      onContextMenu={(event) => event.preventDefault()}
                      sx={{
                        display: "block",
                        width: "auto",
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                        borderRadius: 2,
                        mx: "auto",
                        transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                        transformOrigin: "center center",
                        transition: "transform 180ms ease-out",
                        willChange: "transform",
                        userSelect: "none",
                        pointerEvents: "none",
                      }}
                    />
                  </Box>
                </Box>
                <Box
                  sx={{
                    width: "100%",
                    maxWidth: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                    alignItems: "center",
                    px: { xs: 0.5, md: 0 },
                    mx: "auto",
                  }}
                >
                  <Typography sx={{ color: alpha("#F7F1E3", 0.76), letterSpacing: "0.14em", textTransform: "uppercase", fontSize: "0.7rem" }}>
                    Frame {selectedIndex! + 1} of {photos.length}
                  </Typography>
                  <Typography sx={{ color: alpha("#F7F1E3", 0.54), fontSize: "0.82rem" }}>
                    Use arrow keys to move and the scroll wheel to zoom
                  </Typography>
                </Box>
              </Box>
            )}
            </Box>
          </Fade>
        </Backdrop>
      </Portal>
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
    <MotionReveal delay={Math.min(index * 45, 360)} distance={26} sx={{ gridColumn: feature ? { xs: "auto", lg: "span 2" } : "auto" }}>
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
          "&:hover .archive-image": {
            transform: feature ? "scale(1.035)" : "scale(1.05)",
            filter: "saturate(1.08)",
          },
          "&:hover .archive-overlay": {
            opacity: 1,
          },
          "&:hover .archive-sheen": {
            transform: "translateX(120%)",
          },
          "&:hover .archive-icon": {
            transform: "translateX(4px)",
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
            transition: "transform 700ms cubic-bezier(0.22, 1, 0.36, 1), filter 320ms ease",
            backgroundColor: "rgba(255,255,255,0.04)",
            filter: "saturate(0.98)",
          }}
        />
        <Box
          className="archive-sheen"
          sx={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1), transparent 24%)",
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.16) 46%, transparent 64%)",
            transform: "translateX(-120%)",
            transition: "transform 900ms cubic-bezier(0.22, 1, 0.36, 1)",
            pointerEvents: "none",
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
            background: "linear-gradient(180deg, rgba(12, 12, 10, 0) 42%, rgba(12, 12, 10, 0.78) 100%)",
            color: "#F7F1E3",
            opacity: 0,
            transition: "opacity 260ms ease",
            "@media (hover: none)": {
              opacity: 1,
            },
          }}
          >
            <Typography sx={{ fontSize: "0.72rem", letterSpacing: "0.16em", textTransform: "uppercase" }}>
              Open frame
            </Typography>
          <EastIcon className="archive-icon" sx={{ fontSize: "1rem", transform: "translateX(0)", transition: "transform 260ms ease" }} />
        </Box>
      </Box>
    </MotionReveal>
  );
});
