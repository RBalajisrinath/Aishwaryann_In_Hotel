import { YearCard } from '../models/index.js';
import { executeQuery } from '../config/database.js';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = 'uploads/yearCards';

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const uploadYearCard = async (req, res) => {
  try {
    const { year, title, description, section } = req.body;
    const userId = req.user.id;

    if (!year || !title) {
      return res.status(400).json({ message: 'Year and title are required' });
    }

    let imageUrl = null;
    let imageBase64 = null;

    // Handle file upload
    if (req.file) {
      // Image size validation
      const maxSizeKB = 300; // 300KB limit
      const maxSizeBytes = maxSizeKB * 1024;
      
      if (req.file.size > maxSizeBytes) {
        const sizeKB = Math.round(req.file.size / 1024);
        return res.status(400).json({ 
          message: `Image too large: ${req.file.size} bytes (${sizeKB}KB). Maximum allowed: ${maxSizeKB}KB` 
        });
      }

      const filename = `${year}-${Date.now()}-${req.file.originalname}`;
      const filepath = path.join(UPLOAD_DIR, filename);
      
      fs.writeFileSync(filepath, req.file.buffer);
      imageUrl = `/uploads/yearCards/${filename}`;

      // Also convert to base64 for database storage
      imageBase64 = req.file.buffer.toString('base64');
      
      // Validate base64 size
      if (imageBase64.length > 400000) { // 400KB base64 limit
        return res.status(400).json({ 
          message: `Processed image too large: ${imageBase64.length} characters. Please use a smaller image.` 
        });
      }
    } else if (req.body.imageBase64) {
      imageBase64 = req.body.imageBase64;
      
      // Validate base64 size
      if (imageBase64.length > 400000) { // 400KB base64 limit
        return res.status(400).json({ 
          message: `Image data too large: ${imageBase64.length} characters. Please use a smaller image.` 
        });
      }
    }

    if (!imageUrl && !imageBase64) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const result = await YearCard.create({
      year: parseInt(year),
      title,
      description,
      section: section || 'home',
      imageUrl,
      imageBase64,
      uploadedBy: userId
    });

    res.status(201).json({
      message: 'Year card uploaded successfully',
      cardId: result.insertId
    });
  } catch (error) {
    console.error('Error uploading year card:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllYearCards = async (req, res) => {
  try {
    const cards = await YearCard.getAll();
    res.json(cards || []);
  } catch (error) {
    console.error('Gallery Error:', error.message);
    // Return empty array instead of error
    res.json([]);
  }
};

export const getYearCardById = async (req, res) => {
  try {
    const { cardId } = req.params;
    const card = await YearCard.getById(cardId);

    if (!card) {
      return res.status(404).json({ message: 'Year card not found' });
    }

    res.json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateYearCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { year, title, description, removeImage } = req.body;
    const userId = req.user.id;

    const card = await YearCard.getById(cardId);
    if (!card) {
      return res.status(404).json({ message: 'Year card not found' });
    }

    let imageUrl = card.imageUrl;
    let imageBase64 = card.imageBase64;

    // Check if user wants to remove the image
    if (removeImage === 'true' || removeImage === true) {
      console.log('Removing existing yearCard image');
      
      // Delete old file if exists
      if (card.imageUrl && card.imageUrl.startsWith('/uploads/')) {
        const oldPath = path.join(process.cwd(), card.imageUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      
      imageUrl = null;
      imageBase64 = null;
    } else if (req.file) {
      // Image size validation
      const maxSizeKB = 300; // 300KB limit
      const maxSizeBytes = maxSizeKB * 1024;
      
      if (req.file.size > maxSizeBytes) {
        const sizeKB = Math.round(req.file.size / 1024);
        return res.status(400).json({ 
          message: `Image too large: ${req.file.size} bytes (${sizeKB}KB). Maximum allowed: ${maxSizeKB}KB` 
        });
      }

      // Delete old file if exists
      if (card.imageUrl && card.imageUrl.startsWith('/uploads/')) {
        const oldPath = path.join(process.cwd(), card.imageUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      const filename = `${year || card.year}-${Date.now()}-${req.file.originalname}`;
      const filepath = path.join(UPLOAD_DIR, filename);
      
      fs.writeFileSync(filepath, req.file.buffer);
      imageUrl = `/uploads/yearCards/${filename}`;
      imageBase64 = req.file.buffer.toString('base64');
      
      // Validate base64 size
      if (imageBase64.length > 400000) { // 400KB base64 limit
        return res.status(400).json({ 
          message: `Processed image too large: ${imageBase64.length} characters. Please use a smaller image.` 
        });
      }
    } else if (req.body.imageBase64) {
      imageBase64 = req.body.imageBase64;
      
      // Validate base64 size
      if (imageBase64.length > 400000) { // 400KB base64 limit
        return res.status(400).json({ 
          message: `Image data too large: ${imageBase64.length} characters. Please use a smaller image.` 
        });
      }
    }

    await YearCard.update(cardId, {
      year: year || card.year,
      title: title || card.title,
      description: description || card.description,
      imageUrl,
      imageBase64
    });

    res.json({ message: 'Year card updated successfully' });
  } catch (error) {
    console.error('Error updating year card:', error);
    res.status(500).json({ message: error.message });
  }
};

export const reorderYearCards = async (req, res) => {
  try {
    const { cards } = req.body; // Array of { id, order }

    for (const card of cards) {
      await YearCard.reorder(card.id, card.order);
    }

    res.json({ message: 'Year cards reordered successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteYearCard = async (req, res) => {
  try {
    const { cardId } = req.params;

    const card = await YearCard.getById(cardId);
    if (!card) {
      return res.status(404).json({ message: 'Year card not found' });
    }

    // Delete file if exists
    if (card.imageUrl && card.imageUrl.startsWith('/uploads/')) {
      const filepath = path.join(process.cwd(), card.imageUrl);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    await YearCard.deleteHard(cardId);

    res.json({ message: 'Year card deleted successfully' });
  } catch (error) {
    console.error('Error deleting year card:', error);
    res.status(500).json({ message: error.message });
  }
};

// Remove year card image
export const removeYearCardImage = async (req, res) => {
  try {
    const { cardId } = req.params;

    console.log('Remove year card image request:', { cardId });

    const card = await YearCard.getById(cardId);
    if (!card) {
      return res.status(404).json({ message: 'Year card not found' });
    }

    // Delete old file if exists
    if (card.imageUrl && card.imageUrl.startsWith('/uploads/')) {
      const oldPath = path.join(process.cwd(), card.imageUrl);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Remove the image by setting it to null
    await YearCard.update(cardId, {
      year: card.year,
      title: card.title,
      description: card.description,
      imageUrl: null,
      imageBase64: null
    });

    console.log('Year card image removed successfully for card:', cardId);

    res.json({ 
      message: 'Year card image removed successfully'
    });
  } catch (error) {
    console.error('Remove year card image error:', error);
    res.status(500).json({ message: error.message });
  }
};
