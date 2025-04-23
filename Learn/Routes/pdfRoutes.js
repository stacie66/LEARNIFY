// File: Routes/pdfRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfModel = require('../models/pdfModel');

// Configure multer for memory storage (instead of disk)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Get all PDFs for a user
router.get('/:userId', async (req, res) => {
  try {
    const pdfs = await pdfModel.getUserPDFs(req.params.userId);
    res.json(pdfs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching PDFs', error: error.message });
  }
});

// Get a specific PDF
router.get('/detail/:pdfId', async (req, res) => {
  try {
    const pdf = await pdfModel.getPDFById(req.params.pdfId);
    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }
    res.json(pdf);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching PDF', error: error.message });
  }
});

// Upload a new PDF
router.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file provided' });
    }
    
    if (!req.body.userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const pdfData = {
      userId: req.body.userId,
      originalName: req.file.originalname,
      buffer: req.file.buffer,
      contentType: req.file.mimetype,
      size: req.file.size
    };
    
    const newPdf = await pdfModel.addPDF(pdfData);
    
    res.status(201).json(newPdf);
  } catch (error) {
    res.status(500).json({ message: 'Error uploading PDF', error: error.message });
  }
});

// Update PDF summary
router.put('/:pdfId/summary', async (req, res) => {
  try {
    if (!req.body.summary) {
      return res.status(400).json({ message: 'Summary is required' });
    }
    
    const updatedPdf = await pdfModel.updatePDFSummary(req.params.pdfId, req.body.summary);
    
    if (!updatedPdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }
    
    res.json(updatedPdf);
  } catch (error) {
    res.status(500).json({ message: 'Error updating PDF summary', error: error.message });
  }
});

// Delete a PDF - Fixed to handle userId in query params or JSON body
router.delete('/:pdfId', async (req, res) => {
  try {
    // Get userId from query params or body
    const userId = req.query.userId || (req.body && req.body.userId);
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const success = await pdfModel.deletePDF(req.params.pdfId, userId);
    
    if (!success) {
      return res.status(404).json({ message: 'PDF not found or you don\'t have permission to delete it' });
    }
    
    res.json({ message: 'PDF deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting PDF', error: error.message });
  }
});

module.exports = router;