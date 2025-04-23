// Routes/settingsRoutes.js
const express = require('express');
const router = express.Router();
const settingsModel = require('../models/settingsModel');
const auth = require('../middleware/auth');

// Get user settings
router.get('/:userId', auth, async (req, res) => {
  try {
    const settings = await settingsModel.getUserSettings(req.params.userId);
    
    if (!settings) {
      return res.status(404).json({ message: 'Settings not found' });
    }
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching settings', error: error.message });
  }
});

// Update user settings
router.put('/:userId', auth, async (req, res) => {
  try {
    if (!req.body.settings) {
      return res.status(400).json({ message: 'Settings data is required' });
    }
    
    const updatedSettings = await settingsModel.updateUserSettings(
      req.params.userId, 
      req.body.settings
    );
    
    if (!updatedSettings) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ 
      message: 'Settings updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating settings', error: error.message });
  }
});

// Reset user settings to default
router.post('/:userId/reset', auth, async (req, res) => {
  try {
    const resetSettings = await settingsModel.resetToDefaultSettings(req.params.userId);
    
    if (!resetSettings) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ 
      message: 'Settings reset to default',
      settings: resetSettings
    });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting settings', error: error.message });
  }
});

module.exports = router;