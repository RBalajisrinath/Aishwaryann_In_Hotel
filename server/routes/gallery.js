import express from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  uploadYearCard,
  getAllYearCards,
  getYearCardById,
  updateYearCard,
  reorderYearCards,
  deleteYearCard
} from '../controllers/galleryController.js';

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

// Public routes
router.get('/year-cards', getAllYearCards);
router.get('/year-cards/:cardId', getYearCardById);

// Admin routes
router.post('/year-cards/upload', authenticate, upload.single('image'), uploadYearCard);
router.put('/year-cards/:cardId', authenticate, upload.single('image'), updateYearCard);
router.post('/year-cards/reorder', authenticate, reorderYearCards);
router.delete('/year-cards/:cardId', authenticate, deleteYearCard);

export default router;
