import './App.css';
import {TopHeader} from './browser/topHeader.jsx'
import {ContentRow} from './browser/contentRow'
import React from 'react';


const content = () =>(<>
<h1>This site is a work in progress</h1>
</>)

function App() {
  return (
    <div>
      <TopHeader/>
      <ContentRow content1={content()}/>
    </div>
  );
}

export default App;
