const express = require('express');
const http = require('http');
const path = require('path');
require('ws'); // WebSocket is required by websocket.js

const app = express();
const server = http.createServer(app);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Middleware to parse JSON bodies

// Import and initialize WebSocket and Timer modules
const initializeWebSocket = require('./websocket');
const { initializeTimer, setManualStatus } = require('./timer');

// Initialize WebSocket server
const { broadcastStatus } = initializeWebSocket(server);

// Add a test-only endpoint to manually control chatroom status
if (process.env.NODE_ENV === 'test') {
  app.post('/test/set-status', (req, res) => {
    const { isOpen } = req.body;
    if (typeof isOpen !== 'boolean') {
      return res.status(400).send({ error: 'isOpen must be a boolean' });
    }
    setManualStatus(isOpen);
    broadcastStatus(); // Use the decoupled function
    res.status(200).send({ message: `Chatroom status set to ${isOpen}` });
  });
}

// Add dev route to bypass countdown for development
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev') {
  app.post('/dev/bypass-countdown', (req, res) => {
    setManualStatus(true);
    broadcastStatus();
    res.status(200).send({ message: 'Chatroom opened via dev bypass' });
  });
  
  app.get('/dev/bypass-countdown', (req, res) => {
    setManualStatus(true);
    broadcastStatus();
    res.send(`
      <html>
        <head><title>Dev Bypass - Chat Open</title></head>
        <body>
          <h1>Chatroom opened via dev bypass</h1>
          <p>The chatroom has been manually opened for development purposes.</p>
          <p><a href="/">Go to chat</a></p>
        </body>
      </html>
    `);
  });
}

// Initialize the timer logic
initializeTimer(broadcastStatus); // Pass the callback instead of the whole wss object

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
