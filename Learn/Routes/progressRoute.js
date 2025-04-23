// Routes/progressRoutes.js
const express = require('express');
const router = express.Router();
const progressModel = require('../models/progressModel');
const auth = require('../middleware/auth');

// Get user progress overview
router.get('/overview/:userId', auth, async (req, res) => {
  try {
    const progress = await progressModel.getProgressOverview(req.params.userId);
    
    if (!progress) {
      return res.status(404).json({ message: 'User progress not found' });
    }
    
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching progress', error: error.message });
  }
});

// Get detailed activity history with pagination
router.get('/history/:userId', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const activityType = req.query.type;
    
    const result = await progressModel.getActivityHistory(
      req.params.userId,
      page,
      limit,
      activityType
    );
    
    res.json({
      activities: result.activities,
      totalPages: result.totalPages,
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activity history', error: error.message });
  }
});

// Record new activity
router.post('/activity', auth, async (req, res) => {
  try {
    if (!req.body.userId || !req.body.activityType || !req.body.resourceId) {
      return res.status(400).json({ 
        message: 'User ID, activity type, and resource ID are required' 
      });
    }
    
    const activityData = {
      userId: req.body.userId,
      activityType: req.body.activityType,
      resourceId: req.body.resourceId,
      timeSpent: req.body.timeSpent || 0,
      score: req.body.score || 0,
      completed: req.body.completed || false
    };
    
    const newActivity = await progressModel.recordActivity(activityData);
    
    res.status(201).json(newActivity);
  } catch (error) {
    res.status(500).json({ message: 'Error recording activity', error: error.message });
  }
});

// Get learning streak information
router.get('/streak/:userId', auth, async (req, res) => {
  try {
    const streak = await progressModel.getUserStreak(req.params.userId);
    
    res.json(streak);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching streak information', error: error.message });
  }
});

module.exports = router;