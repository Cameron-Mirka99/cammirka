import React from 'react';
import './App.css';
import { Header } from './browser/header';
import { MainContent } from './browser/mainContent';



function App() {
  return (
    <div className="App">
      <Header></Header>
      <MainContent></MainContent>
    </div>
  );
}

export default App;
