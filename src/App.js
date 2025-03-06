import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';

function App() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch 9 random photos from the Dog CEO API once.
    const fetchPhotos = async () => {
      try {
        const response = await fetch('https://dog.ceo/api/breeds/image/random/30');
        const data = await response.json();
        if (data.status === 'success') {
          setPhotos(data.message);
        }
      } catch (error) {
        console.error('Error fetching photos:', error);
      } finally {
        setLoading(false);
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
