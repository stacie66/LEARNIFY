// File: routes/flashcardRoutes.js - Flashcard API routes
const express = require('express');
const router = express.Router();
const flashcardModel = require('../models/flashcardModel');

// Get all decks
router.get('/decks', (req, res) => {
    try {
        const decks = flashcardModel.getAllDecks();
        
        // Add card count to each deck
        const decksWithCount = decks.map(deck => {
            const cards = flashcardModel.getDeckCards(deck.id);
            return {
                ...deck,
                cardCount: cards.length,
                progress: 0 // This could be calculated based on study history if implemented
            };
        });
        
        res.json(decksWithCount);
    } catch (error) {
        console.error('Error fetching decks:', error);
        res.status(500).json({ error: 'Failed to fetch decks' });
    }
});

// Get a specific deck
router.get('/decks/:id', (req, res) => {
    try {
        const deckId = req.params.id;
        const deck = flashcardModel.getDeckById(deckId);
        
        if (!deck) {
            return res.status(404).json({ error: 'Deck not found' });
        }
        
        res.json(deck);
    } catch (error) {
        console.error('Error fetching deck:', error);
        res.status(500).json({ error: 'Failed to fetch deck' });
    }
});

// Create a new deck
router.post('/decks', (req, res) => {
    try {
        const { name, description, userId } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Deck name is required' });
        }
        
        const newDeck = flashcardModel.addDeck({
            name,
            description: description || '',
            userId: userId || null // Optional user ID for associating decks with users
        });
        
        res.status(201).json(newDeck);
    } catch (error) {
        console.error('Error creating deck:', error);
        res.status(500).json({ error: 'Failed to create deck' });
    }
});

// Update a deck
router.put('/decks/:id', (req, res) => {
    try {
        const deckId = req.params.id;
        const { name, description } = req.body;
        
        if (!name && description === undefined) {
            return res.status(400).json({ error: 'No update data provided' });
        }
        
        const updatedDeck = flashcardModel.updateDeck(deckId, { name, description });
        
        if (!updatedDeck) {
            return res.status(404).json({ error: 'Deck not found' });
        }
        
        res.json(updatedDeck);
    } catch (error) {
        console.error('Error updating deck:', error);
        res.status(500).json({ error: 'Failed to update deck' });
    }
});

// Delete a deck
router.delete('/decks/:id', (req, res) => {
    try {
        const deckId = req.params.id;
        const success = flashcardModel.deleteDeck(deckId);
        
        if (!success) {
            return res.status(404).json({ error: 'Deck not found' });
        }
        
        res.json({ message: 'Deck deleted successfully' });
    } catch (error) {
        console.error('Error deleting deck:', error);
        res.status(500).json({ error: 'Failed to delete deck' });
    }
});

// Get all cards for a deck
router.get('/decks/:id/cards', (req, res) => {
    try {
        const deckId = req.params.id;
        
        // Check if deck exists
        const deck = flashcardModel.getDeckById(deckId);
        if (!deck) {
            return res.status(404).json({ error: 'Deck not found' });
        }
        
        const cards = flashcardModel.getDeckCards(deckId);
        res.json(cards);
    } catch (error) {
        console.error('Error fetching cards:', error);
        res.status(500).json({ error: 'Failed to fetch cards' });
    }
});

// Get a specific card
router.get('/decks/:deckId/cards/:cardId', (req, res) => {
    try {
        const { deckId, cardId } = req.params;
        
        // Check if deck exists
        const deck = flashcardModel.getDeckById(deckId);
        if (!deck) {
            return res.status(404).json({ error: 'Deck not found' });
        }
        
        const card = flashcardModel.getCardById(deckId, cardId);
        if (!card) {
            return res.status(404).json({ error: 'Card not found' });
        }
        
        res.json(card);
    } catch (error) {
        console.error('Error fetching card:', error);
        res.status(500).json({ error: 'Failed to fetch card' });
    }
});

// Create a new card in a deck
router.post('/decks/:id/cards', (req, res) => {
    try {
        const deckId = req.params.id;
        const { front, back } = req.body;
        
        if (!front || !back) {
            return res.status(400).json({ error: 'Both front and back content are required' });
        }
        
        // Check if deck exists
        const deck = flashcardModel.getDeckById(deckId);
        if (!deck) {
            return res.status(404).json({ error: 'Deck not found' });
        }
        
        const newCard = flashcardModel.addCard(deckId, {
            front,
            back,
            createdAt: new Date().toISOString()
        });
        
        res.status(201).json(newCard);
    } catch (error) {
        console.error('Error creating card:', error);
        res.status(500).json({ error: 'Failed to create card' });
    }
});

// Update a card
router.put('/decks/:deckId/cards/:cardId', (req, res) => {
    try {
        const { deckId, cardId } = req.params;
        const { front, back } = req.body;
        
        if (!front && back === undefined) {
            return res.status(400).json({ error: 'No update data provided' });
        }
        
        // Check if deck exists
        const deck = flashcardModel.getDeckById(deckId);
        if (!deck) {
            return res.status(404).json({ error: 'Deck not found' });
        }
        
        const updatedCard = flashcardModel.updateCard(deckId, cardId, { front, back });
        
        if (!updatedCard) {
            return res.status(404).json({ error: 'Card not found' });
        }
        
        res.json(updatedCard);
    } catch (error) {
        console.error('Error updating card:', error);
        res.status(500).json({ error: 'Failed to update card' });
    }
});

// Delete a card
router.delete('/decks/:deckId/cards/:cardId', (req, res) => {
    try {
        const { deckId, cardId } = req.params;
        
        // Check if deck exists
        const deck = flashcardModel.getDeckById(deckId);
        if (!deck) {
            return res.status(404).json({ error: 'Deck not found' });
        }
        
        const success = flashcardModel.deleteCard(deckId, cardId);
        
        if (!success) {
            return res.status(404).json({ error: 'Card not found' });
        }
        
        res.json({ message: 'Card deleted successfully' });
    } catch (error) {
        console.error('Error deleting card:', error);
        res.status(500).json({ error: 'Failed to delete card' });
    }
});

module.exports = router;