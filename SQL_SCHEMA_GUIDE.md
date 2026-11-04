# Complete SQL Schema - Ready for Production

## 📋 Overview

The **`hotel_complete_schema.sql`** file (19.57 KB) contains a complete production-ready database schema for the hotel booking system with real-time support.

---

## ✅ What's Included

### 14 Database Tables

1. **users** - Admin and user authentication
2. **hotels** - Hotel information and details
3. **rooms** - Room inventory and pricing
4. **payment_settings** - Payment configuration ⭐ Real-Time
5. **guest_profiles** - Guest information and ID proofs
6. **bookings** - Booking records and status
7. **db_events** - Real-time event tracking ⭐ Real-Time
8. **otp_sessions** - OTP-based authentication
9. **gallery** - Hotel images and media
10. **ratings_reviews** - Guest reviews and ratings
11. **amenities** - Hotel amenities and features
12. **policies** - Hotel policies and rules
13. **website_hero** - Homepage hero section
14. **website_features** - Feature highlights
15. **website_faqs** - FAQ content
16. **contact_info** - Contact information
17. **website_cta** - Call-to-action buttons
18. **website_status** - Website maintenance mode

---

## 🚀 Quick Deployment to Hostinger

### Method 1: Direct Import (Easiest)

1. **Log in to Hostinger cPanel**
2. Open **phpMyAdmin**
3. Create new database: `hotel_db`
4. Click **Import** tab
5. Upload `hotel_complete_schema.sql`
6. Click **Go**
7. ✅ All tables created!

### Method 2: Manual via SSH

```bash
# SSH into Hostinger server
ssh user@hostinger-server

# Create database
mysql -u root -p
CREATE DATABASE hotel_db;
USE hotel_db;
SOURCE /path/to/hotel_complete_schema.sql;
EXIT;
```

### Method 3: Via Node.js Script

```javascript
const mysql = require('mysql2/promise');
const fs = require('fs');

async function setupDatabase() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'your_password'
  });

  const schema = fs.readFileSync('hotel_complete_schema.sql', 'utf8');
  const queries = schema.split(';').filter(q => q.trim());
  
  for (const query of queries) {
    await connection.execute(query);
  }
  
  console.log('✅ Database setup complete!');
  connection.end();
}

setupDatabase().catch(err => console.error(err));
```

---

## 📊 Database Schema Details

### Real-Time Features

#### Payment Settings Real-Time Sync
```sql
-- When admin changes payment settings
UPDATE payment_settings SET paymentUpiId = 'new@upi' WHERE hotelId = 1;

-- Trigger automatically records to db_events
-- Server reads db_events and broadcasts via Socket.io
-- All guests receive update instantly
```

#### Event Tracking
```sql
-- db_events table records all changes
-- Fields: eventType, tableName, action (INSERT/UPDATE/DELETE)
-- Used for real-time synchronization
```

### Indexes for Performance

```sql
-- Fast lookups for common queries
-- Payment settings updates tracked
-- Booking status queries optimized
-- OTP session cleanup efficient
-- Real-time events retrieval fast
```

### Foreign Key Constraints

```sql
-- Data integrity maintained
-- Cascading deletes handled
-- Referential integrity enforced
```

---

## 💾 Table Descriptions

### 1. users
- Admin and user accounts
- Roles: user, super-admin, admin
- Status tracking: active, inactive, suspended

### 2. hotels
- Hotel information and metadata
- Check-in/check-out times
- Image storage for hotel photos
- Status management

### 3. rooms
- Room inventory
- Pricing per night
- Capacity limits
- GST configuration
- Amenities list (JSON)

### 4. payment_settings ⭐ Real-Time
- Payment phone and UPI ID
- Partial payment configuration
- GST settings (inclusive/exclusive)
- Terms and conditions
- Auto-approval settings

### 5. guest_profiles
- Guest contact information
- ID proof details
- Reusable guest profiles
- Unique ID tracking

### 6. bookings
- Complete booking records
- Guest-to-room assignment
- Date ranges
- Payment status
- Approval status
- Booking status lifecycle

### 7. db_events ⭐ Real-Time
- Records all database changes
- Event type and action tracking
- Old and new values (JSON)
- Processing status
- Used for real-time broadcasting

### 8. otp_sessions
- OTP verification
- Attempt tracking
- Expiration management
- Session verification

### 9. gallery
- Hotel images
- Media categorization
- Display ordering

### 10. ratings_reviews
- Guest ratings (1-5 stars)
- Multiple rating dimensions
- Review content
- Status management

### 11. amenities
- Hotel amenities list
- Categorization
- Icon support
- Availability status

### 12. policies
- Hotel policies
- Policy types (cancellation, check-in, etc.)
- Active/inactive status

### 13-18. Website Content Tables
- Hero section
- Features
- FAQs
- Contact info
- CTAs
- Website status (maintenance mode)

---

## 🔒 Security Features

✅ **Password Hashing** - Passwords stored as bcrypt hashes (application level)  
✅ **Foreign Key Constraints** - Data integrity enforced  
✅ **Role-Based Access** - Different user roles (user, admin, super-admin)  
✅ **Status Tracking** - User and hotel status monitoring  
✅ **OTP Authentication** - Secure guest authentication  
✅ **UUID Support** - For unique user identification  

---

## 📈 Performance Optimizations

### Indexes Created
```
- Payment settings queries: Indexed by hotelId
- Booking queries: Indexed by date ranges, status
- OTP cleanup: Indexed by expiration
- Real-time events: Indexed by processed status
- Gallery queries: Indexed by hotel and category
```

### Query Optimization Tips
```sql
-- Fast payment settings lookup
SELECT * FROM payment_settings WHERE hotelId = 1;

-- Fast booking search by date
SELECT * FROM bookings WHERE checkInDate >= '2025-01-01';

-- Fast pending approval lookup
SELECT * FROM bookings WHERE adminApprovalStatus = 'pending';
```

---

## 🔄 Real-Time Synchronization Flow

```
1. Admin updates payment settings
   ↓
2. UPDATE query executes on payment_settings table
   ↓
3. Trigger fires automatically
   ↓
4. db_events table receives INSERT
   ↓
5. Server polls db_events table
   ↓
6. Socket.io broadcasts to all clients
   ↓
7. Guests receive update in real-time
   ↓
8. Guest UI updates without page refresh
```

---

## 🛠️ Maintenance Tasks

### Weekly
```sql
-- Cleanup expired OTP sessions
DELETE FROM otp_sessions WHERE expiresAt < NOW();

-- Archive old events (keep 30 days)
DELETE FROM db_events WHERE createdAt < DATE_SUB(NOW(), INTERVAL 30 DAY) AND processed = TRUE;
```

### Monthly
```sql
-- Optimize tables
OPTIMIZE TABLE bookings;
OPTIMIZE TABLE db_events;
OPTIMIZE TABLE payment_settings;

-- Analyze queries
ANALYZE TABLE bookings;
```

### Backup
```bash
# Regular backup
mysqldump -u root -p hotel_db > hotel_db_backup_$(date +%Y%m%d).sql

# Restore from backup
mysql -u root -p hotel_db < hotel_db_backup_20250102.sql
```

---

## ⚠️ Important Notes

1. **First Run:** Import the SQL file only ONCE
2. **Idempotent:** Uses `IF NOT EXISTS` to prevent errors on re-run
3. **Default Data:** Includes default hotel and payment settings
4. **Triggers:** Enabled by default for real-time event logging
5. **Encoding:** UTF-8 for international support
6. **Engine:** InnoDB for transaction support

---

## 🚨 Troubleshooting

### "Error 1050: Table already exists"
```bash
# Solution: Drop existing tables first
DROP DATABASE hotel_db;
CREATE DATABASE hotel_db;
# Then import again
```

### "No database selected"
```sql
-- Solution: Create and select database first
CREATE DATABASE IF NOT EXISTS hotel_db;
USE hotel_db;
-- Then run schema
```

### "Trigger syntax error"
```sql
-- Solution: Check MySQL version (5.7+)
SELECT VERSION();
-- Triggers need MySQL 5.0+
```

### Slow queries
```sql
-- Check indexes
SHOW INDEX FROM bookings;

-- Rebuild indexes if needed
OPTIMIZE TABLE bookings;
```

---

## 📊 Statistics

| Metric | Value |
|--------|-------|
| Total Tables | 18 |
| Total Columns | 180+ |
| Indexes | 35+ |
| Triggers | 1 (payment_settings) |
| Default Records | 3 |
| File Size | 19.57 KB |
| Estimated DB Size | < 50 MB (empty) |

---

## ✅ Verification Checklist

After importing, verify:

```sql
-- Should return 18
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'hotel_db';

-- Should show all tables
SHOW TABLES;

-- Should show default hotel
SELECT * FROM hotels WHERE id = 1;

-- Should show default payment settings
SELECT * FROM payment_settings WHERE hotelId = 1;

-- Should show default website status
SELECT * FROM website_status WHERE hotelId = 1;
```

---

## 🎯 Next Steps

1. ✅ Import `hotel_complete_schema.sql` via phpMyAdmin
2. ✅ Verify all 18 tables created
3. ✅ Test database connection from Node.js
4. ✅ Update `.env` with Hostinger credentials
5. ✅ Deploy backend server
6. ✅ Deploy frontend client
7. ✅ Deploy admin panel
8. ✅ Test real-time payment sync

---

**Status:** ✅ Production Ready  
**Version:** 1.0  
**Last Updated:** November 2, 2025  
**Hostinger Compatible:** Yes  
**MySQL Version:** 5.7+
