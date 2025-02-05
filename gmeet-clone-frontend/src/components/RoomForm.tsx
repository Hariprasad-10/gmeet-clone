import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection

const RoomForm: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate(); // Initialize useNavigate
  const [isRoomCreated, setIsRoomCreated] = useState(false); // Track if the room has been created

  const handleCreateRoom = () => {
    // Generate a random room ID (you can replace this with your own logic)
    const newRoomId = Math.random().toString(36).substr(2, 9);
    setRoomId(newRoomId);
    
    // Mark the room as created
    setIsRoomCreated(true);
    
    // Redirect to video call page
    navigate(`/video-call/${newRoomId}`);
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      // Redirect to video call page
      navigate(`/video-call/${roomId}`);
    } else {
      alert('Please enter a Room ID to join');
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Create or Join a Room</h2>
      <button onClick={handleCreateRoom}>Create Room</button>
      
      {isRoomCreated && (
        <div>
          <h3>Room ID: {roomId}</h3>
          <button onClick={handleJoinRoom}>Join Room</button>
        </div>
      )}

      {!isRoomCreated && (
        <div>
          <h3>Join a Room</h3>
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button onClick={handleJoinRoom}>Join Room</button>
        </div>
      )}
    </div>
  );
};

export default RoomForm;
