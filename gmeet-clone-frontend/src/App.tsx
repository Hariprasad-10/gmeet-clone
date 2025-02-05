// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RoomForm from './components/RoomForm';
import VideoCall from './components/VideoCall';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoomForm />} />
        <Route path="/video-call/:roomId" element={<VideoCall roomId={''} />} />
      </Routes>
    </Router>
  );
};

export default App;
