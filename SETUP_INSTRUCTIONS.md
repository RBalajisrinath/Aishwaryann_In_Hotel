# 🏨 Hotel Booking System - Setup Instructions for Client

## 📋 Overview
Complete hotel booking and management system with guest bookings, admin dashboard, and bill generation.

---

## ✅ Prerequisites

Before starting, ensure you have:
- **Node.js** v18+ ([Download](https://nodejs.org/))
- **MySQL** Server 8.0+ ([Download](https://dev.mysql.com/downloads/mysql/))
- **npm** (comes with Node.js)

### Verify Installation
```bash
node --version    # Should be v18+
npm --version     # Should be v8+
mysql --version   # Should be 8.0+
```

---

## 🚀 Step 1: Database Setup

### 1.1 Create Database
```bash
mysql -u root -p
```

Enter your MySQL password, then run:
```sql
CREATE DATABASE aishwaryam_inn;
EXIT;
```

### 1.2 Import Database Schema
```bash
cd hotel_booking_system
mysql -u root -p aishwaryam_inn < database-schema.sql
```

Enter your MySQL password.

---

## ⚙️ Step 2: Environment Configuration

### 2.1 Server Configuration

Navigate to `server/` directory:
```bash
cd server
```

Copy the template file:
```bash
cp .env.example .env
```

Edit `.env` file with your credentials:
```properties
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password          ← Enter YOUR MySQL password
DB_NAME=aishwaryam_inn

# JWT Secrets (Generate new ones!)
JWT_SECRET=your_new_jwt_secret_32_chars_minimum
JWT_REFRESH_SECRET=your_new_jwt_refresh_secret_32_chars_minimum

# Email Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com           ← Your Gmail address
SMTP_PASSWORD=your_gmail_app_password    ← Gmail app-specific password
SMTP_FROM=your_email@gmail.com
ADMIN_EMAIL=admin@yourdomain.com

# Server & CORS
PORT=5000
NODE_ENV=production                      ← Change to production when live
CORS_ORIGIN=http://yourdomain.com,http://localhost:3000,http://localhost:3001

# URLs
API_URL=http://localhost:5000           ← Update when deployed
CLIENT_URL=http://localhost:3000        ← Update when deployed
ADMIN_URL=http://localhost:3001         ← Update when deployed
```

### 2.2 Admin Frontend Configuration

```bash
cd ../admin
cp .env.example .env
```

Edit `.env`:
```properties
VITE_API_URL=http://localhost:5000
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 2.3 Client Frontend Configuration

```bash
cd ../client
cp .env.example .env
```

Edit `.env`:
```properties
VITE_API_URL=http://localhost:5000
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 📦 Step 3: Install Dependencies

### 3.1 Backend Dependencies
```bash
cd server
npm install
```

### 3.2 Admin Frontend Dependencies
```bash
cd ../admin
npm install
```

### 3.3 Client Frontend Dependencies
```bash
cd ../client
npm install
```

---

## 🎯 Step 4: Start the Application

### **Option A: Development Mode** (for testing)

**Terminal 1 - Backend:**
```bash
cd server
npm start
# Backend running on http://localhost:5000
```

**Terminal 2 - Admin Frontend:**
```bash
cd admin
npm run dev
# Admin running on http://localhost:3001
```

**Terminal 3 - Client Frontend:**
```bash
cd client
npm run dev
# Client running on http://localhost:3000
```

### **Option B: Production Mode** (for deployment)

**Build for production:**
```bash
# Backend (no build needed for Node.js)
cd server
npm install --production

# Admin frontend
cd ../admin
npm run build
# Creates 'dist' folder with production files

# Client frontend
cd ../client
npm run build
# Creates 'dist' folder with production files
```

Then start server:
```bash
cd server
npm start
```

---

## 🌐 Access the Application

### Local Development
- **Guest Booking**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3001
- **API Server**: http://localhost:5000

### Login Credentials
**Admin Dashboard:**
- Username: (Email set in database)
- Password: (Use forgot password to reset)

**Guest Booking:**
- Uses OTP-based authentication
- No pre-registration needed

---

## 🔒 Gmail App Password Setup (Required for Email)

### Steps to Generate Gmail App Password:

1. Go to [Google Account](https://myaccount.google.com/)
2. Left sidebar → **Security**
3. Enable **2-Step Verification** (if not already enabled)
4. Search for **App passwords**
5. Select:
   - Device: Windows Computer (or your device)
   - App: Other (custom name)
6. Google will generate a 16-character password
7. Copy and paste into `.env` `SMTP_PASSWORD`

---

## 🗄️ Database Tables

The system automatically creates these tables:

### Core Tables
- `users` - Admin users
- `bookings` - Guest bookings
- `rooms` - Hotel rooms
- `guest_profiles` - Guest information
- `hotels` - Hotel details
- `payment_settings` - Payment configuration

### Support Tables
- `guest_otps` - OTP codes
- `guest_booking_sessions` - Session tracking
- `hotel_policies` - Hotel rules
- `site_content` - Website content
- `amenities` - Room amenities

---

## 🐛 Troubleshooting

### Port Already in Use

**Error:** `Port 5000 already in use`

**Solution:**
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Or change PORT in server/.env
PORT=5001
```

### Database Connection Error

**Error:** `Access denied for user 'root'@'localhost'`

**Solution:**
```bash
# Check MySQL is running
mysql -u root -p

# Verify credentials in server/.env
# Make sure password is correct
```

### Missing node_modules

**Error:** `Cannot find module 'express'`

**Solution:**
```bash
cd server
npm install

cd ../admin
npm install

cd ../client
npm install
```

### Email Not Sending

**Error:** `SMTP connection failed`

**Solution:**
- Check Gmail app password is 16 characters
- Verify 2-Step Verification is enabled
- Check SMTP_USER matches your Gmail
- Try: `SMTP_HOST=smtp.gmail.com` and `SMTP_PORT=587`

---

## 📁 Project Structure

```
hotel_booking_system/
├── server/                    # Node.js Backend
│   ├── controllers/          # Business logic
│   ├── routes/              # API endpoints
│   ├── models/              # Database models
│   ├── middleware/          # Auth & validation
│   ├── utils/               # Helper functions
│   ├── config/              # Database config
│   ├── uploads/             # User uploads
│   ├── .env.example         # Template
│   ├── server.js            # Main file
│   └── package.json
│
├── admin/                     # Admin Dashboard (React)
│   ├── src/
│   │   ├── pages/           # Admin pages
│   │   ├── components/      # Reusable components
│   │   ├── hooks/           # Custom hooks
│   │   └── App.jsx
│   ├── .env.example
│   └── package.json
│
├── client/                    # Guest Portal (React)
│   ├── src/
│   │   ├── pages/           # Booking pages
│   │   ├── components/      # UI components
│   │   └── App.jsx
│   ├── .env.example
│   └── package.json
│
├── README.md                  # Overview
├── ENV_CONFIGURATION.md       # Environment guide
├── PRODUCTION_READY.md        # Status report
└── database-schema.sql        # Database SQL
```

---

## 🚀 Deployment (Production)

### For AWS / Server Hosting:

1. **Upload code** to your server
2. **Install Node.js** on server
3. **Install MySQL** on server
4. **Set up environment** (.env with production values)
5. **Run database** migration
6. **Install PM2** for process management:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "hotel-api"
   pm2 startup
   pm2 save
   ```

### For Frontend Hosting (Vercel, Netlify):

1. Build production files:
   ```bash
   npm run build
   ```
2. Deploy `dist` folder to hosting service
3. Update `VITE_API_URL` to point to your production server

---

## 📞 Support & Features

### Guest Features
✅ OTP-based secure booking
✅ Real-time room availability
✅ Multiple room booking
✅ Automatic GST calculation (12%)
✅ Payment proof upload
✅ Bill download & email
✅ Booking cancellation

### Admin Features
✅ Dashboard with statistics
✅ Complete booking management
✅ Custom bill generation
✅ Room management
✅ Payment settings
✅ Guest management
✅ Email notifications
✅ Website content management

---

## ✅ Setup Checklist

- [ ] Node.js v18+ installed
- [ ] MySQL 8.0+ installed
- [ ] Database created
- [ ] Database schema imported
- [ ] `.env` files configured (server, admin, client)
- [ ] Gmail app password generated
- [ ] `npm install` run in all 3 directories
- [ ] Backend starts without errors
- [ ] Admin dashboard loads
- [ ] Guest portal loads
- [ ] Can send test email

---

## 🎓 Next Steps

1. Customize website content in Admin Dashboard
2. Add your hotel rooms and pricing
3. Configure payment settings
4. Test complete booking flow
5. Deploy to production server

---

## 📖 Additional Resources

- **Node.js Docs**: https://nodejs.org/docs/
- **React Docs**: https://react.dev/
- **Express Docs**: https://expressjs.com/
- **MySQL Docs**: https://dev.mysql.com/doc/

---

**Happy Booking! 🚀**

For issues or questions, refer to the logs in each terminal window.
