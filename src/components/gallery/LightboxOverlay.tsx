import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import EastIcon from "@mui/icons-material/East";
import WestIcon from "@mui/icons-material/West";
import {
  Backdrop,
  Box,
  Button,
  Fade,
  IconButton,
  useMediaQuery,
  useTheme,
  Portal,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import React from "react";
import { Photo } from "../../types/photo";
import photoCache from "../../utils/photoCache";
import { photoApiBaseUrl } from "../../utils/apiConfig";
import { authFetch } from "../../utils/authFetch";

type LightboxOverlayProps = {
  photos: Array<Photo>;
  selectedIndex: number | null;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number | null>>;
  showDownload?: boolean;
};

export function LightboxOverlay({
  photos,
  selectedIndex,
  setSelectedIndex,
  showDownload = false,
}: LightboxOverlayProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [dragState, setDragState] = React.useState({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });
  const [swipeStart, setSwipeStart] = React.useState<{ x: number; y: number } | null>(null);
  const [downloading, setDownloading] = React.useState(false);
  const imageRef = React.useRef<HTMLImageElement | null>(null);
  const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null;

  const goToPrevious = React.useCallback(() => {
    setSelectedIndex((current) => (current === null ? current : (current - 1 + photos.length) % photos.length));
  }, [photos.length, setSelectedIndex]);

  const goToNext = React.useCallback(() => {
    setSelectedIndex((current) => (current === null ? current : (current + 1) % photos.length));
  }, [photos.length, setSelectedIndex]);

  const clampZoom = (value: number) => Math.min(4, Math.max(1, value));
  const clampPan = (value: number, axis: "x" | "y", currentZoom: number) => {
    if (currentZoom <= 1) return 0;

    const limit = axis === "x" ? 240 * (currentZoom - 1) : 180 * (currentZoom - 1);
    return Math.max(-limit, Math.min(limit, value));
  };

  React.useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedIndex(null);
      } else if (event.key === "ArrowRight") {
        goToNext();
      } else if (event.key === "ArrowLeft") {
        goToPrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrevious, selectedIndex, setSelectedIndex]);

  React.useEffect(() => {
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

  React.useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setDragState({
      active: false,
      moved: false,
      startX: 0,
      startY: 0,
      originX: 0,
      originY: 0,
    });
  }, [selectedIndex]);

  const handleZoomWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const nextZoom = clampZoom(zoom + (event.deltaY < 0 ? 0.18 : -0.18));
    setZoom(nextZoom);

    if (nextZoom === 1) {
      setPan({ x: 0, y: 0 });
      return;
    }

    setPan((current) => ({
      x: clampPan(current.x, "x", nextZoom),
      y: clampPan(current.y, "y", nextZoom),
    }));
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
      setDragState((current) => ({ ...current, moved: true }));
    }
  };

  const endDrag = () => {
    setDragState((current) => ({ ...current, active: false }));
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (zoom > 1 || event.touches.length !== 1) return;
    const touch = event.touches[0];
    setSwipeStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!swipeStart || zoom > 1) {
      setSwipeStart(null);
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - swipeStart.x;
    const deltaY = touch.clientY - swipeStart.y;

    if (Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        goToPrevious();
      } else {
        goToNext();
      }
    }

    setSwipeStart(null);
  };

  const handleDownload = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!selectedPhoto || downloading) return;

    setDownloading(true);
    try {
      if (!photoApiBaseUrl) {
        throw new Error("REACT_APP_PHOTO_API_URL is not configured");
      }

      const response = await authFetch(`${photoApiBaseUrl}/photo-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storageKey: selectedPhoto.storageKey ?? selectedPhoto.key,
        }),
      });
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      const payload = await response.json();
      if (typeof payload?.url !== "string" || !payload.url) {
        throw new Error("Download URL missing from response.");
      }

      const anchor = document.createElement("a");
      anchor.href = payload.url;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to download image:", error);
      window.open(selectedPhoto.url, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  };

  const handlePreviousClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    goToPrevious();
  };

  const handleNextClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    goToNext();
  };

  const handleCloseClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setSelectedIndex(null);
  };

  return (
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
              onClick={handleCloseClick}
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
                  onClick={handlePreviousClick}
                  sx={{
                    position: "absolute",
                    left: { xs: 10, md: 24 },
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#F7F1E3",
                    backgroundColor: alpha("#F7F1E3", 0.08),
                    display: { xs: "none", sm: "inline-flex" },
                  }}
                >
                  <WestIcon />
                </IconButton>
                <IconButton
                  aria-label="Next image"
                  onClick={handleNextClick}
                  sx={{
                    position: "absolute",
                    right: { xs: 10, md: 24 },
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#F7F1E3",
                    backgroundColor: alpha("#F7F1E3", 0.08),
                    display: { xs: "none", sm: "inline-flex" },
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
                      width: "100%",
                      height: "100%",
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
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (dragState.moved) return;
                      setZoom((current) => {
                        const nextZoom = current > 1 ? 1 : 2;
                        if (nextZoom === 1) {
                          setPan({ x: 0, y: 0 });
                        }
                        return nextZoom;
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
                    justifyContent: photos.length > 1 && isMobile ? "center" : "space-between",
                    gap: 2,
                    alignItems: "center",
                    px: { xs: 0.5, md: 0 },
                    flexDirection: { xs: "column", sm: "row" },
                    mx: "auto",
                  }}
                >
                  <Typography sx={{ color: alpha("#F7F1E3", 0.76), letterSpacing: "0.14em", textTransform: "uppercase", fontSize: "0.7rem" }}>
                    Frame {selectedIndex! + 1} of {photos.length}
                  </Typography>
                  {photos.length > 1 && isMobile && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                      }}
                    >
                      <IconButton
                        aria-label="Previous image"
                        onClick={handlePreviousClick}
                        sx={{
                          color: "#F7F1E3",
                          backgroundColor: alpha("#F7F1E3", 0.08),
                        }}
                      >
                        <WestIcon />
                      </IconButton>
                      <Typography sx={{ color: alpha("#F7F1E3", 0.68), fontSize: "0.76rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        Swipe or tap
                      </Typography>
                      <IconButton
                        aria-label="Next image"
                        onClick={handleNextClick}
                        sx={{
                          color: "#F7F1E3",
                          backgroundColor: alpha("#F7F1E3", 0.08),
                        }}
                      >
                        <EastIcon />
                      </IconButton>
                    </Box>
                  )}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.25,
                      flexWrap: "wrap",
                      justifyContent: { xs: "center", sm: "flex-end" },
                    }}
                  >
                    {showDownload && selectedPhoto && (
                      <Button
                        startIcon={<DownloadIcon />}
                        variant="outlined"
                        size="small"
                        onClick={handleDownload}
                        sx={{
                          color: "#F7F1E3",
                          borderColor: alpha("#F7F1E3", 0.24),
                          backgroundColor: alpha("#F7F1E3", 0.05),
                          "&:hover": {
                            borderColor: alpha("#F7F1E3", 0.4),
                            backgroundColor: alpha("#F7F1E3", 0.1),
                          },
                        }}
                      >
                        {downloading ? "Downloading..." : "Download full resolution"}
                      </Button>
                    )}
                    <Typography sx={{ color: alpha("#F7F1E3", 0.54), fontSize: "0.82rem" }}>
                      {isMobile ? "Swipe to move and tap the image to zoom" : "Use arrow keys to move and the scroll wheel to zoom"}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Fade>
      </Backdrop>
    </Portal>
  );
}
