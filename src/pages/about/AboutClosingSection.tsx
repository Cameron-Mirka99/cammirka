import React from 'react';
import { Typography, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';

export function AboutClosingSection() {
  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 600,
          mb: 3,
          fontSize: '1.3rem',
        }}
      >
        Let's Connect
      </Typography>
      <Typography
        variant="body1"
        sx={{
          fontSize: '1rem',
          color: 'text.secondary',
          mb: 4,
          lineHeight: 1.9,
        }}
      >
        I'm always learning, experimenting, and growing as a photographer. Whether you're here to browse photos,
        connect over gear, or simply enjoy the beauty of Ohio's wildlife, I'm really glad you stopped by.
      </Typography>
      <Button
        component={Link}
        to="/"
        sx={{
          fontSize: { xs: '0.95rem', sm: '1rem' },
          padding: { xs: '10px 20px', sm: '12px 28px' },
          textTransform: 'uppercase',
          fontWeight: 600,
          letterSpacing: '0.6px',
          position: 'relative',
          border: 'none',
          background: 'rgba(255, 179, 0, 0.2)',
          color: 'text.primary',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          borderRadius: '6px',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '0',
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, rgba(255, 179, 0, 0.25) 0%, transparent 100%)',
            transition: 'left 0.3s ease',
          },
          '&:hover': {
            backgroundColor: 'rgba(255, 179, 0, 0.28)',
            boxShadow: '0 10px 28px rgba(255, 179, 0, 0.2)',
            transform: 'translateY(-2px)',
            '&::before': {
              left: '100%',
            },
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        }}
      >
        View Gallery
      </Button>
    </Box>
  );
}
