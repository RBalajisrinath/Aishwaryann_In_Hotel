# Hostinger Deployment Guide

## Quick Start - SQL Setup on Hostinger

### Step 1: Access Hostinger MySQL
1. Log in to Hostinger cPanel
2. Navigate to **phpMyAdmin**
3. Create a new database (name it: `hotel_db`)
4. Select the database

### Step 2: Import SQL Schema
1. Click **Import** tab
2. Upload `hotel_complete_schema.sql`
3. Click **Go** to execute
4. All tables will be created automatically ✓

### Step 3: Database Connection Details
Add to your `.env` file:

```env
DB_HOST=your-hostinger-db-host
DB_PORT=3306
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=hotel_db
```

### Step 4: Verify Tables
Run this query in phpMyAdmin:
```sql
SHOW TABLES;
```

You should see 14 tables created.

---

## Database Tables Created

| # | Table Name | Purpose |
|---|------------|---------|
| 1 | `users` | Admin and user accounts |
| 2 | `hotels` | Hotel information |
| 3 | `rooms` | Room inventory |
| 4 | `payment_settings` | Payment configuration (Real-Time) |
| 5 | `guest_profiles` | Guest information |
| 6 | `bookings` | Booking records |
| 7 | `db_events` | Real-Time event tracking |
| 8 | `otp_sessions` | OTP authentication |
| 9 | `gallery` | Hotel images |
| 10 | `ratings_reviews` | Guest reviews |
| 11 | `amenities` | Hotel amenities |
| 12 | `policies` | Hotel policies |
| 13 | `website_*` | Website content (5 sub-tables) |
| 14 | `website_status` | Website maintenance mode |

---

## Real-Time Features Enabled

✅ **Payment Settings Real-Time Sync**
- Table: `payment_settings`
- Event tracking: `db_events` table
- Automatic triggers for updates

✅ **Live Event Logging**
- All changes logged to `db_events`
- Used for real-time WebSocket broadcasts
- Tracks INSERT, UPDATE, DELETE actions

✅ **OTP Session Management**
- Temporary OTP storage
- Auto-expiration support
- Guest authentication

---

## Key Features in Schema

### 1. **Real-Time Payment Settings**
```sql
-- All changes to payment_settings trigger db_events recording
-- Socket.io server polls db_events and broadcasts changes
-- Guests receive updates instantly
```

### 2. **Booking Workflow**
```
Guest Books → Payment Pending → Admin Approves → Booking Confirmed
```

### 3. **GST Support**
- Inclusive mode: GST included in price
- Exclusive mode: GST added to price
- Per-room and per-hotel settings

### 4. **Partial Payment Support**
- Admin sets percentage (default 50%)
- Guests can pay advance or full
- Tracking of payment amounts

---

## Hostinger PHP Version Requirements

✅ Minimum: PHP 7.4  
✅ Recommended: PHP 8.0+

Check compatibility:
```php
<?php
echo phpversion(); // Should show 7.4 or higher
?>
```

---

## Node.js Server on Hostinger

Hostinger doesn't support Node.js directly on shared hosting.

**Options:**

### Option 1: Use Hostinger VPS (Recommended)
- Upgrade to Hostinger VPS or Business hosting
- Deploy Node.js server
- Use MySQL database from Hostinger

### Option 2: Use Separate Node.js Hosting
- Keep MySQL on Hostinger
- Deploy Node.js to Heroku, Railway, Vercel, or AWS
- Connect to Hostinger MySQL

---

## Backup & Maintenance

### Weekly Backups
```sql
-- Export database from phpMyAdmin
-- Store locally and in cloud
```

### Cleanup Old OTP Sessions
```sql
DELETE FROM otp_sessions 
WHERE expiresAt < NOW();
```

### Archive Old Events
```sql
-- Keep last 30 days, archive older events
DELETE FROM db_events 
WHERE createdAt < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

---

## Security Checklist

- [ ] Change MySQL password in Hostinger
- [ ] Add database backups schedule
- [ ] Enable SSL/TLS for database connection
- [ ] Update `.env` file with credentials
- [ ] Never commit `.env` to git
- [ ] Use strong admin password
- [ ] Regular database maintenance

---

## Troubleshooting

### "Tables already exist" error
- Drop existing tables first, OR
- Use separate database name

### "Connection refused"
- Check DB_HOST is correct
- Verify Hostinger firewall allows connection
- Confirm credentials are accurate

### Slow queries
- Check indexes are created
- Run `ANALYZE TABLE` on large tables
- Optimize old data

---

## File Structure for Hostinger

```
hotel/
├── hotel_complete_schema.sql     ← Import this to create tables
├── server/
│   ├── config/
│   │   ├── config.js
│   │   └── database.js          ← Update with Hostinger credentials
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   └── server.js
├── client/                        ← Deploy to separate frontend hosting
├── admin/                         ← Deploy to separate frontend hosting
└── .env                          ← Add Hostinger DB credentials
```

---

**Status:** ✅ Production Ready  
**Last Updated:** November 2, 2025  
**Database Version:** MySQL 5.7+
