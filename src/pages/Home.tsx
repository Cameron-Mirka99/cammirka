import { Box } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Photo } from "../types/photo";
import { photoApiBaseUrl } from "../utils/apiConfig";
import { Header } from "../components/Header";
import { HomeArchivePreviewSection } from "./home/HomeArchivePreviewSection";
import { HomeFieldNoteSection } from "./home/HomeFieldNoteSection";
import { HomeHeroSection } from "./home/HomeHeroSection";
import { HomeIntroSection } from "./home/HomeIntroSection";

function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const heroPhoto = useMemo(
    () => photos[0]?.thumbnailUrl ?? photos[0]?.url ?? null,
    [photos],
  );
  const previewPhotos = useMemo(() => photos.slice(0, 12), [photos]);

  const fetchPhotos = useCallback(async (excludeKeys: string[] = [], limit = 24) => {
    try {
      if (!photoApiBaseUrl) {
        throw new Error("REACT_APP_PHOTO_API_URL is not configured");
      }

      const res = await fetch(`${photoApiBaseUrl}/public-photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excludeKeys, limit }),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch photos: ${res.status}`);
      }

      const data = await res.json();
      const incoming: Array<Photo> = Array.isArray(data.photos) ? data.photos : [];

      setPhotos((prev) => {
        const existingKeys = new Set(prev.map((p) => p.key));
        const filtered = incoming.filter((p) => !existingKeys.has(p.key));
        return [...prev, ...filtered];
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to fetch photos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotos([], 24);
  }, [fetchPhotos]);

  return (
    <>
      <Header />

      <Box>
        <HomeHeroSection heroPhoto={heroPhoto} />
        <HomeIntroSection />
        <HomeArchivePreviewSection photos={previewPhotos} loading={loading} />
        <HomeFieldNoteSection />
      </Box>
    </>
  );
}

export default Home;
