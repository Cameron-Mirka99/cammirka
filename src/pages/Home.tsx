import {useState} from 'react';
import {
  useTheme,
  useMediaQuery,
} from '@mui/material';

import { Header } from '../components/Header';
import { LargeImageModal } from '../components/LargeImageModal';
import { MainImageDisplay } from '../components/MainImageDisplay';

export type Photo = {
  key: string,
  url: string
}

type HomeProps = {
  photos: Array<Photo>;
  loading: boolean;
}
function Home({ photos, loading, ...props } : HomeProps) {
  const theme = useTheme();
  
  // Set dynamic column count based on screen width.
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isLg = useMediaQuery(theme.breakpoints.up('lg'));

  let columnsCount;
  if (isLg) {
    columnsCount = 3;
  } else if (isMd) {
    columnsCount = 2;
  } else if (isSm) {
    columnsCount = 2;
  } else {
    columnsCount = 1;
  }

  const [selectedPhoto, setSelectedPhoto] = useState<Photo>();
  const [modalOpen, setModalOpen] = useState(false);

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedPhoto({url: '', key: ''});
  };

  return (
    <>
      <Header props={props}/>
      <MainImageDisplay setSelectedPhoto={setSelectedPhoto} setModalOpen={setModalOpen} photos={photos} columnsCount={columnsCount}/>
      <LargeImageModal modalOpen={modalOpen} handleModalClose={handleModalClose} selectedPhoto={selectedPhoto}/>
    </>
  );
}

export default Home;
