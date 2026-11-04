import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure upload directories exist
const paymentDir = path.join(__dirname, '../uploads/payment-proofs');
const idProofDir = path.join(__dirname, '../uploads/id-proofs');
if (!fs.existsSync(paymentDir)) fs.mkdirSync(paymentDir, { recursive: true });
if (!fs.existsSync(idProofDir)) fs.mkdirSync(idProofDir, { recursive: true });

// Storage with dynamic destination based on fieldname
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'paymentProof') {
      cb(null, paymentDir);
    } else if (file.fieldname === 'proofFile') {
      cb(null, idProofDir);
    } else {
      cb(null, path.join(__dirname, '../uploads'));
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${file.fieldname}_${uniqueSuffix}_${safeName}`);
  }
});

const fileFilter = (req, file, cb) => {
  // allow images and PDF for both payment and id proofs
  const allowedTypes = /jpeg|jpg|png|pdf|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image and PDF files are allowed for proofs'));
  }
};

export const uploadGuestProofs = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter
});
