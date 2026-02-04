import React from 'react';
import { Container, Box, Divider } from '@mui/material';
import { Header } from '../components/Header';
import { AboutHeroSection } from './about/AboutHeroSection';
import { AboutIntroductionSection } from './about/AboutIntroductionSection';
import { AboutJourneySection } from './about/AboutJourneySection';
import { AboutLocationsSection } from './about/AboutLocationsSection';
import { AboutGearSection } from './about/AboutGearSection';
import { AboutClosingSection } from './about/AboutClosingSection';

function About() {
  const locations = [
    { name: 'Olentangy Trail', query: 'Olentangy Trail, Columbus, OH' },
    { name: 'Highbanks Metro Park', query: 'Highbanks Metro Park, Lewis Center, OH' },
    { name: 'Char-Mar Ridge Park', query: 'Char-Mar Ridge Park, Lewis Center, OH' },
    { name: 'Hoover Nature Preserve', query: 'Hoover Nature Preserve, Galena, OH' },
    { name: 'Hogback Ridge Park', query: 'Hogback Ridge Park, Sunbury, OH' },
    { name: 'Alum Creek Below Dam Recreation Area', query: 'Alum Creek Below Dam Recreation Area, Galena, OH' },
  ];

  const mapsSearchUrl = (query: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  const gearItems = [
    { name: 'Canon R5 Mark II', description: 'Professional mirrorless camera' },
    { name: 'Canon RF 100-500mm F4.5-7.1 L IS USM', description: 'Telephoto for wildlife' },
    { name: 'Canon EF 24-55mm f/5.6', description: 'Versatile standard zoom' },
    { name: 'Lexar 1TB Professional CFexpress Type B', description: 'File Storage' },
    { name: 'Lexar Professional CFexpress Type B Gen 2 Reader', description: 'Card Reader' },
    { name: 'Canon Mount Adapter EF-EOS R', description: 'lens adapter for EF lenses' },
    { name: 'Falcam TreeRoot F38 Pro Carbon Fiber Tripod', description: 'Tripod' },
    { name: 'Leftfoto 70mm Camera Quick Release Plate', description: 'QR Tripod Camera Mount' },
    { name: 'K&F CONCEPT Camera Backpack,Hardshell ', description: 'Hardshell Camera Bag' },
    { name: 'Peak Design Cuff Camera Wrist Strap', description: 'Wrist Strap' },
    { name: 'ZEISS Pre-Moistened Alcohol Wipes', description: 'Lens Wipes' },
  ];

  return (
    <React.Fragment>
      <Header />
      <AboutHeroSection />

      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Box sx={{ maxWidth: '900px', mx: 'auto' }}>
          <AboutIntroductionSection />
          <AboutJourneySection />
          <AboutLocationsSection locations={locations} mapsSearchUrl={mapsSearchUrl} />

          <Divider sx={{ my: 6, borderColor: 'rgba(255, 179, 0, 0.1)' }} />

          <AboutGearSection gearItems={gearItems} />

          <Divider sx={{ my: 6, borderColor: 'rgba(255, 179, 0, 0.1)' }} />

          <AboutClosingSection />
        </Box>
      </Container>
    </React.Fragment>
  );
}

export default About;
