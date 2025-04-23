// File: server.js - Main entry point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');

// Import route modules
const pdfRoutes = require('./Routes/pdfRoutes');
const flashcardRoutes = require('./Routes/flashcardRoutes');
const quizRoutes = require('./Routes/quizRoutes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from public directory

// Register route modules
app.use('/api/pdfs', pdfRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/quiz', quizRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (err.message === 'Only PDF files are allowed') {
        return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Something went wrong', error: err.message });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});