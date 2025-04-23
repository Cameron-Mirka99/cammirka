import { Box, Dialog, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material"
import CloseIcon from '@mui/icons-material/Close';
import { Photo } from "../pages/Home";

type LargeImageModalProps = {
    modalOpen: boolean,
    handleModalClose: () => void,
    selectedPhoto: Photo | undefined
}
export const LargeImageModal = ({modalOpen, handleModalClose, selectedPhoto} : LargeImageModalProps) => {
    return (<>
    <Dialog open={modalOpen} onClose={handleModalClose} maxWidth="md" fullWidth>
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
            <Box component="img" src={selectedPhoto.url} alt="Selected" sx={{ width: '100%', borderRadius: 2 }} />
          )}
        </DialogContent>
        <Typography variant='body1'><small>All images have been resized to enhance online loading and may not reflect proper quality of image</small></Typography>
      </Dialog></>)
}