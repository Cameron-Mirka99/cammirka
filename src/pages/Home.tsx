import { Box, Container, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

import { Header } from '../components/Header';
import { MainImageDisplay } from '../components/MainImageDisplay';
import { Photo } from '../types/photo';
import { photoApiBaseUrl } from '../utils/apiConfig';

function Home({ ...props }) {
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isLg = useMediaQuery(theme.breakpoints.up('lg'));
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  let columnsCount = 1;
  if (isLg) {
    columnsCount = 3;
  } else if (isMd || isSm) {
    columnsCount = 2;
  }

  const fetchPhotos = useCallback(async (excludeKeys: string[] = [], limit = 200) => {
    try {
      if (!photoApiBaseUrl) {
        throw new Error('REACT_APP_PHOTO_API_URL is not configured');
      }

      const res = await fetch(`${photoApiBaseUrl}/public-photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excludeKeys, limit }),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch photos: ${res.status}`);
      }

      const data = await res.json();
      const incoming: Array<Photo> = Array.isArray(data.photos) ? data.photos : [];

      setPhotos(prev => {
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

  useEffect(() => {
    fetchPhotos([], 200);
  }, [fetchPhotos]);

  return (
    <>
      <Header props={props}/>
      
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(255, 179, 0, 0.05) 0%, rgba(255, 107, 53, 0.05) 100%)',
          borderBottom: '1px solid rgba(255, 179, 0, 0.1)',
          py: { xs: 6, sm: 8, md: 10 },
          textAlign: 'center',
          px: { xs: 2, sm: 3, md: 4 },
          mt: { xs: 8, sm: 10, md: 12 },
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Container maxWidth="lg" sx={{ px: 0 }}>
          <Typography
            variant="h3"
            sx={{
              fontSize: { xs: 'clamp(1.5rem, 5vw, 2.5rem)', md: 'clamp(2rem, 6vw, 3rem)' },
              fontWeight: 700,
              letterSpacing: '-0.02em',
              mb: 2,
              color: '#FFB300',
              textShadow: '0 0 20px rgba(255, 179, 0, 0.3)',
            }}
          >
            Wildlife Through My Lens
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '0.95rem', md: '1.1rem' },
              color: 'rgba(255, 255, 255, 0.7)',
              maxWidth: '700px',
              mx: 'auto',
              lineHeight: 1.8,
              overflow: 'visible',
              wordWrap: 'break-word',
            }}
          >
            Explore my collection of photographs capturing the beauty and wonder of Ohio's wildlife and natural landscapes.
          </Typography>
        </Container>
      </Box>

      <MainImageDisplay
        photos={photos}
        columnsCount={columnsCount}
        loading={loading}
      />
    </>
  );
}

export default Home;
