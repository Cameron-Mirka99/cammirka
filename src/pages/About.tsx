import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { photoApiBaseUrl } from "../utils/apiConfig";
import { Photo } from "../types/photo";
import { AboutFieldBlock } from "./about/AboutFieldBlock";
import { AboutHeroBlock } from "./about/AboutHeroBlock";
import { AboutLocationsBlock } from "./about/AboutLocationsBlock";
import { AboutNextBlock } from "./about/AboutNextBlock";
import { AboutPerspectiveBlock } from "./about/AboutPerspectiveBlock";

function About() {
  const [heroPhoto, setHeroPhoto] = useState<string | null>(null);
  const locations = [
    { name: "Olentangy Trail", query: "Olentangy Trail, Columbus, OH" },
    { name: "Highbanks Metro Park", query: "Highbanks Metro Park, Lewis Center, OH" },
    { name: "Char-Mar Ridge Park", query: "Char-Mar Ridge Park, Lewis Center, OH" },
    { name: "Hoover Nature Preserve", query: "Hoover Nature Preserve, Galena, OH" },
    { name: "Hogback Ridge Park", query: "Hogback Ridge Park, Sunbury, OH" },
    { name: "Alum Creek Below Dam Recreation Area", query: "Alum Creek Below Dam Recreation Area, Galena, OH" },
  ];

  const gearItems = [
    { name: "Canon R5 Mark II", description: "Primary body for speed, reach, and low-light flexibility." },
    { name: "Canon RF 100-500mm F4.5-7.1 L IS USM", description: "The lens I rely on most for wildlife work." },
    { name: "Canon RF 24-70mm F2.8 L is USM", description: "Used when the landscape matters as much as the subject." },
    { name: "Falcam TreeRoot F38 Pro Carbon Fiber Tripod", description: "Support for longer waits and steadier observation." },
    { name: "K&F Concept Hardshell Camera Backpack", description: "Carry setup for moving between trails and preserves." },
    { name: "Peak Design Cuff Camera Wrist Strap", description: "Simple, practical, and always attached." },
  ];

  const mapsSearchUrl = (query: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  useEffect(() => {
    let mounted = true;

    const loadHeroPhoto = async () => {
      try {
        if (!photoApiBaseUrl) return;

        const res = await fetch(`${photoApiBaseUrl}/public-photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ excludeKeys: [], limit: 6 }),
        });

        if (!res.ok) return;

        const data = await res.json();
        const photos: Array<Photo> = Array.isArray(data.photos) ? data.photos : [];
        const chosenPhoto = photos[1] ?? photos[0];

        if (mounted && chosenPhoto) {
          setHeroPhoto(chosenPhoto.url);
        }
      } catch {
        // Leave the fallback hero styling in place if the fetch fails.
      }
    };

    loadHeroPhoto();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <Header />

      <Box>
        <AboutHeroBlock heroPhoto={heroPhoto} />

        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            overflow: "hidden",
            isolation: "isolate",
            background: (theme) =>
              `linear-gradient(180deg, ${theme.palette.mode === "light" ? "rgba(24, 22, 18, 0.84)" : "rgba(15, 15, 12, 0.82)"} 0%, ${theme.palette.mode === "light" ? "rgba(29, 27, 22, 0.9)" : "rgba(18, 18, 15, 0.9)"} 36%, ${theme.palette.mode === "light" ? "rgba(18, 17, 14, 0.96)" : "rgba(12, 12, 10, 0.96)"} 100%)`,
            backdropFilter: "blur(12px)",
            "& > *": {
              position: "relative",
              zIndex: 1,
            },
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 14% 16%, rgba(184, 138, 42, 0.18), transparent 24%), radial-gradient(circle at 82% 28%, rgba(127, 138, 120, 0.14), transparent 28%), radial-gradient(circle at 68% 78%, rgba(184, 138, 42, 0.1), transparent 20%)",
              pointerEvents: "none",
              zIndex: 0,
            },
            "&::after": {
              content: '""',
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(247, 241, 227, 0.03) 0%, rgba(15, 15, 12, 0) 24%, rgba(15, 15, 12, 0.14) 100%)",
              pointerEvents: "none",
              zIndex: 0,
            },
          }}
        >
          <AboutPerspectiveBlock />
          <AboutLocationsBlock locations={locations} mapsSearchUrl={mapsSearchUrl} />
          <AboutFieldBlock gearItems={gearItems} />
          <AboutNextBlock />
        </Box>
      </Box>
    </>
  );
}

export default About;
