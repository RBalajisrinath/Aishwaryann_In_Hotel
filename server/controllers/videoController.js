import { executeQuery } from '../config/database.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for video upload
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/hero-videos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const videoUpload = multer({
  storage: videoStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed (mp4, webm, ogg)'), false);
    }
  },
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Get all homepage videos
export const getHomepageVideos = async (req, res) => {
  try {
    const videos = await executeQuery(
      'SELECT * FROM homepage_videos WHERE isActive = 1 ORDER BY displayOrder ASC'
    );
    res.json(videos);
  } catch (error) {
    console.error('Error fetching homepage videos:', error);
    res.status(500).json({ message: 'Error fetching videos' });
  }
};

// Get all videos (including inactive)
export const getAllVideos = async (req, res) => {
  try {
    const videos = await executeQuery(
      'SELECT * FROM homepage_videos ORDER BY displayOrder ASC'
    );
    res.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ message: 'Error fetching videos' });
  }
};

// Create new video
export const createVideo = async (req, res) => {
  try {
    const { title, description, displayOrder } = req.body;
    const hotelId = req.body.hotelId || 1;

    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    const videoUrl = `/uploads/hero-videos/${req.file.filename}`;

    const result = await executeQuery(
      'INSERT INTO homepage_videos (title, description, videoUrl, displayOrder, hotelId) VALUES (?, ?, ?, ?, ?)',
      [title || 'Untitled Video', description || '', videoUrl, displayOrder || 0, hotelId]
    );

    res.status(201).json({
      id: result.insertId,
      title: title || 'Untitled Video',
      description: description || '',
      videoUrl,
      displayOrder: displayOrder || 0,
      isActive: 1,
      hotelId
    });
  } catch (error) {
    console.error('Error creating video:', error);
    res.status(500).json({ message: 'Error creating video' });
  }
};

// Update video
export const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, displayOrder, isActive } = req.body;

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
    if (displayOrder !== undefined) {
      updateFields.push('displayOrder = ?');
      values.push(displayOrder);
    }
    if (isActive !== undefined) {
      updateFields.push('isActive = ?');
      values.push(isActive ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);
    await executeQuery(
      `UPDATE homepage_videos SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ message: 'Video updated successfully' });
  } catch (error) {
    console.error('Error updating video:', error);
    res.status(500).json({ message: 'Error updating video' });
  }
};

// Delete video
export const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;

    // Get video URL to delete file
    const [video] = await executeQuery(
      'SELECT videoUrl FROM homepage_videos WHERE id = ?',
      [id]
    );

    if (video && video.videoUrl) {
      const filePath = path.join(__dirname, '../' + video.videoUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await executeQuery('DELETE FROM homepage_videos WHERE id = ?', [id]);
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ message: 'Error deleting video' });
  }
};

// Reorder videos
export const reorderVideos = async (req, res) => {
  try {
    const { videos } = req.body; // Array of {id, displayOrder}

    if (!Array.isArray(videos)) {
      return res.status(400).json({ message: 'Videos must be an array' });
    }

    for (const video of videos) {
      await executeQuery(
        'UPDATE homepage_videos SET displayOrder = ? WHERE id = ?',
        [video.displayOrder, video.id]
      );
    }

    res.json({ message: 'Videos reordered successfully' });
  } catch (error) {
    console.error('Error reordering videos:', error);
    res.status(500).json({ message: 'Error reordering videos' });
  }
};
