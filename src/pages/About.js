import React from 'react';
import { Container, Typography, Box, AppBar, Toolbar, Button } from '@mui/material';
import { Link } from 'react-router-dom';

function About() {
  return (
    <React.Fragment>
      <AppBar position="static">
        <Toolbar>
          <Button color="inherit" component={Link} to="/">
            Home
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ marginTop: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          About Cameron Mirka
        </Typography>
        <Typography variant="body1" paragraph>
          Cameron Mirka is a passionate photographer with a deep connection to nature.
          His work captures the raw beauty and spirit of the natural world, with a
          particular focus on earthy landscapes and forest scenes. Inspired by the
          tranquility and mystery of fir forests, his photography invites viewers to
          step into a world where nature reigns supreme.
        </Typography>
        <Typography variant="body1" paragraph>
          With years of experience behind the lens, Cameron continues to explore and
          document the ever-changing moods of the natural environment. His portfolio
          is a celebration of life, light, and the timeless beauty of the outdoors.
        </Typography>
      </Container>
    </React.Fragment>
  );
}

export default About;