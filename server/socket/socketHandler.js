import { verifyAccessToken } from '../utils/auth.js';

const activeUsers = new Map();
const userSockets = new Map();

export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    // User connection established

    // User joins
    socket.on('user:join', async (data) => {
      try {
        if (data && data.token) {
          const decoded = verifyAccessToken(data.token);
          socket.userId = decoded.userId;
          socket.userRole = decoded.role;
          socket.userEmail = decoded.email;

          activeUsers.set(socket.userId, {
            socketId: socket.id,
            role: decoded.role,
            email: decoded.email,
            joinedAt: new Date()
          });

          userSockets.set(socket.id, socket.userId);

          // Notify all connected users
          io.emit('users:online', Array.from(activeUsers.keys()));
        } else {
          // Allow unauthenticated/guest sockets (do not disconnect)
          socket.userId = `guest_${socket.id}`;
          socket.userRole = 'guest';
          socket.userEmail = null;

          activeUsers.set(socket.userId, {
            socketId: socket.id,
            role: 'guest',
            email: null,
            joinedAt: new Date()
          });

          userSockets.set(socket.id, socket.userId);
          io.emit('users:online', Array.from(activeUsers.keys()));
        }
      } catch (error) {
        socket.emit('error', { message: 'Authentication failed' });
        socket.disconnect();
      }
    });

    // Real-time room availability update
    socket.on('room:check', (data) => {
      const { roomId, hotelId } = data;
      socket.broadcast.emit('room:availability', {
        roomId,
        hotelId,
        status: 'checking'
      });
    });

    // Room booked event
    socket.on('booking:created', (data) => {
      io.emit('booking:notification', {
        type: 'new_booking',
        bookingId: data.bookingId,
        roomId: data.roomId,
        hotelId: data.hotelId,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        timestamp: new Date()
      });
    });

    // Room released/cancelled
    socket.on('booking:cancelled', (data) => {
      io.emit('room:available', {
        roomId: data.roomId,
        hotelId: data.hotelId,
        timestamp: new Date()
      });
    });

    // Admin notifications - billing events removed

    // Join admin room
    socket.on('admin:join', () => {
      if (socket.userRole === 'admin') {
        socket.join('admins');
        io.to('admins').emit('admin:status', { 
          message: 'Admin online',
          timestamp: new Date()
        });
      }
    });

    // Leave admin room
    socket.on('admin:leave', () => {
      socket.leave('admins');
    });

    // Real-time bill status update removed

    // Real-time hotel data sync
    socket.on('hotel:update', (data) => {
      socket.broadcast.emit('hotel:synced', {
        hotelId: data.hotelId,
        data: data.changes,
        timestamp: new Date()
      });
    });

    // Chat/messaging (optional)
    socket.on('message:send', (data) => {
      const { recipientId, message } = data;
      const recipientSocket = activeUsers.get(recipientId);
      
      if (recipientSocket) {
        io.to(recipientSocket.socketId).emit('message:receive', {
          from: socket.userId,
          message,
          timestamp: new Date()
        });
      }
    });

    // User disconnects
    socket.on('disconnect', () => {
      const userId = userSockets.get(socket.id);
      if (userId) {
        activeUsers.delete(userId);
        userSockets.delete(socket.id);
        io.emit('users:online', Array.from(activeUsers.keys()));
      }
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  // Periodic sync (every 30 seconds)
  setInterval(() => {
    io.emit('sync:ping', { timestamp: new Date() });
  }, 30000);
};

export const emitToUser = (io, userId, event, data) => {
  const user = activeUsers.get(userId);
  if (user) {
    io.to(user.socketId).emit(event, data);
  }
};

export const emitToAdmins = (io, event, data) => {
  io.to('admins').emit(event, data);
};

export const emitToAllUsers = (io, event, data) => {
  io.emit(event, data);
};

export const getActiveUsers = () => {
  return Array.from(activeUsers.entries()).map(([userId, data]) => ({
    userId,
    ...data
  }));
};
