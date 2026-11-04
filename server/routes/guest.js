import express from 'express';
import {
  sendBookingOTP,
  verifyOTP,
  createGuestBooking,
  createBookingWithPayment,
  retrieveBookings,
  sendForgotId,
  getBookingByConfirmation,
  sendBookingVoucherEmail
} from '../controllers/guestController.js';
import { uploadPaymentProof } from '../middleware/uploadPaymentProof.js';
import { uploadGuestProofs } from '../middleware/uploadGuestProofs.js';

const router = express.Router();

// POST /api/guest/send-otp - Send OTP for booking
router.post('/send-otp', sendBookingOTP);

// POST /api/guest/verify-otp - Verify OTP and get session token
router.post('/verify-otp', verifyOTP);

// POST /api/guest/create-booking - Create booking with verified session (accepts optional id proof)
router.post('/create-booking', uploadGuestProofs.single('proofFile'), createGuestBooking);

// POST /api/guest/create-booking-with-payment - Create booking with payment proof (supports paymentProof and id proof)
router.post('/create-booking-with-payment', uploadGuestProofs.fields([
  { name: 'paymentProof', maxCount: 1 },
  { name: 'proofFile', maxCount: 1 }
]), createBookingWithPayment);

// POST /api/guest/retrieve-bookings - Get bookings by unique ID
router.post('/retrieve-bookings', retrieveBookings);

// POST /api/guest/forgot-id - Send unique ID to email
router.post('/forgot-id', sendForgotId);

// GET /api/guest/booking/:confirmationNumber - Get booking by confirmation number
router.get('/booking/:confirmationNumber', getBookingByConfirmation);

// POST /api/guest/send-booking-email - Send booking voucher via email
router.post('/send-booking-email', sendBookingVoucherEmail);

export default router;
