// File: config/index.js - Configuration settings
const path = require('path');

module.exports = {
    // PDF Configuration
    pdfStorageDir: path.join(__dirname, '..', 'uploads'),
    pdfsFile: path.join(__dirname, '..', 'data', 'pdfs.json'),
    
    // Flashcard Configuration
    dataDir: path.join(__dirname, '..', 'data'),
    decksFile: path.join(__dirname, '..', 'data', 'decks.json'),
    cardsDir: path.join(__dirname, '..', 'data', 'cards'),
    
    // Server Configuration
    port: process.env.PORT || 3000,
    
    // File Limits
    fileSizeLimit: 10 * 1024 * 1024, // 10MB max file size
};