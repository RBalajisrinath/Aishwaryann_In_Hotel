import { io } from 'socket.io-client';
import { useNotificationStore } from './store.js';

const SOCKET_URL = '';
let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

export const initializeSocket = (token) => {
  // Prevent multiple socket instances
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    transports: ['websocket', 'polling']
  });

  // Connection events
  socket.on('connect', () => {
    reconnectAttempts = 0;
    socket.emit('user:join', { token });
  });

  socket.on('disconnect', () => {
    // Disconnected from server
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
    const notify = useNotificationStore.getState();
    notify.addNotification({
      type: 'error',
      message: 'Connection error: ' + error
    });
  });

  socket.on('connect_error', (error) => {
    reconnectAttempts++;
    console.error(`⚠️ Connection error (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}):`, error);
  });

  // Real-time events
  socket.on('booking:notification', (data) => {
    const notify = useNotificationStore.getState();
    notify.addNotification({
      type: 'info',
      message: `New booking: ${data.bookingId}`
    });
  });

  socket.on('room:available', (data) => {
    const notify = useNotificationStore.getState();
    notify.addNotification({
      type: 'success',
      message: `Room ${data.roomId} is now available`
    });
  });

  // Billing socket events removed

  socket.on('admin:notification', (data) => {
    const notify = useNotificationStore.getState();
    notify.addNotification({
      type: 'warning',
      message: data.type.replace('_', ' ')
    });
  });

  socket.on('users:online', (users) => {
    // Users online count updated
  });

  // Payment Settings Updated - Critical for real-time updates
  socket.on('paymentSettingsUpdated', (data) => {
    // Payment settings updated - handled by client listeners
  });

  return socket;
};

export const getSocket = () => socket;

export const emitEvent = (event, data) => {
  if (socket) {
    socket.emit(event, data);
  }
};

export const onEvent = (event, callback) => {
  try {
    if (!socket) {
      return;
    }

    socket.on(event, (data) => {
      try {
        callback(data);
      } catch (err) {
        console.error(`Error in callback for event ${event}:`, err);
      }
    });
  } catch (err) {
    console.error(`Error registering listener for ${event}:`, err);
  }
};

export const offEvent = (event) => {
  try {
    if (socket) {
      socket.off(event);
    }
  } catch (err) {
    console.error(`Error unregistering listener for ${event}:`, err);
  }
};

export const waitForSocket = (timeout = 5000) => {
  return new Promise((resolve, reject) => {
    if (socket && socket.connected) {
      resolve(socket);
      return;
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (socket && socket.connected) {
        clearInterval(checkInterval);
        resolve(socket);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        reject(new Error('Socket connection timeout'));
      }
    }, 100);
  });
};
