import React, { useState } from 'react';
import axios from 'axios';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import LandingPage from './pages/landing';
import AuthenticationPage from './pages/authentication';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <>
      <Router>
        <AuthProvider>
          <Routes >
            <Route path='/' element={<LandingPage />} />
            <Route path='/auth' element={<AuthenticationPage />} />
          </Routes>
          </AuthProvider>
      </Router>
    </>
  )
}

export default App;