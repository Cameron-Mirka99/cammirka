import React, { useState, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';

// Module-level flag to ensure the initial photos fetch runs only once per
// full page load. This prevents duplicate fetches caused by React StrictMode
// mounting/unmounting components in development.

import { Routes, Route } from 'react-router-dom';
import Home, { Photo } from './pages/Home';
import About from './pages/About';

let initialPhotosFetched = false;
function App() {
  // photos holds the list of fetched photos
  const [photos, setPhotos] = useState([] as Array<Photo>);
  const [loading, setLoading] = useState(true);

  // Fetch photos from the server. The server is expected to
  // accept a POST body with { excludeKeys: string[], limit: number }
  // and return { photos: Photo[] } containing up to `limit` new photos.
  const fetchPhotos = useCallback(async (excludeKeys: string[] = [], limit = 200) => {
    try {
      const res = await fetch('https://atp0hr8g95.execute-api.us-east-1.amazonaws.com/GetPhotoList', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excludeKeys, limit }),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch photos: ${res.status}`);
      }

      const data = await res.json();

  const incoming: Array<Photo> = Array.isArray(data.photos) ? data.photos : [];

      // Append incoming photos to state
      setPhotos(prev => {
        // Avoid duplicates by key
        const existingKeys = new Set(prev.map(p => p.key));
        const filtered = incoming.filter(p => !existingKeys.has(p.key));
        return [...prev, ...filtered];
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch photos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch: request first 200. Use a module-level guard so this only
  // runs once per full page load (prevents duplicate requests when React
  // StrictMode mounts/unmounts components during development).
  useEffect(() => {
    if (initialPhotosFetched) return;
    initialPhotosFetched = true;
    // Only run once on page load
    fetchPhotos([], 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #0A0E27 0%, #111A3F 50%, #0A0E27 100%)',
        minHeight: '100vh',
        position: 'relative',
      }}
    >
      {/* Animated background elements */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            right: '10%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 217, 255, 0.1) 0%, transparent 70%)',
            filter: 'blur(40px)',
            animation: 'float 20s ease-in-out infinite',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '10%',
            left: '10%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 107, 157, 0.1) 0%, transparent 70%)',
            filter: 'blur(40px)',
            animation: 'float 15s ease-in-out infinite',
            animationDelay: '5s',
          }}
        />
        <style>
          {`
            @keyframes float {
              0%, 100% {
                transform: translateY(0px);
              }
              50% {
                transform: translateY(30px);
              }
            }
          `}
        </style>
      </Box>

      {/* Content */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Routes>
          <Route path="/" element={<Home photos={photos} loading={loading} />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;
