// Routes/learningGamesRoutes.js
const express = require('express');
const router = express.Router();
const gamesModel = require('../models/gamesModel');
const auth = require('../middleware/auth');

// Get all available games
router.get('/', auth, async (req, res) => {
  try {
    const category = req.query.category;
    const difficulty = req.query.difficulty;
    
    const games = await gamesModel.getAvailableGames(category, difficulty);
    
    res.json(games);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching games', error: error.message });
  }
});

// Get specific game details
router.get('/detail/:gameId', auth, async (req, res) => {
  try {
    const game = await gamesModel.getGameById(req.params.gameId);
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    res.json(game);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching game details', error: error.message });
  }
});

// Get user progress for a specific game
router.get('/:gameId/progress/:userId', auth, async (req, res) => {
  try {
    const progress = await gamesModel.getUserGameProgress(
      req.params.userId,
      req.params.gameId
    );
    
    res.json(progress || { completed: false, highScore: 0, lastPlayed: null });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching game progress', 
      error: error.message 
    });
  }
});

// Save game progress
router.post('/:gameId/progress', auth, async (req, res) => {
  try {
    if (!req.body.userId || typeof req.body.score !== 'number') {
      return res.status(400).json({ 
        message: 'User ID and score are required' 
      });
    }
    
    const progressData = {
      userId: req.body.userId,
      gameId: req.params.gameId,
      score: req.body.score,
      completed: req.body.completed || false,
      timeSpent: req.body.timeSpent || 0
    };
    
    const updatedProgress = await gamesModel.saveGameProgress(progressData);
    
    res.json({
      message: 'Game progress saved',
      progress: updatedProgress
    });
  } catch (error) {
    res.status(500).json({ message: 'Error saving game progress', error: error.message });
  }
});

// Get leaderboard for a game
router.get('/:gameId/leaderboard', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const leaderboard = await gamesModel.getGameLeaderboard(
      req.params.gameId,
      limit
    );
    
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching leaderboard', 
      error: error.message 
    });
  }
});

module.exports = router;