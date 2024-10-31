// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let isServerRunning = false;
let activePort = null;

// Serve static files
app.use(express.static('public'));

// Handle socket connections
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });

    // Listen for messages from client
    socket.on('message', (msg) => {
        console.log('Received message:', msg);
        // Broadcast message to all clients
        io.emit('message', msg);
    });
});

// Start server with error handling
function startServer(port) {
    return new Promise((resolve, reject) => {
        if (isServerRunning) {
            reject('Server is already running on port ' + activePort);
            return;
        }
        server.listen(port, (err) => {
            if (err) {
                reject(err.message);
                return;
            }
            activePort = port;
            isServerRunning = true;
            console.log(`Server started on port ${port}`);
            resolve();
        });
    });
}

// API endpoint to start server dynamically
app.get('/start/:port', async (req, res) => {
    const port = parseInt(req.params.port, 10);
    if (!port || isNaN(port)) {
        return res.status(400).send('Invalid port');
    }
    try {
        await startServer(port);
        res.status(200).send(`Server started on port ${port}`);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Stop server with error handling
function stopServer() {
    return new Promise((resolve, reject) => {
        if (!isServerRunning) {
            reject('Server is not running');
            return;
        }
        server.close((err) => {
            if (err) {
                reject(err.message);
                return;
            }
            isServerRunning = false;
            activePort = null;
            console.log('Server stopped');
            resolve();
        });
    });
}

// API endpoint to stop server
app.get('/stop', async (req, res) => {
    try {
        await stopServer();
        res.status(200).send('Server stopped');
    } catch (error) {
        res.status(500).send(error);
    }
});
