import { Masonry } from "@mui/lab";
import { Container, Box, CircularProgress } from "@mui/material";
import { Photo } from "../pages/Home";
import PhotoItem from "./PhotoItem";
import { useState, useEffect } from 'react';
import photoCache from '../utils/photoCache';

type MainImageDisplayProps = {
  setSelectedPhoto: (photoUrl: Photo) => void;
  setModalOpen: (open: boolean) => void;
  photos: Array<Photo>;
  columnsCount: number;
};

export const MainImageDisplay = ({
  setSelectedPhoto,
  setModalOpen,
  photos,
  columnsCount
}: MainImageDisplayProps) => {
  const [loading, setLoading] = useState(true);
  const [visiblePhotos, setVisiblePhotos] = useState<Photo[]>([]);
  
  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo);
    setModalOpen(true);
  };

  // Set a longer timeout to ensure Masonry has time to calculate layout
  useEffect(() => {
    setLoading(true);
    setVisiblePhotos([]);
    
    // First preload all images via the cache
    const preloadImages = async () => {
      try {
        await photoCache.preloadMany(photos.map(p => p.url));
      } catch (error) {
        console.error("Error preloading images:", error);
      }
      
      // Create a shuffled copy of the photos array
      const shuffledPhotos = [...photos].sort(() => Math.random() - 0.5);
      
      // After preloading, add additional delay for layout calculation
      setTimeout(() => {
        setLoading(false);
        
        // Add all photos at once but they'll animate in with CSS
        setVisiblePhotos(shuffledPhotos);
      }, 800);
    };
    
    preloadImages();
    
    return () => {
      // Cleanup if component unmounts
    };
  }, [photos]);

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress />
        <Box sx={{ color: 'text.secondary' }}>Loading gallery...</Box>
      </Box>
    );
  }

  return (
    <Container maxWidth={false} sx={{ marginTop: 4 }}>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
      <Masonry columns={columnsCount} spacing={2}>
        {visiblePhotos.map((photo: Photo, index: number) => {
          // Find the original index of this photo in the photos array
          const originalIndex = photos.findIndex(p => p.key === photo.key);
          
          return (
            <Box
              key={`photo-${photo.key || index}`}
              sx={{
                opacity: 0,
                animationName: 'fadeIn',
                animationDuration: '0.8s',
                animationTimingFunction: 'ease-out',
                animationFillMode: 'forwards',
                animationDelay: `${index * 0.15}s`
              }}
            >
              <PhotoItem
                src={photo}
                alt={`Photo ${originalIndex + 1}`}
                onClick={() => handlePhotoClick(photo)}
                id={`photo-item-${originalIndex}`}
              />
            </Box>
          );
        })}
      </Masonry>
    </Container>
  );
};