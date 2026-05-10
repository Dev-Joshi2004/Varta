import React, { useState } from 'react';
import axios from 'axios';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import LandingPage from './pages/landing';
import AuthenticationPage from './pages/authentication';
import { AuthProvider } from './contexts/AuthContext';
import VartaVideoComponent from './pages/vartaVideo';

function App() {
  return (
    <>
      <Router>
        <AuthProvider>
          <Routes >
            <Route path='/' element={<LandingPage />} />
            <Route path='/auth' element={<AuthenticationPage />} />
            <Route path="/:url" element={<VartaVideoComponent />} />
          </Routes>
          </AuthProvider>
      </Router>
    </>
  )
}

export default App;