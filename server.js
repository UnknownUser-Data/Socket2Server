const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Array to store logs for persistence and list of connected clients
const logs = [];
const connectedClients = {};

// Log function to add entries and broadcast logs to clients
function log(message) {
    const logEntry = `[${new Date().toLocaleTimeString()}] ${message}`;
    logs.push(logEntry);
    io.emit('log', logEntry);  // Send log entry to all clients
    console.log(logEntry);  // Print on server console
}

// Handle new socket connections
io.on('connection', (socket) => {
    const clientId = socket.id;
    const clientIp = socket.handshake.address;
    connectedClients[clientId] = clientIp;

    // Log connection event and send updated client list to all clients
    log(`Client connected: ID=${clientId}, IP=${clientIp}`);
    io.emit('updateClients', connectedClients);

    // Send all existing logs and current clients to the new client
    socket.emit('initialLogs', logs);
    socket.emit('updateClients', connectedClients);

    // Handle message sending from UI
    socket.on('sendMessage', (message) => {
        if (message && message.trim()) {
            log(`Message from Client ID=${clientId}: ${message}`);
            io.emit('receiveMessage', message);
        } else {
            log(`Error: Empty message received from Client ID=${clientId}`);
        }
    });

    // Handle client disconnect event
    socket.on('disconnect', () => {
        log(`Client disconnected: ID=${clientId}`);
        delete connectedClients[clientId];
        io.emit('updateClients', connectedClients);  // Update client list on UI
    });

    // Handle errors on the socket connection
    socket.on('error', (err) => {
        log(`Socket error from Client ID=${clientId}: ${err.message}`);
    });
});

// Handle server errors
server.on('error', (err) => {
    log(`Server error: ${err.message}`);
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
    log(`Server running on http://localhost:${PORT}`);
});
