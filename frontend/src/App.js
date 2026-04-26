import React, { useState } from 'react';
import axios from 'axios';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import LandingPage from './pages/landing';

function App() {
  return (
    <>
      <Router>
        <Routes >
          <Route path='/' element={<LandingPage />}/>
        </Routes>
      </Router>
    </>
  )
}

export default App;