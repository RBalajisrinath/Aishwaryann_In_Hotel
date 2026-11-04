import express from 'express';
import multer from 'multer';
import * as adminController from '../controllers/adminController.js';
import * as authController from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Multer configuration for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    if (allowedTypes.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Role: super-admin (full system control)

// Admin Login (no authentication required)
router.post('/login', authController.login);

// Verify admin token
router.get('/verify', authenticate, (req, res) => {
  res.json({ 
    valid: true, 
    user: {
      id: req.user.userId,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Dashboard
router.get('/dashboard/stats', authenticate, adminController.getDashboardStats);

// User Management
router.get('/users', authenticate, adminController.getAllUsers);
router.get('/users/:userId', authenticate, adminController.getUserDetails);
router.put('/users/:userId/status', authenticate, adminController.updateUserStatus);
router.delete('/users/:userId', authenticate, adminController.deleteUser);

// Hotel Management
router.get('/hotels', authenticate, adminController.getAllHotels);
router.put('/hotels/:hotelId', authenticate, adminController.updateHotel);

// Room Management
router.get('/rooms', authenticate, adminController.getAllRooms);
router.post('/rooms', authenticate, upload.single('image'), adminController.addRoom);
router.put('/rooms/:roomId', authenticate, upload.single('image'), adminController.updateRoom);
router.delete('/rooms/:roomId/image', authenticate, adminController.removeRoomImage);

// Amenities Management
router.get('/amenities', authenticate, adminController.getAllAmenities);
router.get('/amenities/by-category', authenticate, adminController.getAmenitiesByCategory);
router.post('/amenities', authenticate, adminController.createAmenity);
router.put('/amenities/:amenityId', authenticate, adminController.updateAmenity);
router.delete('/amenities/:amenityId', authenticate, adminController.deleteAmenity);

// Booking Management
router.get('/bookings', authenticate, adminController.getAllBookings);
router.get('/bookings/search/:bookingId', authenticate, adminController.searchBookingById);
router.put('/bookings/:bookingId', authenticate, adminController.updateBooking);
router.post('/bookings/:bookingId/checkout', authenticate, adminController.checkoutBooking);
router.get('/bookings/:bookingId/download', authenticate, adminController.getBookingDownload);
router.get('/bookings/:bookingId/package', authenticate, adminController.getBookingPackage);
router.delete('/bookings/:bookingId', authenticate, adminController.deleteBooking);

// Guest/Client Management
router.get('/guests', authenticate, adminController.getAllGuests);
router.get('/guests/:guestId', authenticate, adminController.getGuestDetails);
router.get('/guests/email/:email', authenticate, adminController.getGuestByEmail);

// Reports
router.get('/reports/revenue', authenticate, adminController.getRevenueReport);
router.get('/reports/occupancy', authenticate, adminController.getOccupancyReport);

// Website Status Management
router.get('/website/status', authenticate, adminController.getWebsiteStatus);
router.put('/website/status', authenticate, adminController.updateWebsiteStatus);
router.post('/website/close', authenticate, adminController.closeWebsite);
router.post('/website/open', authenticate, adminController.openWebsite);
router.post('/website/toggle', authenticate, adminController.toggleWebsite);

// Backward compatibility aliases for website status
router.get('/status', authenticate, adminController.getWebsiteStatus);
router.put('/status', authenticate, adminController.updateWebsiteStatus);

// Billing features removed

// Admin Profile Management
router.get('/profile', authenticate, adminController.getAdminProfile);
router.put('/profile', authenticate, adminController.updateAdminProfile);
router.put('/profile/update', authenticate, adminController.updateAdminProfile);

// Reviews Management
router.get('/reviews/all', authenticate, adminController.getAllReviews);
router.get('/ratings', authenticate, adminController.getAllReviews); // Alias for ratings
router.put('/reviews/:reviewId/approve', authenticate, adminController.approveReview);
router.put('/reviews/:reviewId/reject', authenticate, adminController.rejectReview);
router.delete('/reviews/:reviewId', authenticate, adminController.deleteReview);
router.delete('/ratings/:reviewId', authenticate, adminController.deleteReview); // Alias for ratings

// Bill template features removed

// Hotel Policies Management
router.get('/policies/:hotelId?', authenticate, adminController.getHotelPolicies);
router.put('/policies/:hotelId/:policyType', authenticate, adminController.updateHotelPolicy);
router.get('/policies/active/current', authenticate, adminController.getActivePolicyType);

// Payment Approval Management (Manual Payment Workflow)
router.get('/pending-approvals', authenticate, adminController.getPendingApprovals);
router.put('/approve/:bookingId', authenticate, adminController.approveBooking);
router.put('/reject/:bookingId', authenticate, adminController.rejectBooking);

// Payment Settings Management
router.put('/payment-settings/:hotelId', authenticate, adminController.updatePaymentSettings);

export default router;
