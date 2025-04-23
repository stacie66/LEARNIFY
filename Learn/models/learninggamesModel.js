// models/gamesModel.js
const db = require('../config/db');
const ObjectId = require('mongodb').ObjectId;

// Get available games
exports.getAvailableGames = async (category, difficulty) => {
  try {
    const collection = db.collection('games');
    
    // Build query
    const query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    const games = await collection.find(query)
      .project({
        title: 1,
        description: 1,
        difficulty: 1,
        category: 1,
        imageUrl: 1,
        estimatedTime: 1
      })
      .toArray();
    
    return games;
  } catch (error) {
    console.error('Error in getAvailableGames:', error);
    throw error;
  }
};

// Get game by ID
exports.getGameById = async (gameId) => {
  try {
    const collection = db.collection('games');
    
    const game = await collection.findOne({ _id: new ObjectId(gameId) });
    
    return game;
  } catch (error) {
    console.error('Error in getGameById:', error);
    throw error;
  }
};

// Get user's progress for a specific game
exports.getUserGameProgress = async (userId, gameId) => {
  try {
    const collection = db.collection('user_games');
    
    const progress = await collection.findOne({
      userId: new ObjectId(userId),
      gameId: new ObjectId(gameId)
    });
    
    return progress;
  } catch (error) {
    console.error('Error in getUserGameProgress:', error);
    throw error;
  }
};

// Save game progress
exports.saveGameProgress = async (progressData) => {
  try {
    const collection = db.collection('user_games');
    
    // Check if there's an existing record
    const existingProgress = await collection.findOne({
      userId: new ObjectId(progressData.userId),
      gameId: new ObjectId(progressData.gameId)
    });
    
    if (existingProgress) {
      // Update existing record
      const updates = {
        $set: {
          lastPlayed: new Date()
        },
        $inc: {
          playCount: 1,
          timeSpent: progressData.timeSpent || 0
        }
      };
      
      // Only update highScore if the new score is higher
      if (progressData.score > existingProgress.highScore) {
        updates.$set.highScore = progressData.score;
      }
      
      // Only update completed status if true
      if (progressData.completed && !existingProgress.completed) {
        updates.$set.completed = true;
        updates.$set.completedAt = new Date();
      }
      
      const result = await collection.findOneAndUpdate(
        {
          userId: new ObjectId(progressData.userId),
          gameId: new ObjectId(progressData.gameId)
        },
        updates,
        { returnDocument: 'after' }
      );
      
      // If game was completed for the first time, update user points
      if (progressData.completed && !existingProgress.completed) {
        const game = await db.collection('games').findOne(
          { _id: new ObjectId(progressData.gameId) },
          { projection: { pointsReward: 1 } }
        );
        
        if (game && game.pointsReward) {
          await updateUserPoints(progressData.userId, game.pointsReward);
        }
      }
      
      return result.value;
    } else {
      // Create new record
      const newProgress = {
        userId: new ObjectId(progressData.userId),
        gameId: new ObjectId(progressData.gameId),
        highScore: progressData.score || 0,
        completed: progressData.completed || false,
        timeSpent: progressData.timeSpent || 0,
        playCount: 1,
        lastPlayed: new Date(),
        createdAt: new Date()
      };
      
      if (newProgress.completed) {
        newProgress.completedAt = new Date();
      }
      
      const result = await collection.insertOne(newProgress);
      
      // If game was completed, update user points
      if (newProgress.completed) {
        const game = await db.collection('games').findOne(
          { _id: new ObjectId(progressData.gameId) },
          { projection: { pointsReward: 1 } }
        );
        
        if (game && game.pointsReward) {
          await updateUserPoints(progressData.userId, game.pointsReward);
        }
      }
      
      return { 
        _id: result.insertedId,
        ...newProgress,
        userId: progressData.userId, // Convert back to string for response
        gameId: progressData.gameId // Convert back to string for response
      };
    }
  } catch (error) {
    console.error('Error in saveGameProgress:', error);
    throw error;
  }
};

// Get leaderboard for a game
exports.getGameLeaderboard = async (gameId, limit) => {
  try {
    const collection = db.collection('user_games');
    
    const leaderboard = await collection.aggregate([
      { $match: { gameId: new ObjectId(gameId) } },
      { $sort: { highScore: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: 1,
          username: '$user.username',
          highScore: 1,
          completedAt: 1
        }
      }
    ]).toArray();
    
    return leaderboard;
  } catch (error) {
    console.error('Error in getGameLeaderboard:', error);
    throw error;
  }
};

// Helper function to update user points
async function updateUserPoints(userId, pointsToAdd) {
  try {
    const collection = db.collection('users');
    
    // Get current user level and points
    const user = await collection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { level: 1, points: 1 } }
    );
    
    if (!user) {
      return false;
    }
    
    const currentPoints = user.points || 0;
    const currentLevel = user.level || 1;
    const newPoints = currentPoints + pointsToAdd;
    
    // Check if user should level up
    const pointsRequiredForLevel = 1000 * currentLevel;
    let newLevel = currentLevel;
    
    if (newPoints >= pointsRequiredForLevel) {
      newLevel = currentLevel + 1;
    }
    
    // Update user
    await collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          points: newPoints,
          level: newLevel
        }
      }
    );
    
    return true;
  } catch (error) {
    console.error('Error in updateUserPoints:', error);
    throw error;
  }
}