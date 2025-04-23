// settings.js - Server-side controller

const User = require('../models/user');

// Get user settings
exports.getUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('settings');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ settings: user.settings });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user settings
exports.updateUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationPreferences, displayMode, language } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        settings: {
          notificationPreferences,
          displayMode,
          language
        }
      },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ 
      message: 'Settings updated successfully',
      settings: updatedUser.settings 
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};