// File: models/flashcardModel.js - Flashcard data model operations
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { decksFile, cardsDir } = require('../config');
const { readJsonFile, writeJsonFile, ensureDirectoryExists } = require('../utils/fileUtils');

// Ensure cards directory exists
ensureDirectoryExists(cardsDir);

/**
 * Get all decks
 * @returns {Array} Array of deck objects
 */
const getAllDecks = () => {
    return readJsonFile(decksFile, []);
};

/**
 * Get a deck by ID
 * @param {string} deckId - Deck ID
 * @returns {Object|null} Deck object or null if not found
 */
const getDeckById = (deckId) => {
    const decks = getAllDecks();
    return decks.find(deck => deck.id === deckId) || null;
};

/**
 * Add a new deck
 * @param {Object} deckData - Deck data to add
 * @returns {Object} Added deck object
 */
const addDeck = (deckData) => {
    const decks = getAllDecks();
    const timestamp = new Date().toISOString();
    
    const newDeck = {
        id: uuidv4(),
        ...deckData,
        createdAt: timestamp,
        updatedAt: timestamp
    };
    
    decks.push(newDeck);
    writeJsonFile(decksFile, decks);
    
    // Initialize empty cards file
    const cardsFile = path.join(cardsDir, `${newDeck.id}.json`);
    writeJsonFile(cardsFile, []);
    
    return newDeck;
};

/**
 * Update a deck
 * @param {string} deckId - Deck ID
 * @param {Object} deckData - Updated deck data
 * @returns {Object|null} Updated deck object or null if not found
 */
const updateDeck = (deckId, deckData) => {
    const decks = getAllDecks();
    const deckIndex = decks.findIndex(deck => deck.id === deckId);
    
    if (deckIndex === -1) {
        return null;
    }
    
    // Update deck properties
    decks[deckIndex] = {
        ...decks[deckIndex],
        ...deckData,
        updatedAt: new Date().toISOString()
    };
    
    writeJsonFile(decksFile, decks);
    return decks[deckIndex];
};

/**
 * Delete a deck
 * @param {string} deckId - Deck ID
 * @returns {boolean} Success status
 */
const deleteDeck = (deckId) => {
    const decks = getAllDecks();
    const filteredDecks = decks.filter(deck => deck.id !== deckId);
    
    if (filteredDecks.length === decks.length) {
        return false;
    }
    
    writeJsonFile(decksFile, filteredDecks);
    
    // Delete cards file
    const cardsFile = path.join(cardsDir, `${deckId}.json`);
    try {
        const fs = require('fs');
        if (fs.existsSync(cardsFile)) {
            fs.unlinkSync(cardsFile);
        }
        return true;
    } catch (error) {
        console.error(`Error deleting cards file for deck ${deckId}:`, error);
        return false;
    }
};

/**
 * Get cards for a deck
 * @param {string} deckId - Deck ID
 * @returns {Array} Array of card objects
 */
const getDeckCards = (deckId) => {
    const cardsFile = path.join(cardsDir, `${deckId}.json`);
    return readJsonFile(cardsFile, []);
};

/**
 * Get a card by ID
 * @param {string} deckId - Deck ID
 * @param {string} cardId - Card ID
 * @returns {Object|null} Card object or null if not found
 */
const getCardById = (deckId, cardId) => {
    const cards = getDeckCards(deckId);
    return cards.find(card => card.id === cardId) || null;
};

/**
 * Add a card to a deck
 * @param {string} deckId - Deck ID
 * @param {Object} cardData - Card data
 * @returns {Object|null} Added card or null if deck doesn't exist
 */
const addCard = (deckId, cardData) => {
    // Check if deck exists
    if (!getDeckById(deckId)) {
        return null;
    }
    
    const cards = getDeckCards(deckId);
    const timestamp = new Date().toISOString();
    
    const newCard = {
        id: uuidv4(),
        ...cardData,
        createdAt: timestamp,
        updatedAt: timestamp
    };
    
    cards.push(newCard);
    const cardsFile = path.join(cardsDir, `${deckId}.json`);
    writeJsonFile(cardsFile, cards);
    
    // Update deck's updatedAt timestamp
    updateDeck(deckId, { updatedAt: timestamp });
    
    return newCard;
};

/**
 * Update a card
 * @param {string} deckId - Deck ID
 * @param {string} cardId - Card ID
 * @param {Object} cardData - Updated card data
 * @returns {Object|null} Updated card or null if not found
 */
const updateCard = (deckId, cardId, cardData) => {
    const cards = getDeckCards(deckId);
    const cardIndex = cards.findIndex(card => card.id === cardId);
    
    if (cardIndex === -1) {
        return null;
    }
    
    const timestamp = new Date().toISOString();
    
    // Update card properties
    cards[cardIndex] = {
        ...cards[cardIndex],
        ...cardData,
        updatedAt: timestamp
    };
    
    const cardsFile = path.join(cardsDir, `${deckId}.json`);
    writeJsonFile(cardsFile, cards);
    
    // Update deck's updatedAt timestamp
    updateDeck(deckId, { updatedAt: timestamp });
    
    return cards[cardIndex];
};

/**
 * Delete a card
 * @param {string} deckId - Deck ID
 * @param {string} cardId - Card ID
 * @returns {boolean} Success status
 */
const deleteCard = (deckId, cardId) => {
    const cards = getDeckCards(deckId);
    const filteredCards = cards.filter(card => card.id !== cardId);
    
    if (filteredCards.length === cards.length) {
        return false;
    }
    
    const cardsFile = path.join(cardsDir, `${deckId}.json`);
    writeJsonFile(cardsFile, filteredCards);
    
    // Update deck's updatedAt timestamp
    updateDeck(deckId, { updatedAt: new Date().toISOString() });
    
    return true;
};

module.exports = {
    getAllDecks,
    getDeckById,
    addDeck,
    updateDeck,
    deleteDeck,
    getDeckCards,
    getCardById,
    addCard,
    updateCard,
    deleteCard
};