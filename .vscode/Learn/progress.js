// progress.js - Server-side controller

const User = require('../models/user');
const Activity = require('../models/activity');

// Get user progress overview
exports.getProgressOverview = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's current level and points
    const user = await User.findById(userId).select('level points');
    
    // Get activity statistics
    const stats = await Activity.aggregate([
      { $match: { userId: userId } },
      { $group: {
          _id: '$activityType',
          count: { $sum: 1 },
          totalTime: { $sum: '$timeSpent' }
        }
      }
    ]);
    
    // Format stats into a more readable object
    const formattedStats = {};
    stats.forEach(stat => {
      formattedStats[stat._id] = {
        count: stat.count,
        totalTime: stat.totalTime
      };
    });
    
    res.status(200).json({
      level: user.level,
      points: user.points,
      pointsToNextLevel: calculatePointsToNextLevel(user.level, user.points),
      stats: formattedStats
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get detailed activity history
exports.getActivityHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, type } = req.query;
    
    const query = { userId };
    if (type) query.activityType = type;
    
    const activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
      
    const total = await Activity.countDocuments(query);
    
    res.status(200).json({
      activities,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching activity history:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to calculate points needed for next level
function calculatePointsToNextLevel(currentLevel, currentPoints) {
  const pointsRequired = 1000 * currentLevel;
  return pointsRequired - currentPoints;
}