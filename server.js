// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const httpServer = http.createServer(app);

let io = null;
let socketServer = null;
let isSocketServerRunning = false;
let activePort = null;

// Serve static files
app.use(express.static('public'));

// Start Socket.IO server on a specific port
async function startSocketServer(port) {
    if (isSocketServerRunning) {
        throw new Error(`Socket server is already running on port ${activePort}`);
    }

    socketServer = http.createServer();
    io = socketIo(socketServer);

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });

        socket.on('message', (msg) => {
            console.log('Received message:', msg);
            io.emit('message', msg);
        });
    });

    return new Promise((resolve, reject) => {
        socketServer.listen(port, (err) => {
            if (err) {
                reject(err.message);
                return;
            }
            isSocketServerRunning = true;
            activePort = port;
            console.log(`Socket.IO server started on port ${port}`);
            resolve();
        });
    });
}

// Stop Socket.IO server
async function stopSocketServer() {
    if (!isSocketServerRunning) {
        throw new Error('Socket server is not running');
    }

    return new Promise((resolve, reject) => {
        socketServer.close((err) => {
            if (err) {
                reject(err.message);
                return;
            }
            isSocketServerRunning = false;
            activePort = null;
            io = null;
            console.log('Socket.IO server stopped');
            resolve();
        });
    });
}

// API endpoint to start Socket.IO server dynamically
app.get('/start-socket/:port', async (req, res) => {
    const port = parseInt(req.params.port, 10);
    if (!port || isNaN(port)) {
        return res.status(400).send('Invalid port');
    }
    try {
        await startSocketServer(port);
        res.status(200).send(`Socket.IO server started on port ${port}`);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// API endpoint to stop Socket.IO server
app.get('/stop-socket', async (req, res) => {
    try {
        await stopSocketServer();
        res.status(200).send('Socket.IO server stopped');
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Start main Express server on a fixed port (e.g., 3000)
const mainPort = 3000;
httpServer.listen(mainPort, () => {
    console.log(`Main server running on port ${mainPort}`);
});
