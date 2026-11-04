# Aishwaryam Inn - Admin Panel User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Room Management](#room-management)
4. [Booking Management](#booking-management)
5. [User Management](#user-management)
6. [Amenities Management](#amenities-management)
7. [Ratings & Reviews](#ratings--reviews)
8. [Gallery Management](#gallery-management)
9. [Billing Management](#billing-management)
10. [Website Content Management](#website-content-management)
11. [Payment Settings](#payment-settings)
12. [Hotel Policies](#hotel-policies)
13. [Website Status](#website-status)
14. [Profile Management](#profile-management)
15. [Security & Logout](#security--logout)

---

## Getting Started

### Login to Admin Panel
1. Navigate to `https://aishwaryaminn.cloud/admin`
2. Enter your email and password
3. Click **Login**
4. You will be redirected to the Dashboard

### Session Timeout
- **Inactivity Timeout**: 2 minutes
- **Warning**: You'll receive a warning 30 seconds before logout
- Click **"Stay Logged In"** to continue working or **"Logout Now"** to exit

---

## Dashboard Overview

The dashboard displays key metrics about your hotel:

### Key Metrics
- **Total Bookings**: Total number of bookings received
- **Total Revenue**: Total income from completed payments
- **Occupancy Rate**: Percentage of rooms currently occupied
- **Active Bookings**: Number of confirmed and checked-in bookings
- **Available Rooms**: Number of rooms available for booking
- **Total Users**: Total registered guests
- **Average Rating**: Guest satisfaction rating

### Real-time Updates
The dashboard updates in real-time when new bookings are made or statuses change.

---

## Room Management

### View All Rooms
1. Click **"Rooms"** in the sidebar
2. See list of all room types with:
   - Room type name
   - Total availability count
   - Price per night
   - Capacity
   - Extra adult charge
   - Current status

### Add New Room
1. Click **"Add Room"** button
2. Fill in details:
   - **Room Type**: Name of room (e.g., "Deluxe Suite")
   - **Description**: Room features and amenities
   - **Capacity**: Number of guests (default: 2)
   - **Price Per Night**: Base room rate
   - **Extra Adult Charge**: Additional charge per extra guest
   - **Availability**: Number of rooms of this type
   - **Amenities**: Select from available amenities
   - **Room Image**: Upload a high-quality room photo
3. Click **"Add Room"**

### Edit Room
1. Click the room row or **Edit** button
2. Modify details
3. Click **"Update Room"**

### Delete Room
1. Click **Delete** button on room row
2. Confirm deletion

### Upload Room Images
- Supported formats: JPEG, JPG, PNG, WebP
- Maximum size: 5MB
- Best dimensions: 1920x1280px

---

## Booking Management

### View All Bookings
1. Click **"Bookings"** in the sidebar
2. See all guest bookings with:
   - Booking ID
   - Guest name and email
   - Room type and check-in/out dates
   - Booking status
   - Payment status
   - Total price

### Booking Statuses
- **Pending**: Awaiting confirmation
- **Confirmed**: Booking approved
- **Checked In**: Guest has arrived
- **Checked Out**: Guest has left
- **Cancelled**: Booking cancelled

### Search Booking
1. Use the search bar to find booking by Booking ID
2. Results show instantly

### Approve Pending Booking
1. Click on a "Pending" booking
2. Review guest details and payment proof
3. Click **"Approve Booking"**
4. Guest receives confirmation email

### Reject Booking
1. Click on a "Pending" booking
2. Click **"Reject"**
3. Enter rejection reason
4. Guest receives rejection email

### Check In Guest
1. Find the confirmed booking
2. Click **"Check In"**
3. Mark room as occupied

### Check Out Guest
1. Find the checked-in booking
2. Click **"Check Out"**
3. Generate final bill if needed

### Download Booking Package
1. Click on any booking
2. Click **"Download Package"** button
3. ZIP file contains:
   - Booking confirmation
   - Guest details
   - Payment proof
   - ID proof

---

## User Management

### View All Users
1. Click **"Users"** in the sidebar
2. See all registered guests with:
   - Username
   - Email
   - Phone number
   - Registration date
   - Last login
   - Account status

### Update User Status
1. Click on user row
2. Change status:
   - **Active**: User can book
   - **Inactive**: User cannot book
   - **Suspended**: User account suspended
3. Click **"Update"**

### Delete User
1. Click **"Delete"** on user row
2. Confirm deletion
3. User account is permanently removed

### View User Bookings
1. Click on user name
2. See complete booking history
3. View booking details and status

---

## Amenities Management

### View All Amenities
1. Click **"Amenities"** in the sidebar
2. See all available amenities organized by category:
   - WiFi
   - Parking
   - Swimming Pool
   - Gym
   - Restaurant
   - etc.

### Add New Amenity
1. Click **"Add Amenity"** button
2. Fill in:
   - **Amenity Name**: e.g., "Free WiFi"
   - **Category**: Select category
   - **Description**: Brief description
3. Click **"Add"**

### Edit Amenity
1. Click amenity row
2. Modify details
3. Click **"Update"**

### Delete Amenity
1. Click **"Delete"** on amenity row
2. Confirm deletion

### Assign Amenities to Rooms
1. Go to Room Management
2. Edit a room
3. Check amenities to assign
4. Save changes

---

## Ratings & Reviews

### View All Reviews
1. Click **"Ratings & Reviews"** in the sidebar
2. See guest reviews with:
   - Guest name
   - Rating (1-5 stars)
   - Review text
   - Date posted
   - Room type reviewed

### Filter Reviews
- Filter by rating (1-5 stars)
- Filter by date range
- Sort by newest/oldest

### Delete Review
1. Click **"Delete"** on review row
2. Confirm deletion
3. Review is removed from public display

### Respond to Review
- Feature coming soon for direct guest communication

---

## Gallery Management

### View Gallery
1. Click **"Gallery"** in the sidebar
2. See all uploaded images with:
   - Thumbnail preview
   - Upload date
   - Image type (room, exterior, amenity)

### Upload Images
1. Click **"Add Images"** button
2. Select multiple images
3. Supported formats: JPEG, JPG, PNG, WebP
4. Max size: 5MB per image
5. Click **"Upload"**

### Delete Image
1. Click **"Delete"** on image
2. Confirm deletion
3. Image is removed from gallery

### Reorder Gallery
1. Click **"Reorder"** button
2. Drag images to new positions
3. Click **"Save Order"**

---

## Billing Management

### View Bills
1. Click **"Billing"** in the sidebar
2. See all generated bills with:
   - Bill number
   - Guest name
   - Amount
   - Date generated
   - Status

### Create Bill Template
1. Click **"Bill Templates"** tab
2. Click **"Create New Template"**
3. Enter template details:
   - Hotel name and logo
   - Address
   - Contact info
   - Tax settings
4. Save template

### Generate Bill
1. Select a booking
2. Click **"Generate Bill"**
3. Bill auto-populates with:
   - Room charges
   - Extra services
   - Taxes (if applicable)
   - Total amount
4. Click **"Download"** to get PDF

### Edit Bill
1. Click on bill row
2. Modify charges if needed
3. Click **"Save"**

### GST Settings
- Enable/disable GST
- Set GST percentage (typically 5%, 12%, or 18%)
- Choose: Inclusive or Exclusive

---

## Website Content Management

### Manage Videos
1. Click **"Gallery & Videos"** in the sidebar
2. Go to **"Videos"** tab

#### Add Video
1. Click **"Add Video"**
2. Upload video or paste YouTube link
3. Add title and description
4. Set as hero video if needed
5. Click **"Save"**

#### Edit Video
1. Click video row
2. Modify details
3. Click **"Update"**

#### Delete Video
1. Click **"Delete"** on video
2. Confirm

#### Reorder Videos
1. Click **"Reorder Videos"**
2. Drag to arrange
3. Click **"Save"**

### Manage FAQs
1. Click **"Website Content"** in the sidebar
2. Go to **"FAQs"** tab

#### Add FAQ
1. Click **"Add FAQ"**
2. Enter question and answer
3. Click **"Save"**

#### Edit FAQ
1. Click FAQ row
2. Modify text
3. Click **"Update"**

#### Delete FAQ
1. Click **"Delete"** on FAQ
2. Confirm

---

## Payment Settings

### Configure Payment Methods
1. Click **"Payment Settings"** in the sidebar
2. Select payment option:
   - Bank Transfer
   - Card Payment
   - UPI
   - Cash on Arrival

### Bank Details
1. Enter bank account number
2. Enter IFSC code
3. Enter account holder name
4. Save

### Card Payment
1. Enable card payments
2. Configure payment gateway (Razorpay, Stripe)
3. Enter API keys
4. Test payment

### UPI Details
1. Enter UPI ID
2. Enter merchant name
3. Save

### Manual Payment Approval
1. Click **"Pending Approvals"** tab
2. Review payment proofs
3. Click **"Approve"** or **"Reject"**
4. Send notification to guest

---

## Hotel Policies

### View Policies
1. Click **"Policies"** in the sidebar
2. See all hotel policies:
   - Cancellation policy
   - Check-in/out times
   - ID requirements
   - Pet policy
   - etc.

### Edit Policy
1. Click policy row
2. Modify text
3. Click **"Update"**

### Policy Types
- **Cancellation**: Refund conditions
- **Check-in/out**: Time requirements
- **ID Requirement**: Required documents
- **Pets**: Pet policies
- **Guest Conduct**: House rules

---

## Website Status

### Maintenance Mode
1. Click **"Website Status"** in the sidebar
2. Toggle **"Website Status"**
   - **Online**: Website is active
   - **Offline**: Show maintenance page

### Maintenance Message
1. Click **"Edit Message"**
2. Enter custom maintenance message
3. Choose maintenance type:
   - Scheduled maintenance
   - Emergency maintenance
   - System upgrade
4. Set estimated downtime
5. Click **"Save"**

### Notification
Guests see maintenance message and can:
- Sign up for notifications
- View estimated reopening time

---

## Profile Management

### Update Admin Profile
1. Click **"Profile"** in the sidebar
2. Update information:
   - Name
   - Email
   - Phone
   - Avatar/Photo
3. Click **"Save Changes"**

### Change Password
1. Click **"Security"** tab
2. Enter current password
3. Enter new password
4. Confirm new password
5. Click **"Update Password"**

### Two-Factor Authentication
- Feature coming soon

---

## Security & Logout

### Session Management
- **Session Timeout**: 2 minutes of inactivity
- **Warning**: 30-second countdown before auto-logout
- Click **"Stay Logged In"** to extend session

### Manual Logout
1. Click **"Logout"** button in top navigation
2. Confirm logout
3. Redirected to login page

### Security Tips
✓ Always logout when leaving your computer
✓ Don't share login credentials
✓ Use strong passwords (min 8 characters)
✓ Clear browser cache if using shared computer
✓ Never click links in suspicious emails
✓ Keep email account secure (recovery option)

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` | Search |
| `Ctrl + L` | Logout |
| `Esc` | Close modals |
| `Enter` | Submit forms |

---

## Troubleshooting

### Can't Login
- Verify email is correct
- Reset password if forgotten
- Clear browser cache
- Try different browser

### Dashboard Not Loading
- Refresh page (Ctrl+F5)
- Check internet connection
- Clear cache and cookies
- Contact support

### Image Upload Failing
- Check file size (max 5MB)
- Verify file format (JPG, PNG, WebP)
- Try different image
- Check browser storage space

### Session Expired
- Login again
- Check internet connection
- Verify server is online

### Bookings Not Appearing
- Refresh page
- Check date filters
- Verify booking status
- Clear cache

---

## Support & Contact

For technical support:
- **Email**: aishwaryaminn@gmail.com
- **Phone**: +91 9443224498
- **Hours**: 24/7 for emergencies

---

## Version History

**v1.0** (November 2025)
- Initial admin panel release
- Full room, booking, and user management
- Payment and billing features
- Website content management
- Real-time dashboard

---

**Last Updated**: November 20, 2025
**Document Version**: 1.0

---
