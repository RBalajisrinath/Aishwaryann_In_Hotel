# Hotel Booking System

> **Live Production Project** — This repository documents a live, deployed hotel booking & management platform.  
> The repository is kept **private**; shared here for portfolio / backend internship review.  
> Live site: https://aishwaryaminn.cloud

## Overview
A full-stack hotel booking and management system with OTP-based guest bookings, admin dashboard, bill generation, and payment processing.

## Tech Stack
- **Backend**: Node.js, Express, MySQL
- **Frontend Admin**: React, Vite, Tailwind CSS
- **Frontend Client**: React, Vite
- **Real-time**: Socket.io
- **Database**: MySQL with proper GST calculations

## Backend Highlights (for internship review)
- RESTful API with modular routes/controllers (`server/routes`, `server/controllers`)
- JWT + OTP-based authentication, bcrypt password hashing
- MySQL with parameterized queries; transactional booking flow
- Socket.io real-time updates + DB event consumer
- Security: Helmet, CORS, rate limiting, request logging, centralized error handler
- File uploads (Multer), PDF bill generation, email (Nodemailer)
- Scheduled cleanup jobs for expired OTPs/sessions

## Prerequisites
- Node.js v18+ and npm
- MySQL Server 8.0+
- `.env` file with database credentials

## Installation

### 1. Backend Setup
```bash
cd server
npm install
```

### 2. Admin Frontend Setup
```bash
cd admin
npm install
```

### 3. Client Frontend Setup
```bash
cd client
npm install
```

### 4. Database Setup
Create MySQL database and run migrations:
```bash
mysql -u root -p hotel_booking < database-schema.sql
```

### 5. Environment Configuration
Create `.env` files in server, admin, and client directories with:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hotel_booking
ADMIN_EMAIL=admin@hotel.com
```

## Running the Application

### Development Mode

**Terminal 1 - Backend Server:**
```bash
cd server
npm start
# Runs on http://localhost:5000
```

**Terminal 2 - Admin Frontend:**
```bash
cd admin
npm run dev
# Runs on http://localhost:3001
```

**Terminal 3 - Client Frontend:**
```bash
cd client
npm run dev
# Runs on http://localhost:3000
```

### Production Mode

**Backend:**
```bash
cd server
npm run build
npm start
```

**Admin:**
```bash
cd admin
npm run build
```

**Client:**
```bash
cd client
npm run build
```

## API Documentation

### Guest Booking
- `POST /api/guest/verify-otp` - Verify OTP for booking
- `POST /api/guest/create-booking` - Create booking with payment
- `GET /api/guest/booking/:id` - Get booking details
- `PUT /api/guest/booking/:id/cancel` - Cancel booking

### Admin Dashboard
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/bookings` - All bookings
- `GET /api/admin/bookings/search/:id` - Search booking
- `POST /api/admin/bills/generate` - Generate bill

### Rooms Management
- `GET /api/admin/rooms` - All rooms
- `POST /api/admin/rooms` - Add new room
- `PUT /api/admin/rooms/:id` - Update room
- `DELETE /api/admin/rooms/:id` - Delete room

## Features

### Guest Features
- OTP-based secure booking
- Real-time room availability
- Multiple room booking
- GST calculation (12% exclusive)
- Payment proof upload
- Bill download

### Admin Features
- Dashboard with statistics
- Booking management
- Bill generation and customization
- Room management
- Payment settings
- Guest profile management
- Email notifications

## GST Calculation

GST is calculated at booking time:
- **12% Exclusive** - Added on top of room charges
- Formula: `totalPrice = basePrice + (basePrice × 12%)`
- Stored in database for bill display

## Security

- JWT authentication for admin
- OTP-based guest verification
- Password hashing with bcrypt
- File upload validation
- SQL injection prevention with parameterized queries
- CORS security headers

## Database Schema

### Main Tables
- `users` - Admin users
- `bookings` - Guest bookings with GST info
- `rooms` - Hotel rooms
- `guest_profiles` - Guest information
- `guest_otps` - One-time passwords
- `guest_booking_sessions` - Booking session tracking
- `payment_settings` - Hotel payment configuration
- `hotels` - Hotel details
- `hotel_policies` - Hotel policies
- `site_content` - Website content management

## Troubleshooting

### Database Connection Error
- Verify MySQL is running
- Check `.env` credentials
- Ensure database exists: `CREATE DATABASE hotel_booking;`

### Port Already in Use
```bash
# Kill process using port 5000 (backend)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Kill process using port 3001 (admin)
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Build Errors
```bash
# Clear node_modules and reinstall
rm -r node_modules package-lock.json
npm install
```

## Deployment

### Server Hosting
1. Deploy to server (AWS, DigitalOcean, Heroku)
2. Set environment variables
3. Run database migrations
4. Start Node.js server with PM2:
```bash
npm install -g pm2
pm2 start server.js --name "hotel-api"
pm2 startup
pm2 save
```

### Frontend Hosting
1. Build admin: `npm run build` (outputs to `dist/`)
2. Build client: `npm run build`
3. Deploy `dist/` folders to web server (Nginx, Apache, Vercel, Netlify)

## Support
For issues or questions, contact: support@hotelmanagement.com

## License
© 2025 Hotel Management System. All rights reserved.
