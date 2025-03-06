import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  useScrollTrigger,
  Slide,
  Container,
  Box,
  Button,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Link } from 'react-router-dom';
import Masonry from '@mui/lab/Masonry';

// Component to hide the AppBar on scroll
function HideOnScroll(props) {
  const { children, window } = props;
  const trigger = useScrollTrigger({ target: window ? window() : undefined });
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

// PhotoItem component wrapped in a container to prevent layout shifts on hover.
function PhotoItem({ src, alt, onClick }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
        cursor: 'pointer',
      }}
    >
      <Box
        component="img"
        src={src}
        alt={alt}
        sx={{
          width: '100%',
          display: 'block',
          transition: 'transform 0.3s',
          transform: hovered ? 'scale(1.05)' : 'scale(1)',
          transformOrigin: 'center center',
        }}
      />
    </Box>
  );
}

function Home({ photos, loading, ...props }) {
  const theme = useTheme();
  
  // Set dynamic column count based on screen width.
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isLg = useMediaQuery(theme.breakpoints.up('lg'));

  let columnsCount;
  if (isLg) {
    columnsCount = 6;
  } else if (isMd) {
    columnsCount = 4;
  } else if (isSm) {
    columnsCount = 3;
  } else {
    columnsCount = 2;
  }

  const [selectedPhoto, setSelectedPhoto] = React.useState(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  const handlePhotoClick = (photoUrl) => {
    setSelectedPhoto(photoUrl);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedPhoto(null);
  };

  return (
    <React.Fragment>
      {/* Header with fir forest theme */}
      <HideOnScroll {...props}>
        <AppBar>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Cameron Mirka Photography
            </Typography>
            <Button color="inherit" component={Link} to="/about">
              About
            </Button>
          </Toolbar>
        </AppBar>
      </HideOnScroll>
      <Toolbar />

      <Container maxWidth="xl" sx={{ marginTop: 4 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
            <CircularProgress />
          </Box>
        ) : (
          <Masonry columns={columnsCount} spacing={2}>
            {photos.map((photo, index) => (
              <PhotoItem
                key={index}
                src={photo}
                alt={`Photo ${index + 1}`}
                onClick={() => handlePhotoClick(photo)}
              />
            ))}
          </Masonry>
        )}
      </Container>

      {/* Modal for photo preview */}
      <Dialog open={modalOpen} onClose={handleModalClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ m: 0, p: 2 }}>
          Photo Preview
          <IconButton
            aria-label="close"
            onClick={handleModalClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedPhoto && (
            <Box component="img" src={selectedPhoto} alt="Selected" sx={{ width: '100%', borderRadius: 2 }} />
          )}
          <Typography variant="body1" sx={{ mt: 2 }}>
            A beautiful capture from our collection. Enjoy the details and natural beauty of this moment.
          </Typography>
        </DialogContent>
      </Dialog>
    </React.Fragment>
  );
}

export default Home;
