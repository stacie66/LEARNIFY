// File: routes/quizRoutes.js - Routes for quiz functionality
const express = require('express');
const router = express.Router();
const { 
    getDeckById, 
    getDeckCards,
    updateCard 
} = require('../models/flashcardModel');

/**
 * Get quiz for a specific deck
 * Returns cards from the deck in randomized order
 */
router.get('/:deckId', (req, res) => {
    const { deckId } = req.params;
    
    // Check if deck exists
    const deck = getDeckById(deckId);
    if (!deck) {
        return res.status(404).json({ error: 'Deck not found' });
    }
    
    // Get all cards for the deck
    const cards = getDeckCards(deckId);
    if (!cards.length) {
        return res.status(404).json({ error: 'No cards found in this deck' });
    }
    
    // Shuffle cards for quiz
    const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
    
    res.json({
        deckId,
        deckName: deck.name,
        cards: shuffledCards
    });
});

/**
 * Submit quiz results
 * Updates cards with new statistics based on quiz performance
 */
router.post('/:deckId/submit', (req, res) => {
    const { deckId } = req.params;
    const { results } = req.body;
    
    if (!results || !Array.isArray(results)) {
        return res.status(400).json({ error: 'Invalid quiz results format' });
    }
    
    // Check if deck exists
    const deck = getDeckById(deckId);
    if (!deck) {
        return res.status(404).json({ error: 'Deck not found' });
    }
    
    // Update statistics for each card
    const updatedCards = [];
    
    results.forEach(result => {
        const { cardId, correct } = result;
        
        const card = updateCard(deckId, cardId, {
            stats: {
                lastReviewed: new Date().toISOString(),
                correct: correct ? 1 : 0,
                ...updateCardStats(cardId, deckId, correct)
            }
        });
        
        if (card) {
            updatedCards.push(card);
        }
    });
    
    res.json({
        success: true,
        deckId,
        updatedCards
    });
});

/**
 * Helper function to update card statistics
 */
function updateCardStats(cardId, deckId, correct) {
    // Get current card
    const card = getDeckCards(deckId).find(c => c.id === cardId);
    
    if (!card) return {};
    
    // Initialize stats if they don't exist
    const stats = card.stats || {
        timesReviewed: 0,
        correctCount: 0,
        incorrectCount: 0
    };
    
    return {
        timesReviewed: (stats.timesReviewed || 0) + 1,
        correctCount: (stats.correctCount || 0) + (correct ? 1 : 0),
        incorrectCount: (stats.incorrectCount || 0) + (correct ? 0 : 1)
    };
}

module.exports = router;