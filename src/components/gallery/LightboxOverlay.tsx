import CloseIcon from "@mui/icons-material/Close";
import EastIcon from "@mui/icons-material/East";
import WestIcon from "@mui/icons-material/West";
import {
  Backdrop,
  Box,
  Fade,
  IconButton,
  Portal,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import React from "react";
import { Photo } from "../../types/photo";
import photoCache from "../../utils/photoCache";

type LightboxOverlayProps = {
  photos: Array<Photo>;
  selectedIndex: number | null;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number | null>>;
};

export function LightboxOverlay({
  photos,
  selectedIndex,
  setSelectedIndex,
}: LightboxOverlayProps) {
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [imageSurface, setImageSurface] = React.useState({ width: 0, height: 0 });
  const [dragState, setDragState] = React.useState({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });
  const imageRef = React.useRef<HTMLImageElement | null>(null);
  const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null;

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
  }, [photos.length, selectedIndex, setSelectedIndex]);

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

  React.useEffect(() => {
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
  );
}
