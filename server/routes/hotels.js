import express from 'express';
import * as hotelController from '../controllers/hotelController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/all', hotelController.getAllHotels);
router.get('/search', hotelController.searchHotels);
router.get('/:hotelId', hotelController.getHotelById);
router.get('/:hotelId/rooms/:roomId', hotelController.getRoomById);
router.get('/:roomId/check-availability', hotelController.checkRoomAvailability);
router.get('/:hotelId/policies', hotelController.getHotelPolicies);
router.get('/:hotelId/payment-settings', hotelController.getPaymentSettings);

// Room image endpoint - must be before other parameterized routes
router.get('/room-image/:roomId', hotelController.getRoomImage);

// Admin routes
router.post('/create', authenticate, authorize(['admin']), hotelController.createHotel);
router.post('/room/create', authenticate, authorize(['admin']), hotelController.createRoom);

export default router;
