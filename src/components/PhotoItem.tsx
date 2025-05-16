import { Box } from "@mui/material";
import { useState, memo } from 'react';
import { Photo } from "../pages/Home";

export type PhotoItemProps = {
  src: Photo;
  alt: string;
  onClick: () => void;
  id?: string; // Optional ID for better accessibility
};

const PhotoItem = memo(({ src, alt, onClick, id }: PhotoItemProps) => {
  const [hovered, setHovered] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleImageError = () => {
    setHasError(true);
  };

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`View larger version of ${alt}`}
      id={id}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
        cursor: 'pointer',
      }}
    >
      {hasError ? (
        <Box
          sx={{
            width: '100%',
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary',
            backgroundColor: '#f0f0f0',
            p: 2,
          }}
        >
          Image failed to load
        </Box>
      ) : (
        <Box
          component="img"
          src={src.url}
          alt={alt}
          onError={handleImageError}
          sx={{
            width: '100%',
            display: 'block',
            transition: 'transform 0.3s ease-out',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
            transformOrigin: 'center center',
          }}
          title={src.key}
        />
      )}
    </Box>
  );
});

PhotoItem.displayName = 'PhotoItem';

export default PhotoItem;