import React from 'react';
import { Typography, Box } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';

type GearItem = {
  name: string;
  description: string;
};

type AboutGearSectionProps = {
  gearItems: GearItem[];
};

export function AboutGearSection({ gearItems }: AboutGearSectionProps) {
  return (
    <Box sx={{ mb: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
        <CameraAltIcon sx={{ color: '#FFB300', fontSize: '1.5rem' }} />
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: '#FFB300',
          }}
        >
          Current Gear
        </Typography>
      </Box>
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(255, 179, 0, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%)',
          border: '1px solid rgba(255, 179, 0, 0.2)',
          borderRadius: '8px',
          p: { xs: 2, md: 3 },
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 2,
          }}
        >
          {gearItems.map((gear, idx) => (
            <Box
              key={idx}
              sx={{
                background: 'rgba(255, 179, 0, 0.04)',
                border: '1px solid rgba(255, 179, 0, 0.18)',
                borderRadius: '8px',
                p: 2,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FFB300, #FF6B35)',
                  marginTop: '6px',
                  flexShrink: 0,
                }}
              />
              <Box>
                <Typography sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1rem', mb: 0.5 }}>
                  {gear.name}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.9rem',
                    color: 'text.secondary',
                  }}
                >
                  {gear.description}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
