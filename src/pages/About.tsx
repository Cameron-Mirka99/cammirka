import React from 'react';
import { Container, Typography, AppBar, Toolbar, Button, List, ListItem } from '@mui/material';
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
          About
        </Typography>
        <Typography variant="body1" paragraph>
        Hey there, and welcome!
        </Typography>
        <Typography variant='body1'>
My name is Cameron Mirka, and I’m an amateur photographer based in Central Ohio with a deep love for capturing the natural world—especially wildlife. Birds have a special place in my heart, and much of my photography is centered around observing and documenting their beauty, behavior, and the environments they call home.
</Typography>
<br></br>
<Typography variant='body1'>

My journey with photography started as a simple hobby, a way to slow down and reconnect with nature. Over time, it became something more—a creative outlet, a way to tell stories through images, and a way to share the incredible wildlife that surrounds us, even in our own backyards.
</Typography>
<br></br>
<Typography variant='body1'>
You’ll often find me out on the Olentangy Trail or roaming the paths of Highbanks Metro Park, camera in hand, patiently waiting for that one perfect moment when everything lines up just right—a soaring hawk, a perched heron, or the quiet stillness of a foggy morning in the woods.
        </Typography>
        <br></br>
        <Typography variant='body1'>
        Current Gear:
        <List>
          <ListItem>
          Canon R5 Mark II
          </ListItem>
          <ListItem>
          Canon EF 24–55mm f/5.6
          </ListItem>
          <ListItem>
          Canon RF 100-500mm F4.5-7.1 L IS USM
          </ListItem>
        </List>
        </Typography>
<br></br>
<Typography variant='body1'>

        I’m always learning, experimenting, and growing as a photographer, and I’m excited to share that journey with you. Whether you’re here to browse photos, connect over gear, or simply enjoy the beauty of Ohio’s wildlife, I’m really glad you stopped by.
        </Typography>
<br></br>
<Typography variant='body1'>
Thanks for being here—and feel free to reach out if you want to talk photography, birds, or your favorite spots in nature!
</Typography>
        
      </Container>
    </React.Fragment>
  );
}

export default About;