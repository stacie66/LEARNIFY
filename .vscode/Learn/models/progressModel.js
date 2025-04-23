// models/progressModel.js
const db = require('../config/db');
const ObjectId = require('mongodb').ObjectId;

// Get user progress overview
exports.getProgressOverview = async (userId) => {
  try {
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { level: 1, points: 1, _id: 0 } }
    );
    
    if (!user) {
      return null;
    }
    
    // Get activity statistics
    const activitiesCollection = db.collection('activities');
    const stats = await activitiesCollection.aggregate([
      { $match: { userId: new ObjectId(userId) } },
      { $group: {
          _id: '$activityType',
          count: { $sum: 1 },
          totalTime: { $sum: '$timeSpent' },
          completedCount: { 
            $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] } 
          }
        }
      }
    ]).toArray();
    
    // Format stats by activity type
    const formattedStats = {};
    stats.forEach(stat => {
      formattedStats[stat._id] = {
        total: stat.count,
        completed: stat.completedCount,
        totalTime: stat.totalTime
      };
    });
    
    // Calculate points needed for next level
    const pointsToNextLevel = calculatePointsToNextLevel(user.level, user.points);
    
    return {
      level: user.level || 1,
      points: user.points || 0,
      pointsToNextLevel,
      stats: formattedStats
    };
  } catch (error) {
    console.error('Error in getProgressOverview:', error);
    throw error;
  }
};

// Get detailed activity history
exports.getActivityHistory = async (userId, page, limit, activityType) => {
  try {
    const collection = db.collection('activities');
    
    const query = { userId: new ObjectId(userId) };
    if (activityType) {
      query.activityType = activityType;
    }
    
    const total = await collection.countDocuments(query);
    
    const activities = await collection.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
    
    // Enhance activities with resource names
    const enhancedActivities = await enhanceActivitiesWithResourceNames(activities);
    
    return {
      activities: enhancedActivities,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  } catch (error) {
    console.error('Error in getActivityHistory:', error);
    throw error;
  }
};

// Record a new activity
exports.recordActivity = async (activityData) => {
  try {
    const collection = db.collection('activities');
    
    // Validate activity type
    if (!['flashcard', 'quiz', 'game', 'pdf_reading'].includes(activityData.activityType)) {
      throw new Error('Invalid activity type');
    }
    
    const newActivity = {
      userId: new ObjectId(activityData.userId),
      activityType: activityData.activityType,
      resourceId: new ObjectId(activityData.resourceId),
      timeSpent: parseInt(activityData.timeSpent) || 0,
      score: parseInt(activityData.score) || 0,
      completed: Boolean(activityData.completed),
      createdAt: new Date()
    };
    
    const result = await collection.insertOne(newActivity);
    
    // Update user points if activity was completed
    if (newActivity.completed) {
      await updateUserPoints(activityData.userId, calculatePointsEarned(activityData));
    }
    
    return { 
      _id: result.insertedId, 
      ...newActivity,
      userId: activityData.userId, // Convert back to string for response
      resourceId: activityData.resourceId // Convert back to string for response
    };
  } catch (error) {
    console.error('Error in recordActivity:', error);
    throw error;
  }
};

// Get user streak information
exports.getUserStreak = async (userId) => {
  try {
    const collection = db.collection('activities');
    
    // Get dates of all activities for this user
    const activities = await collection.find(
      { userId: new ObjectId(userId) },
      { projection: { createdAt: 1 } }
    ).toArray();
    
    // Process activities to get unique dates
    const uniqueDates = new Set();
    activities.forEach(activity => {
      const dateStr = activity.createdAt.toISOString().split('T')[0];
      uniqueDates.add(dateStr);
    });
    
    // Sort dates
    const sortedDates = Array.from(uniqueDates).sort();
    
    // Calculate current streak
    let currentStreak = 0;
    let lastDate = new Date();
    lastDate.setHours(0, 0, 0, 0);
    
    // Convert to date object for easier comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const currentDate = new Date(sortedDates[i]);
      
      // Calculate day difference
      const diffTime = Math.abs(lastDate - currentDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        currentStreak++;
        lastDate = currentDate;
        // Subtract one day
        lastDate.setDate(lastDate.getDate() - 1);
      } else {
        break; // Streak broken
      }
    }
    
    // Calculate longest streak
    let longestStreak = 0;
    let currentLongestStreak = 0;
    lastDate = null;
    
    for (let i = 0; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i]);
      
      if (!lastDate) {
        currentLongestStreak = 1;
        lastDate = currentDate;
        continue;
      }
      
      // Calculate day difference
      const diffTime = Math.abs(currentDate - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentLongestStreak++;
      } else if (diffDays > 1) {
        // Streak broken
        if (currentLongestStreak > longestStreak) {
          longestStreak = currentLongestStreak;
        }
        currentLongestStreak = 1;
      }
      
      lastDate = currentDate;
    }
    
    // Check if the last streak is the longest
    if (currentLongestStreak > longestStreak) {
      longestStreak = currentLongestStreak;
    }
    
    return {
      currentStreak,
      longestStreak,
      lastActive: sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null
    };
  } catch (error) {
    console.error('Error in getUserStreak:', error);
    throw error;
  }
};

// Helper function to calculate points to next level
function calculatePointsToNextLevel(level, points) {
  const pointsRequired = 1000 * level;
  return pointsRequired - points;
}

// Helper function to calculate points earned from an activity
function calculatePointsEarned(activity) {
  let basePoints = 0;
  
  switch (activity.activityType) {
    case 'flashcard':
      basePoints = 5;
      break;
    case 'quiz':
      basePoints = 10;
      break;
    case 'game':
      basePoints = 15;
      break;
    case 'pdf_reading':
      basePoints = 5;
      break;
    default:
      basePoints = 5;
  }
  
  // Adjust points based on score if applicable
  if (activity.score > 0) {
    return basePoints + Math.floor(activity.score / 10);
  }
  
  return basePoints;
}

// Helper function to update user points
async function updateUserPoints(userId, pointsEarned) {
  try {
    const collection = db.collection('users');
    
    // Get current user data
    const user = await collection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { points: 1, level: 1 } }
    );
    
    if (!user) {
      return false;
    }
    
    const currentPoints = user.points || 0;
    const currentLevel = user.level || 1;
    
    // Calculate new points
    const newPoints = currentPoints + pointsEarned;
    
    // Check if level up is needed
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
    console.error('Error updating user points:', error);
    return false;
  }
}

// Helper function to enhance activities with resource names
async function enhanceActivitiesWithResourceNames(activities) {
  try {
    // Group activities by resource type to minimize DB calls
    const resourceGroups = {
      flashcard: [],
      quiz: [],
      game: [],
      pdf_reading: []
    };
    
    activities.forEach(activity => {
      if (resourceGroups[activity.activityType]) {
        resourceGroups[activity.activityType].push(activity.resourceId);
      }
    });
    
    // Fetch resource names for each type
    const resourceNames = {};
    
    // Fetch flashcard deck names
    if (resourceGroups.flashcard.length > 0) {
      const flashcardDecks = await db.collection('flashcard_decks')
        .find({ _id: { $in: resourceGroups.flashcard.map(id => new ObjectId(id)) } })
        .project({ _id: 1, name: 1 })
        .toArray();
        
      flashcardDecks.forEach(deck => {
        resourceNames[deck._id] = deck.name;
      });
    }
    
    // Fetch quiz names
    if (resourceGroups.quiz.length > 0) {
      const quizzes = await db.collection('quizzes')
        .find({ _id: { $in: resourceGroups.quiz.map(id => new ObjectId(id)) } })
        .project({ _id: 1, title: 1 })
        .toArray();
        
      quizzes.forEach(quiz => {
        resourceNames[quiz._id] = quiz.title;
      });
    }
    
    // Fetch game names
    if (resourceGroups.game.length > 0) {
      const games = await db.collection('games')
        .find({ _id: { $in: resourceGroups.game.map(id => new ObjectId(id)) } })
        .project({ _id: 1, title: 1 })
        .toArray();
        
      games.forEach(game => {
        resourceNames[game._id] = game.title;
      });
    }
    
    // Fetch PDF names
    if (resourceGroups.pdf_reading.length > 0) {
      const pdfs = await db.collection('pdfs')
        .find({ _id: { $in: resourceGroups.pdf_reading.map(id => new ObjectId(id)) } })
        .project({ _id: 1, originalName: 1 })
        .toArray();
        
      pdfs.forEach(pdf => {
        resourceNames[pdf._id] = pdf.originalName;
      });
    }
    
    // Add resource names to activities
    return activities.map(activity => ({
      ...activity,
      resourceName: resourceNames[activity.resourceId] || 'Unknown Resource'
    }));
  } catch (error) {
    console.error('Error enhancing activities:', error);
    return activities; // Return original activities if enhancement fails
  }
}