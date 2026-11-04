import express from 'express';
import * as bookingController from '../controllers/bookingController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', authenticate, bookingController.createBooking);
router.get('/my-bookings', authenticate, bookingController.getMyBookings);
router.get('/:bookingId', authenticate, bookingController.getBookingById);
router.post('/:bookingId/cancel', authenticate, bookingController.cancelBooking);
router.put('/:bookingId/status', authenticate, authorize(['admin']), bookingController.updateBookingStatus);
router.get('/stats/overview', authenticate, authorize(['admin']), bookingController.getBookingStats);

export default router;
