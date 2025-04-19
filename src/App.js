import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';

function App() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const res = await fetch('https://atp0hr8g95.execute-api.us-east-1.amazonaws.com/GetPhotoList');
        const data = await res.json();
        setPhotos(data.photos);
      } catch (err) {
        console.error('Failed to fetch photos:', err);
      } finally{
        setLoading('false');
      }
    };

    fetchPhotos();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Home photos={photos} loading={loading} />} />
      <Route path="/about" element={<About />} />
    </Routes>
  );
}

export default App;
