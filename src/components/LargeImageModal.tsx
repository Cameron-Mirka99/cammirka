import { Box, Dialog, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material"
import CloseIcon from '@mui/icons-material/Close';
import { Photo } from "../pages/Home";
import photoCache from '../utils/photoCache';

type LargeImageModalProps = {
    modalOpen: boolean,
    handleModalClose: () => void,
    selectedPhoto: Photo | undefined
}
export const LargeImageModal = ({modalOpen, handleModalClose, selectedPhoto} : LargeImageModalProps) => {
    return (<>
  <Dialog open={modalOpen} onClose={handleModalClose} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ m: 0, p: 2 }}>
          {selectedPhoto ? selectedPhoto.key : ''}
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
            <Box
              component="img"
              src={photoCache.get(selectedPhoto.url) || selectedPhoto.url}
              alt="Selected"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: '80vh',
                objectFit: 'contain',
                display: 'block',
                margin: '0 auto',
                borderRadius: 2,
                userSelect: 'none',
              }}
            />
          )}
        </DialogContent>
        <Typography variant='body1'><small>All images have been resized to enhance online loading and may not reflect proper quality of image</small></Typography>
      </Dialog></>)
}