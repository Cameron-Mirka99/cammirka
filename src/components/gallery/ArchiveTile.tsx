import EastIcon from "@mui/icons-material/East";
import { Box, Typography } from "@mui/material";
import React from "react";
import { Photo } from "../../types/photo";
import photoCache from "../../utils/photoCache";
import { MotionReveal } from "../../utils/motion";

type ArchiveTileProps = {
  photo: Photo;
  index: number;
  variant: "preview" | "archive" | "private";
  onOpen: (index: number) => void;
};

export const ArchiveTile = React.memo(function ArchiveTile({
  photo,
  index,
  variant,
  onOpen,
}: ArchiveTileProps) {
  const previewUrl = photo.thumbnailUrl ?? photo.url;
  const resolvedUrl = photoCache.get(previewUrl) || previewUrl;
  const feature = variant === "preview" && index === 0;

  return (
    <MotionReveal
      delay={Math.min(index * 45, 360)}
      distance={26}
      sx={{ gridColumn: feature ? { xs: "auto", lg: "span 2" } : "auto" }}
    >
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
        </Box>
      </Box>
    </MotionReveal>
  );
});
