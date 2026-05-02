import React, { useState } from 'react';
import axios from 'axios';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import LandingPage from './pages/landing';
import AuthenticationPage from './pages/authentication';

function App() {
  return (
    <>
      <Router>
        <Routes >
          <Route path='/' element={<LandingPage />}/>
          <Route path='/auth' element={<AuthenticationPage />}/>
        </Routes>
      </Router>
    </>
  )
}

export default App;