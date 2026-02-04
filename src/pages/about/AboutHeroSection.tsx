import React from 'react';
import { Container, Typography, Box } from '@mui/material';

export function AboutHeroSection() {
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, rgba(255, 179, 0, 0.05) 0%, rgba(255, 107, 53, 0.05) 100%)',
        borderBottom: '1px solid rgba(255, 179, 0, 0.1)',
        py: { xs: 6, sm: 8, md: 10 },
        position: 'relative',
        zIndex: 1,
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h2"
          sx={{
            fontSize: { xs: 'clamp(2rem, 5vw, 3rem)', md: 'clamp(2.5rem, 6vw, 3.5rem)' },
            fontWeight: 700,
            letterSpacing: '-0.02em',
            mb: 3,
            color: '#FFB300',
          }}
        >
          About Me
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontSize: '1.1rem',
            color: 'text.secondary',
            lineHeight: 2,
            maxWidth: '700px',
          }}
        >
          Amateur photographer passionate about capturing the natural world and wildlife of Central Ohio.
        </Typography>
      </Container>
    </Box>
  );
}
