// learningGames.js - Server-side controller

const Game = require('../models/game');
const UserGame = require('../models/userGame');

// Get available learning games
exports.getAvailableGames = async (req, res) => {
  try {
    const games = await Game.find({ isActive: true })
      .select('title description difficulty category imageUrl estimatedTime');
    
    res.status(200).json({ games });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get specific game details
exports.getGameDetails = async (req, res) => {
  try {
    const gameId = req.params.gameId;
    
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Get user's progress on this game if they've played before
    const userProgress = await UserGame.findOne({
      userId: req.user.id,
      gameId: gameId
    });
    
    res.status(200).json({
      game,
      userProgress: userProgress || { completed: false, highScore: 0, lastPlayed: null }
    });
  } catch (error) {
    console.error('Error fetching game details:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Save game progress or results
exports.saveGameProgress = async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const userId = req.user.id;
    const { score, completed, timeSpent } = req.body;
    
    // Find if there's an existing record
    let userGame = await UserGame.findOne({ userId, gameId });
    
    if (userGame) {
      // Update existing record
      userGame.highScore = Math.max(userGame.highScore, score);
      userGame.completed = completed || userGame.completed;
      userGame.timeSpent += timeSpent;
      userGame.lastPlayed = new Date();
      userGame.playCount += 1;
      
      await userGame.save();
    } else {
      // Create new record
      userGame = await UserGame.create({
        userId,
        gameId,
        highScore: score,
        completed,
        timeSpent,
        lastPlayed: new Date(),
        playCount: 1
      });
    }
    
    // Update user points if game was completed
    if (completed) {
      const game = await Game.findById(gameId);
      // Add code to update user points based on game difficulty
    }
    
    res.status(200).json({
      message: 'Game progress saved',
      userGame
    });
  } catch (error) {
    console.error('Error saving game progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
};