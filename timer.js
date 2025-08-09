let isChatroomOpen = false;
let nextOpenTime = null;
let openUntil = null;
let broadcastStatusCallback = null;
let manualStatusOverride = null;

let openTimeout = null;
let closeTimeout = null;

function scheduleNextOpen() {
  isChatroomOpen = false;

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const randomHour = Math.floor(Math.random() * 24);
  const randomMinute = Math.floor(Math.random() * 60);
  const randomSecond = Math.floor(Math.random() * 60);

  nextOpenTime = new Date(tomorrow);
  nextOpenTime.setHours(randomHour, randomMinute, randomSecond, 0);

  const durationMinutes = Math.floor(Math.random() * (60 - 5 + 1)) + 5;
  openUntil = new Date(nextOpenTime.getTime() + durationMinutes * 60 * 1000);

  console.log(`Next chatroom open scheduled for: ${nextOpenTime.toLocaleString()} for ${durationMinutes} minutes.`);

  const timeUntilOpen = nextOpenTime.getTime() - Date.now();
  if (timeUntilOpen > 0) {
    openTimeout = setTimeout(openChatroom, timeUntilOpen);
  } else {
    console.error('Calculated open time is in the past, scheduling for next day.');
    scheduleNextOpen();
  }

  if (broadcastStatusCallback) {
    broadcastStatusCallback();
  }
}

function openChatroom() {
  isChatroomOpen = true;
  console.log(`Chatroom is now OPEN until: ${openUntil.toLocaleString()}`);

  const timeUntilClose = openUntil.getTime() - Date.now();
  if (timeUntilClose > 0) {
    closeTimeout = setTimeout(closeChatroom, timeUntilClose);
  } else {
    console.error('Calculated close time is in the past, closing immediately.');
    closeChatroom();
  }

  if (broadcastStatusCallback) {
    broadcastStatusCallback();
  }
}

function closeChatroom() {
  isChatroomOpen = false;
  console.log('Chatroom is now CLOSED.');
  scheduleNextOpen();
}

function initializeTimer(broadcastCallback) {
  broadcastStatusCallback = broadcastCallback;
  scheduleNextOpen();
}

function getStatus() {
  const isManual = manualStatusOverride !== null;
  return {
    isChatroomOpen: isManual ? manualStatusOverride : isChatroomOpen,
    nextOpenTime: isManual ? null : (nextOpenTime ? nextOpenTime.toISOString() : null),
    openUntil: isManual ? null : (openUntil ? openUntil.toISOString() : null)
  };
}

function setManualStatus(isOpen) {
  manualStatusOverride = isOpen;
  // Clear any pending timers to prevent them from interfering with manual mode
  if (openTimeout) clearTimeout(openTimeout);
  if (closeTimeout) clearTimeout(closeTimeout);
  console.log(`Chatroom status manually set to: ${isOpen ? 'OPEN' : 'CLOSED'}`);
}

module.exports = {
  initializeTimer,
  getStatus,
  setManualStatus
};
