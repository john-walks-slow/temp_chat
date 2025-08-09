const WebSocket = require('ws');

function initializeWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  const timer = require('./timer');

  function broadcastStatus() {
    const status = timer.getStatus();
    const message = JSON.stringify({ type: 'status', ...status });
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  function broadcastMessage(data) {
    const message = JSON.stringify({ type: 'message', data });
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  wss.on('connection', (ws) => {
    console.log('Client connected');

    const status = timer.getStatus();
    ws.send(JSON.stringify({ type: 'status', ...status }));

    ws.on('message', (raw) => {
      const status = timer.getStatus();
      if (!status.isChatroomOpen) {
        ws.send(JSON.stringify({ type: 'error', message: 'Chatroom is closed.' }));
        return;
      }

      try {
        const data = JSON.parse(raw.toString());
        if (data.type === 'message' && data.text) {
          broadcastMessage(data.text);
        }
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format.' }));
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });

  return { wss, broadcastStatus, broadcastMessage };
}

module.exports = initializeWebSocket;