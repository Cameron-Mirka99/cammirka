import React from 'react';
import { Typography, Box } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';

type LocationItem = {
  name: string;
  query: string;
};

type AboutLocationsSectionProps = {
  locations: LocationItem[];
  mapsSearchUrl: (query: string) => string;
};

export function AboutLocationsSection({ locations, mapsSearchUrl }: AboutLocationsSectionProps) {
  return (
    <Box sx={{ mb: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
        <LocationOnIcon sx={{ color: '#FF6B35', fontSize: '1.5rem' }} />
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: '#FF6B35',
          }}
        >
          Favorite Locations
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: 2,
        }}
      >
        {locations.map((location, idx) => (
          <Box
            key={idx}
            component="a"
            href={mapsSearchUrl(location.query)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Search ${location.name} on Google Maps`}
            sx={{
              textDecoration: 'none',
              background: 'rgba(255, 179, 0, 0.05)',
              border: '1px solid rgba(255, 179, 0, 0.2)',
              borderRadius: '8px',
              p: 2,
              display: 'block',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(255, 179, 0, 0.1)',
                borderColor: 'rgba(255, 179, 0, 0.4)',
              },
            }}
          >
            <Typography sx={{ color: '#FFB300', fontWeight: 500 }}>
              <LocationOnIcon sx={{ fontSize: '1.1rem', verticalAlign: 'text-bottom', mr: 0.5 }} />
              {location.name}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
