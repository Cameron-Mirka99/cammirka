import React from 'react';
import { Typography, Box } from '@mui/material';

export function AboutIntroductionSection() {
  return (
    <Box sx={{ mb: 6 }}>
      <Typography
        variant="h4"
        sx={{
          fontSize: { xs: '1.5rem', md: '2rem' },
          fontWeight: 700,
          mb: 3,
          color: '#FFB300',
        }}
      >
        Hey there!
      </Typography>
      <Typography
        variant="body1"
        sx={{
          fontSize: '1rem',
          mb: 3,
          color: 'text.secondary',
          lineHeight: 1.9,
        }}
      >
        I'm Cameron Mirka, a Central Ohio-based amateur photographer who's happiest outdoors. I'm especially drawn to
        wildlife, birds in particular, and I spend a lot of time watching them and photographing their beauty,
        behavior, and the places they live.
      </Typography>
    </Box>
  );
}
