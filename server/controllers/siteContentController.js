import { executeQuery } from '../config/database.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// ==================== HERO SECTION ====================

export const getHeroContent = async (req, res) => {
  try {
    const results = await executeQuery(
      'SELECT * FROM website_hero WHERE isActive = 1 LIMIT 1'
    );
    
    const hero = results && results[0];
    
    if (!hero) {
      // Return default hero content instead of 404
      return res.json({ 
        success: true, 
        data: {
          title: 'Welcome to Aishwaryam Inn',
          subtitle: 'Experience luxury and comfort',
          ctaText: 'Book Now',
          ctaLink: '/booking'
        }
      });
    }

    res.json({ success: true, data: hero });
  } catch (error) {
    console.error('Error fetching hero content:', error);
    res.status(500).json({ message: 'Failed to fetch hero content', error: error.message });
  }
};

export const updateHeroContent = async (req, res, io) => {
  try {
    const {
      title,
      subtitle,
      primaryButtonText,
      primaryButtonLink,
      secondaryButtonText,
      secondaryButtonLink,
      backgroundType,
      backgroundVideoUrl,
      backgroundVideoEnabled,
      backgroundVideoLoop,
      overlayOpacity
    } = req.body;

    const updateFields = [];
    const values = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      values.push(title);
    }
    if (subtitle !== undefined) {
      updateFields.push('subtitle = ?');
      values.push(subtitle);
    }
    if (primaryButtonText !== undefined) {
      updateFields.push('primaryButtonText = ?');
      values.push(primaryButtonText);
    }
    if (primaryButtonLink !== undefined) {
      updateFields.push('primaryButtonLink = ?');
      values.push(primaryButtonLink);
    }
    if (secondaryButtonText !== undefined) {
      updateFields.push('secondaryButtonText = ?');
      values.push(secondaryButtonText);
    }
    if (secondaryButtonLink !== undefined) {
      updateFields.push('secondaryButtonLink = ?');
      values.push(secondaryButtonLink);
    }
    if (backgroundType !== undefined) {
      updateFields.push('backgroundType = ?');
      values.push(backgroundType);
    }
    if (backgroundVideoUrl !== undefined) {
      updateFields.push('backgroundVideoUrl = ?');
      values.push(backgroundVideoUrl);
    }
    if (backgroundVideoEnabled !== undefined) {
      updateFields.push('backgroundVideoEnabled = ?');
      values.push(backgroundVideoEnabled ? 1 : 0);
    }
    if (backgroundVideoLoop !== undefined) {
      updateFields.push('backgroundVideoLoop = ?');
      values.push(backgroundVideoLoop ? 1 : 0);
    }
    if (overlayOpacity !== undefined) {
      updateFields.push('overlayOpacity = ?');
      values.push(overlayOpacity);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const query = `UPDATE website_hero SET ${updateFields.join(', ')} WHERE isActive = 1`;
    await executeQuery(query, values);

    const [updatedHero] = await executeQuery('SELECT * FROM website_hero WHERE isActive = 1 LIMIT 1');
    
    // Emit Socket.io event to notify all clients of hero content update
    if (io) {
      io.emit('heroContentUpdated', { success: true, data: updatedHero });
      console.log('📡 Emitted heroContentUpdated event to all clients');
    }
    
    res.json({ 
      success: true, 
      message: 'Hero section updated successfully',
      data: updatedHero
    });
  } catch (error) {
    console.error('Error updating hero content:', error);
    res.status(500).json({ message: 'Failed to update hero content', error: error.message });
  }
};

// ==================== FEATURES ====================

export const getFeatures = async (req, res) => {
  try {
    // Get features for hotel ID 1 (main hotel)
    const features = await executeQuery(
      'SELECT id, title, description, icon, displayOrder FROM website_features WHERE hotelId = 1 AND isActive = 1 ORDER BY displayOrder ASC'
    );
    
    res.json({ success: true, data: features });
  } catch (error) {
    console.error('Error fetching features:', error);
    res.status(500).json({ message: 'Failed to fetch features', error: error.message });
  }
};

export const updateFeature = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, icon, displayOrder } = req.body;

    const updateFields = [];
    const values = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      values.push(description);
    }
    if (icon !== undefined) {
      updateFields.push('icon = ?');
      values.push(icon);
    }
    if (displayOrder !== undefined) {
      updateFields.push('displayOrder = ?');
      values.push(displayOrder);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE website_features SET ${updateFields.join(', ')} WHERE id = ?`;
    await executeQuery(query, values);

    const [updatedFeature] = await executeQuery('SELECT * FROM website_features WHERE id = ?', [id]);
    
    res.json({ 
      success: true, 
      message: 'Feature updated successfully',
      data: updatedFeature
    });
  } catch (error) {
    console.error('Error updating feature:', error);
    res.status(500).json({ message: 'Failed to update feature', error: error.message });
  }
};

export const createFeature = async (req, res) => {
  try {
    const { title, description, icon, displayOrder } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const result = await executeQuery(
      'INSERT INTO website_features (hotelId, title, description, icon, displayOrder) VALUES (?, ?, ?, ?, ?)',
      [1, title, description, icon || '🏨', displayOrder || 0]
    );

    const [newFeature] = await executeQuery('SELECT id, title, description, icon, displayOrder FROM website_features WHERE id = ?', [result.insertId]);
    
    res.status(201).json({ 
      success: true, 
      message: 'Feature created successfully',
      data: newFeature
    });
  } catch (error) {
    console.error('Error creating feature:', error);
    res.status(500).json({ message: 'Failed to create feature', error: error.message });
  }
};

export const deleteFeature = async (req, res) => {
  try {
    const { id } = req.params;
    
    await executeQuery('UPDATE website_features SET isActive = 0 WHERE id = ?', [id]);
    
    res.json({ 
      success: true, 
      message: 'Feature deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting feature:', error);
    res.status(500).json({ message: 'Failed to delete feature', error: error.message });
  }
};

// ==================== CONTACT INFO ====================

export const getContactInfo = async (req, res) => {
  try {
    const [contactInfo] = await executeQuery(
      'SELECT * FROM contact_info WHERE isActive = 1 LIMIT 1'
    );
    
    if (!contactInfo) {
      return res.status(404).json({ message: 'Contact info not found' });
    }

    res.json({ success: true, data: contactInfo });
  } catch (error) {
    console.error('Error fetching contact info:', error);
    res.status(500).json({ message: 'Failed to fetch contact info', error: error.message });
  }
};

export const updateContactInfo = async (req, res) => {
  try {
    const {
      phone, email, address, googleMapsLink,
      facebook, instagram, twitter, whatsapp
    } = req.body;

    const updateFields = [];
    const values = [];

    // Contact details
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      values.push(phone);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      values.push(email);
    }
    if (address !== undefined) {
      updateFields.push('address = ?');
      values.push(address);
    }
    if (googleMapsLink !== undefined) {
      updateFields.push('googleMapsLink = ?');
      values.push(googleMapsLink);
    }

    // Social media
    if (facebook !== undefined) {
      updateFields.push('facebook = ?');
      values.push(facebook);
    }
    if (instagram !== undefined) {
      updateFields.push('instagram = ?');
      values.push(instagram);
    }
    if (twitter !== undefined) {
      updateFields.push('twitter = ?');
      values.push(twitter);
    }
    if (whatsapp !== undefined) {
      updateFields.push('whatsapp = ?');
      values.push(whatsapp);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const query = `UPDATE contact_info SET ${updateFields.join(', ')} WHERE isActive = 1`;
    await executeQuery(query, values);

    const [updatedInfo] = await executeQuery('SELECT * FROM contact_info WHERE isActive = 1 LIMIT 1');
    
    res.json({ 
      success: true, 
      message: 'Contact information updated successfully',
      data: updatedInfo
    });
  } catch (error) {
    console.error('Error updating contact info:', error);
    res.status(500).json({ message: 'Failed to update contact info', error: error.message });
  }
};

// ==================== FAQs ====================

export const getFAQs = async (req, res) => {
  try {
    const { category } = req.query;
    
    let query = 'SELECT id, question, answer, category, displayOrder FROM website_faqs WHERE hotelId = 1 AND isActive = 1';
    const params = [];
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY displayOrder ASC';
    
    const faqs = await executeQuery(query, params);
    
    res.json({ success: true, data: faqs });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ message: 'Failed to fetch FAQs', error: error.message });
  }
};

export const createFAQ = async (req, res) => {
  try {
    const { question, answer, displayOrder, category } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ message: 'Question and answer are required' });
    }

    const result = await executeQuery(
      'INSERT INTO website_faqs (hotelId, question, answer, displayOrder, category) VALUES (?, ?, ?, ?, ?)',
      [1, question, answer, displayOrder || 0, category || 'general']
    );

    const [newFAQ] = await executeQuery('SELECT id, question, answer, category, displayOrder FROM website_faqs WHERE id = ?', [result.insertId]);
    
    res.status(201).json({ 
      success: true, 
      message: 'FAQ created successfully',
      data: newFAQ
    });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({ message: 'Failed to create FAQ', error: error.message });
  }
};

export const updateFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, displayOrder, category } = req.body;

    const updateFields = [];
    const values = [];

    if (question !== undefined) {
      updateFields.push('question = ?');
      values.push(question);
    }
    if (answer !== undefined) {
      updateFields.push('answer = ?');
      values.push(answer);
    }
    if (displayOrder !== undefined) {
      updateFields.push('displayOrder = ?');
      values.push(displayOrder);
    }
    if (category !== undefined) {
      updateFields.push('category = ?');
      values.push(category);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE website_faqs SET ${updateFields.join(', ')} WHERE id = ?`;
    await executeQuery(query, values);

    const [updatedFAQ] = await executeQuery('SELECT * FROM website_faqs WHERE id = ?', [id]);
    
    res.json({ 
      success: true, 
      message: 'FAQ updated successfully',
      data: updatedFAQ
    });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({ message: 'Failed to update FAQ', error: error.message });
  }
};

export const deleteFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    
    await executeQuery('UPDATE website_faqs SET isActive = 0 WHERE id = ?', [id]);
    
    res.json({ 
      success: true, 
      message: 'FAQ deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ message: 'Failed to delete FAQ', error: error.message });
  }
};

// ==================== CTA SECTIONS ====================

export const getCTA = async (req, res) => {
  try {
    const { section } = req.params;
    
    const [cta] = await executeQuery(
      'SELECT * FROM website_cta WHERE section = ? AND isActive = 1',
      [section]
    );
    
    if (!cta) {
      return res.status(404).json({ message: 'CTA section not found' });
    }

    res.json({ success: true, data: cta });
  } catch (error) {
    console.error('Error fetching CTA:', error);
    res.status(500).json({ message: 'Failed to fetch CTA', error: error.message });
  }
};

export const updateCTA = async (req, res) => {
  try {
    const { section } = req.params;
    const { title, subtitle, buttonText, buttonLink, backgroundColor } = req.body;

    const updateFields = [];
    const values = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      values.push(title);
    }
    if (subtitle !== undefined) {
      updateFields.push('subtitle = ?');
      values.push(subtitle);
    }
    if (buttonText !== undefined) {
      updateFields.push('buttonText = ?');
      values.push(buttonText);
    }
    if (buttonLink !== undefined) {
      updateFields.push('buttonLink = ?');
      values.push(buttonLink);
    }
    if (backgroundColor !== undefined) {
      updateFields.push('backgroundColor = ?');
      values.push(backgroundColor);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(section);
    const query = `UPDATE website_cta SET ${updateFields.join(', ')} WHERE section = ?`;
    await executeQuery(query, values);

    const [updatedCTA] = await executeQuery('SELECT * FROM website_cta WHERE section = ?', [section]);
    
    res.json({ 
      success: true, 
      message: 'CTA section updated successfully',
      data: updatedCTA
    });
  } catch (error) {
    console.error('Error updating CTA:', error);
    res.status(500).json({ message: 'Failed to update CTA', error: error.message });
  }
};

// ==================== VIDEO UPLOAD ====================

// Configure multer for video uploads
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/hero-videos';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `hero-video-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const videoFileFilter = (req, file, cb) => {
  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only video files (mp4, webm, ogg) are allowed'), false);
  }
};

export const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

export const handleVideoUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    const videoUrl = `/uploads/hero-videos/${req.file.filename}`;
    
    // Update hero section with new video URL
    await executeQuery(
      'UPDATE website_hero SET backgroundVideoUrl = ?, backgroundVideoEnabled = 1, backgroundType = ? WHERE isActive = 1',
      [videoUrl, 'video']
    );

    res.json({
      success: true,
      message: 'Video uploaded successfully',
      data: {
        videoUrl,
        filename: req.file.filename,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ message: 'Failed to upload video', error: error.message });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    const [hero] = await executeQuery('SELECT backgroundVideoUrl FROM website_hero WHERE isActive = 1');
    
    if (hero && hero.backgroundVideoUrl) {
      const filePath = path.join(process.cwd(), hero.backgroundVideoUrl);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      await executeQuery(
        'UPDATE website_hero SET backgroundVideoUrl = NULL, backgroundVideoEnabled = 0, backgroundType = ? WHERE isActive = 1',
        ['slider']
      );
    }

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ message: 'Failed to delete video', error: error.message });
  }
};
