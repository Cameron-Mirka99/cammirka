import React from 'react';
import { Container, Typography, Box, Button, Divider } from '@mui/material';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import LocationOnIcon from '@mui/icons-material/LocationOn';

function About() {
  return (
    <React.Fragment>
      <Header />
      
      {/* Hero Section */}
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

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Box sx={{ maxWidth: '900px', mx: 'auto' }}>
          {/* Introduction */}
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
              My name is Cameron Mirka, and I'm an amateur photographer based in Central Ohio with a deep love for capturing the natural world—especially wildlife. Birds have a special place in my heart, and much of my photography is centered around observing and documenting their beauty, behavior, and the environments they call home.
            </Typography>
          </Box>

          {/* Journey Section */}
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
              📷 My Journey
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
              My journey with photography started as a simple hobby, a way to slow down and reconnect with nature. Over time, it became something more—a creative outlet, a way to tell stories through images, and a way to share the incredible wildlife that surrounds us, even in our own backyards.
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1rem',
                color: 'text.secondary',
                lineHeight: 1.9,
              }}
            >
              You'll often find me out on the Olentangy Trail or roaming the paths of Highbanks Metro Park, camera in hand, patiently waiting for that one perfect moment when everything lines up just right—a soaring hawk, a perched heron, or the quiet stillness of a foggy morning in the woods.
            </Typography>
          </Box>

          {/* Locations Section */}
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
              {['Olentangy Trail', 'Highbanks Metro Park', 'Central Ohio', 'Wildlife Habitats'].map((location, idx) => (
                <Box
                  key={idx}
                  sx={{
                    background: 'rgba(255, 179, 0, 0.05)',
                    border: '1px solid rgba(255, 179, 0, 0.2)',
                    borderRadius: '8px',
                    p: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'rgba(255, 179, 0, 0.1)',
                      borderColor: 'rgba(255, 179, 0, 0.4)',
                    },
                  }}
                >
                  <Typography sx={{ color: '#FFB300', fontWeight: 500 }}>📍 {location}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Divider sx={{ my: 6, borderColor: 'rgba(255, 179, 0, 0.1)' }} />

          {/* Gear Section */}
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
              {[
                { name: 'Canon R5 Mark II', description: 'Professional mirrorless camera' },
                { name: 'Canon EF 24–55mm f/5.6', description: 'Versatile standard zoom' },
                { name: 'Canon RF 100-500mm F4.5-7.1 L IS USM', description: 'Telephoto for wildlife' },
              ].map((gear, idx) => (
                <React.Fragment key={idx}>
                  <Box sx={{ py: 2, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
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
                  {idx < 2 && <Divider sx={{ my: 1, borderColor: 'rgba(255, 179, 0, 0.1)' }} />}
                </React.Fragment>
              ))}
            </Box>
          </Box>

          <Divider sx={{ my: 6, borderColor: 'rgba(255, 179, 0, 0.1)' }} />

          {/* Closing Section */}
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
              I'm always learning, experimenting, and growing as a photographer. Whether you're here to browse photos, connect over gear, or simply enjoy the beauty of Ohio's wildlife, I'm really glad you stopped by.
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
        </Box>
      </Container>
    </React.Fragment>
  );
}

export default About;
