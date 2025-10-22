import { Box } from "@mui/material";
import { useState, memo, useMemo } from 'react';
import { Photo } from "../pages/Home";
import photoCache from '../utils/photoCache';

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

  const imageSrc = useMemo(() => photoCache.get(src.url) || src.url, [src.url]);

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
          src={imageSrc}
          alt={alt}
          onError={handleImageError}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          sx={{
            width: '100%',
            display: 'block',
            transition: 'transform 0.3s ease-out',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
            transformOrigin: 'center center',
            userSelect: 'none',
          }}
          title={src.key}
        />
      )}
    </Box>
  );
});

PhotoItem.displayName = 'PhotoItem';

export default PhotoItem;