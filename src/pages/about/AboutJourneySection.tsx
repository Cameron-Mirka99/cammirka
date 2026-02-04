import React from 'react';
import { Typography, Box } from '@mui/material';

export function AboutJourneySection() {
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, rgba(255, 179, 0, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)',
        border: '1px solid rgba(255, 179, 0, 0.1)',
        borderRadius: '12px',
        p: { xs: 3, md: 4 },
        mb: 6,
      }}
    >
      <Typography
        variant="h5"
        sx={{
          fontWeight: 600,
          mb: 2,
          color: '#FFB300',
        }}
      >
        My Journey
      </Typography>
      <Typography
        variant="body1"
        sx={{
          fontSize: '1rem',
          color: 'text.secondary',
          lineHeight: 1.9,
          mb: 2,
        }}
      >
        What began as a simple hobby, something that helped me slow down and reconnect with nature, has grown into
        something bigger. Photography became a creative outlet, a way to tell stories through images, and a way to
        share the wildlife that's all around us, even in our own backyards.
      </Typography>
      <Typography
        variant="body1"
        sx={{
          fontSize: '1rem',
          color: 'text.secondary',
          lineHeight: 1.9,
        }}
      >
        You'll usually find me on the Olentangy Trail or wandering Highbanks Metro Park, camera in hand, waiting for
        those moments when everything clicks - a hawk lifting off, a heron holding still, or a foggy morning settling
        over the woods.
      </Typography>
    </Box>
  );
}
