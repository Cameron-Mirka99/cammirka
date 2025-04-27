import { Masonry } from "@mui/lab"
import { Box, Container } from "@mui/material"
import { Photo } from "../pages/Home";
import {useState} from 'react'

type PhotoItemProps = {
  src:Photo,
  alt:string,
  onClick: () => void

}

function PhotoItem({ src , alt, onClick } : PhotoItemProps) {
    const [hovered, setHovered] = useState(false);
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
          src={src.url}
          alt={alt}
          sx={{
            width: '100%',
            display: 'block',
            transition: 'transform 0.3s',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
            transformOrigin: 'center center',
          }}
          title={src.key}
        />
      </Box>
    );
  }
type MainImageDisplayProps = {
  setSelectedPhoto: (photoUrl: Photo) => void;
  setModalOpen: (open: boolean) => void;
  photos: Array<Photo>;
  columnsCount: number;
}
export const MainImageDisplay = ({setSelectedPhoto,setModalOpen,photos,columnsCount} : MainImageDisplayProps) => {
    const handlePhotoClick = (photoUrl : Photo) => {
        setSelectedPhoto(photoUrl);
        setModalOpen(true);
      };
    return (<>
          <Container maxWidth={false} sx={{ marginTop: 4 }}>
          <Masonry columns={columnsCount} spacing={2}>
            {photos.map((photo : Photo, index : number) => {
              console.log(photo)
              return (
              <PhotoItem
                key={index}
                src={photo}
                alt={`Photo ${index + 1}`}
                onClick={() => handlePhotoClick(photo)}
              />
            )})}
          </Masonry>
      </Container>
    </>)
}