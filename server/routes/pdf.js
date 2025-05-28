const express = require('express');
const router = express.Router();
const { 
  uploadPdf, 
  getUserPdfs, 
  sendPdfEmail, 
  getPdfById, 
  deletePdf 
} = require('../controllers/pdfController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Upload PDF file
router.post('/upload', auth, upload.single('pdf'), uploadPdf);

// Get all PDFs uploaded by user
router.get('/', auth, getUserPdfs);

// Get a single PDF by ID
router.get('/:id', auth, getPdfById);

// Send PDF to email
router.post('/send', auth, sendPdfEmail);

// Delete a PDF
router.delete('/:id', auth, deletePdf);

module.exports = router;
