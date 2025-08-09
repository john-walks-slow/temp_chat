const ws = new WebSocket(`ws://${location.host}`);
const closedEl = document.getElementById('closed');
const openEl = document.getElementById('open');
const countdownEl = document.getElementById('countdown');
const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('input');

let isOpen = false;

function renderStatus(status) {
  isOpen = status.isChatroomOpen;

  // Check if required elements exist
  if (!closedEl || !openEl) {
    console.error('Required status elements not found');
    return;
  }

  if (isOpen) {
    closedEl.style.display = 'none';
    openEl.style.display = 'block';
  } else {
    closedEl.style.display = 'block';
    openEl.style.display = 'none';
    startCountdown(status.nextOpenTime);
  }
}

function startCountdown(isoTime) {
  const target = new Date(isoTime);
  function tick() {
    if (!countdownEl) {
      console.error('Countdown element not found');
      return;
    }
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) {
      countdownEl.textContent = 'opening...';
      return;
    }
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    countdownEl.textContent = `${hours}h ${minutes}m ${seconds}s`;
    setTimeout(tick, 1000);
  }
  tick();
}

function appendMessage(text) {
  if (!messagesEl) {
    console.error('Messages element not found');
    return;
  }

  const div = document.createElement('div');
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

ws.addEventListener('open', () => {
  console.log('connected');
});

ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'status') {
    renderStatus(msg);
  } else if (msg.type === 'message') {
    appendMessage(msg.data);
  } else if (msg.type === 'error') {
    console.error(msg.message);
  }
});

// Handle input element with proper null checking
if (inputEl) {
  inputEl.addEventListener('keydown', (e) => {
    // Use a more defensive approach to access value
    const input = /** @type {HTMLInputElement} */ (inputEl);
    if (e.key === 'Enter' && input.value && input.value.trim()) {
      ws.send(JSON.stringify({ type: 'message', text: input.value.trim() }));
      input.value = '';
    }
  });
} else {
  console.error('Input element not found');
}
