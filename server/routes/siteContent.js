import express from 'express';
import * as siteContentController from '../controllers/siteContentController.js';
import * as videoController from '../controllers/videoController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Middleware to attach io instance
router.use((req, res, next) => {
  res.io = req.app.locals.io;
  next();
});

// ==================== HERO SECTION ====================
router.get('/hero', siteContentController.getHeroContent);
router.put('/hero', authenticate, (req, res) => {
  siteContentController.updateHeroContent(req, res, res.io);
});

// ==================== HOMEPAGE VIDEOS ====================
router.get('/videos', videoController.getHomepageVideos);
router.get('/videos/admin/all', authenticate, videoController.getAllVideos);
router.post('/videos', authenticate, videoController.videoUpload.single('video'), videoController.createVideo);
router.put('/videos/:id', authenticate, videoController.updateVideo);
router.delete('/videos/:id', authenticate, videoController.deleteVideo);
router.post('/videos/reorder', authenticate, videoController.reorderVideos);

// Video upload
router.post('/hero/video', 
  authenticate, 
  siteContentController.uploadVideo.single('video'),
  siteContentController.handleVideoUpload
);
router.delete('/hero/video', authenticate, siteContentController.deleteVideo);

// ==================== FEATURES ====================
router.get('/features', siteContentController.getFeatures);
router.post('/features', authenticate, siteContentController.createFeature);
router.put('/features/:id', authenticate, siteContentController.updateFeature);
router.delete('/features/:id', authenticate, siteContentController.deleteFeature);

// ==================== CONTACT INFO ====================
router.get('/contact', siteContentController.getContactInfo);
router.put('/contact', authenticate, siteContentController.updateContactInfo);

// ==================== FAQs ====================
router.get('/faqs', siteContentController.getFAQs);
router.post('/faqs', authenticate, siteContentController.createFAQ);
router.put('/faqs/:id', authenticate, siteContentController.updateFAQ);
router.delete('/faqs/:id', authenticate, siteContentController.deleteFAQ);

// ==================== CTA SECTIONS ====================
router.get('/cta/:section', siteContentController.getCTA);
router.put('/cta/:section', authenticate, siteContentController.updateCTA);

export default router;
