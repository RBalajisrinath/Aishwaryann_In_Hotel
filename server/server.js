import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/config.js';
import { initializeDatabase } from './config/database.js';
import { initializeEmailService } from './utils/email.js'; // Import email service
import { setupSocketHandlers } from './socket/socketHandler.js';
import { startDbEventConsumer } from './utils/dbEventConsumer.js';
import authRoutes from './routes/auth.js';
import hotelRoutes from './routes/hotels.js';
import bookingRoutes from './routes/bookings.js';
import adminRoutes from './routes/admin.js';
import galleryRoutes from './routes/gallery.js';
import guestRoutes from './routes/guest.js'; // NEW: Guest OTP-based booking routes
import siteContentRoutes from './routes/siteContent.js'; // NEW: Website content management
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { checkWebsiteStatus } from './middleware/websiteStatus.js';
import { broadcastAdminUpdate } from './middleware/broadcastUpdates.js';
import { cleanupExpired } from './controllers/guestController.js'; // NEW: Cleanup function

console.log('🚀 Starting server initialization...');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: config.cors,
  transports: ['websocket', 'polling']
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));
app.use(cors(config.cors));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(requestLogger);

// Add broadcast middleware BEFORE routes
app.use(broadcastAdminUpdate(io));

// Serve static files (payment proofs and yearCard images) with CORS headers
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static('uploads'));

// Store io instance for access in routes
app.locals.io = io;

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/guest', guestRoutes); // NEW: Guest OTP-based booking routes (no auth required)
app.use('/api/hotels', checkWebsiteStatus, hotelRoutes);
app.use('/api/bookings', checkWebsiteStatus, bookingRoutes);
// Billing routes removed
app.use('/api/admin', adminRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/site-content', siteContentRoutes); // NEW: Website content management (public read, admin write)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Error handler middleware
app.use(errorHandler);

// Initialize database and start server
console.log('📋 Setting up startServer function...');

const startServer = async () => {
  try {
    console.log('📡 Initializing database...');
    // Initialize database
    await initializeDatabase();
    console.log('✅ Database initialized successfully');

    console.log('📧 Initializing email service...');
    // Initialize email service (await verification/fallback)
    await initializeEmailService();
    console.log('✅ Email service initialized');

    console.log('🔌 Setting up Socket.io handlers...');
    // Setup Socket.io handlers
    setupSocketHandlers(io);
    console.log('✅ Socket.io handlers ready');

    // Start DB event consumer that forwards DB events to socket.io
    try {
      console.log('📊 Starting DB event consumer...');
      startDbEventConsumer(io);
      console.log('✅ DB event consumer started');
    } catch (consumerErr) {
      console.error('⚠️ Failed to start DB event consumer:', consumerErr && consumerErr.message);
    }

    // Schedule cleanup of expired OTPs and sessions (every 15 minutes)
    setInterval(async () => {
      await cleanupExpired();
    }, 15 * 60 * 1000);

    // Start server
    console.log(`🎧 Attempting to listen on port ${config.port}...`);
    httpServer.listen(config.port, () => {
      console.log(`✅ SERVER RUNNING ON PORT ${config.port}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGINT', () => {
  httpServer.close(() => {
    process.exit(0);
  });
});

export { app, httpServer, io };
