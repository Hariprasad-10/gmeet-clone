// server.ts

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Enable CORS for all routes
app.use(cors());

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, 'client/dist'))); // Adjust the path as necessary

// Your socket.io logic
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    // Handle socket events...
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Fallback to serve index.html for any non-API requests
app.get('/favicon.ico', (req, res) => {
    res.status(204).send(); // Send a No Content response
});
