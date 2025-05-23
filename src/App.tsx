import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home, { Photo } from './pages/Home';
import About from './pages/About';

function App() {
  const [photos, setPhotos] = useState([] as Array<Photo>);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const res = await fetch('https://atp0hr8g95.execute-api.us-east-1.amazonaws.com/GetPhotoList');
        const data = await res.json();
        setPhotos(shufflePhotos(data.photos));
      } catch (err) {
        console.error('Failed to fetch photos:', err);
      } finally{
        setLoading(false);
      }
    };

    const shufflePhotos = (photos : Array<Photo>) => {
      const shuffled = [...photos]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }
    //should prevent constant fetching when dev working
    if(photos.length === 0) {
      fetchPhotos();
    }else{
      console.log('Not refreshing the photo list');
    }
  }, [photos.length]);

  return (
    <Routes>
      <Route path="/" element={<Home photos={photos} loading={loading} />} />
      <Route path="/about" element={<About />} />
    </Routes>
  );
}

export default App;
