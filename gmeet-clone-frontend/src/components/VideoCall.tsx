import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000'); // Your backend server address

const VideoCall: React.FC<{ roomId: string }> = ({ roomId }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const userId = useRef(Math.random().toString(36).substr(2, 9)); // Generate a random user ID
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const peers: { [key: string]: RTCPeerConnection } = {};

  const [participants, setParticipants] = useState<string[]>([]);
  const [messages, setMessages] = useState<{ id: string; text: string }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);

  useEffect(() => {
    const startVideoCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        const localVideo = document.getElementById('local-video') as HTMLVideoElement;
        localVideo.srcObject = stream;

        socket.emit('join-room', roomId, userId.current);
      } catch (error) {
        alert('Unable to access camera and microphone. Please check your permissions.');
        console.error(error);
      }
    };

    startVideoCall();

    socket.on('user-connected', (remoteUserId: string) => {
      const peer = createPeerConnection(remoteUserId);
      peers[remoteUserId] = peer;
      setParticipants((prev) => [...prev, remoteUserId]);

      peer.createOffer().then((offer) => {
        return peer.setLocalDescription(offer);
      }).then(() => {
        socket.emit('offer', peer.localDescription, remoteUserId);
      });
    });

    socket.on('offer', (offer: RTCSessionDescriptionInit, remoteUserId: string) => {
      const peer = createPeerConnection(remoteUserId);
      peers[remoteUserId] = peer;
      peer.setRemoteDescription(new RTCSessionDescription(offer)).then(() => {
        return peer.createAnswer();
      }).then((answer) => {
        return peer.setLocalDescription(answer);
      }).then(() => {
        socket.emit('answer', peer.localDescription, remoteUserId);
      });
    });

    socket.on('answer', (answer: RTCSessionDescriptionInit, remoteUserId: string) => {
      const peer = peers[remoteUserId];
      if (peer) {
        peer.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('ice-candidate', (candidate: RTCIceCandidateInit, remoteUserId: string) => {
      const peer = peers[remoteUserId];
      if (peer) {
        peer.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on('user-disconnected', (remoteUserId: string) => {
      setParticipants((prev) => prev.filter((id) => id !== remoteUserId));
      if (peers[remoteUserId]) {
        peers[remoteUserId].close();
        delete peers[remoteUserId];
      }
    });

    socket.on('chat-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off('user-connected');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('user-disconnected');
      socket.off('chat-message');
    };
  }, [roomId]);

  const createPeerConnection = (remoteUserId: string) => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }, // STUN server for NAT traversal
      ],
    });

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        peer.addTrack(track, localStream!);
      });
    }

    peer.ontrack = (event) => {
      const remoteVideo = videoRefs.current[remoteUserId];
      if (remoteVideo) {
        remoteVideo.srcObject = event.streams[0];
      }
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', event.candidate, remoteUserId);
      }
    };

    return peer;
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks()[0].enabled = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks()[0].enabled = !isVideoDisabled;
      setIsVideoDisabled(!isVideoDisabled);
    }
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = { id: userId.current, text: newMessage };
      socket.emit('chat-message', message);
      setMessages((prev) => [...prev, message]);
      setNewMessage('');
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ fontSize: '2rem', margin: '20px 0' }}>Room ID: <strong>{roomId}</strong></h2>
      <h3>Your Video</h3>
      <video id="local-video" autoPlay muted style={{ width: '300px', border: '1px solid black' }} />
      {Object.keys(peers).map((remoteUserId) => (
        <div key={remoteUserId}>
          <h3>User {remoteUserId}</h3>
          <video
            ref={(ref) => { videoRefs.current[remoteUserId] = ref; }}
            autoPlay
            style={{ width: '300px', border: '1px solid black' }}
          />
        </div>
      ))}

      <div>
        <h3>Participants:</h3>
        <ul>
          {participants.map((id) => (
            <li key={id}>{id}</li>
          ))}
        </ul>
      </div>

      <button onClick={toggleMute}>{isMuted ? 'Unmute' : 'Mute'}</button>
      <button onClick={toggleVideo}>{isVideoDisabled ? 'Enable Video' : 'Disable Video'}</button>

      <div>
        <h3>Chat</h3>
        <div>
          {messages.map((msg, index) => (
            <div key={index}><strong>{msg.id}:</strong> {msg.text}</div>
          ))}
        </div>
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default VideoCall;
