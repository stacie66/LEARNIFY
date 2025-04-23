// models/settingsModel.js
const db = require('../config/db');
const ObjectId = require('mongodb').ObjectId;

// Default settings object
const defaultSettings = {
  notificationPreferences: {
    email: true,
    app: true
  },
  displayMode: 'system',
  language: 'en',
  sound: true,
  studyReminders: true,
  reminderTime: '18:00'
};

// Get user settings
exports.getUserSettings = async (userId) => {
  try {
    const collection = db.collection('users');
    const user = await collection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { settings: 1 } }
    );
    
    return user?.settings || defaultSettings;
  } catch (error) {
    console.error('Error in getUserSettings:', error);
    throw error;
  }
};

// Update user settings
exports.updateUserSettings = async (userId, newSettings) => {
  try {
    // Validate settings data
    const validatedSettings = validateSettings(newSettings);
    
    const collection = db.collection('users');
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: { settings: validatedSettings } },
      { returnDocument: 'after', projection: { settings: 1 } }
    );
    
    return result.value?.settings;
  } catch (error) {
    console.error('Error in updateUserSettings:', error);
    throw error;
  }
};

// Reset to default settings
exports.resetToDefaultSettings = async (userId) => {
  try {
    const collection = db.collection('users');
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: { settings: defaultSettings } },
      { returnDocument: 'after', projection: { settings: 1 } }
    );
    
    return result.value?.settings;
  } catch (error) {
    console.error('Error in resetToDefaultSettings:', error);
    throw error;
  }
};

// Helper function to validate settings
function validateSettings(settings) {
  // Start with default settings
  const validSettings = { ...defaultSettings };
  
  // Update with provided values, ensuring they're valid
  if (settings.notificationPreferences) {
    validSettings.notificationPreferences.email = 
      typeof settings.notificationPreferences.email === 'boolean' 
        ? settings.notificationPreferences.email 
        : defaultSettings.notificationPreferences.email;
        
    validSettings.notificationPreferences.app = 
      typeof settings.notificationPreferences.app === 'boolean' 
        ? settings.notificationPreferences.app 
        : defaultSettings.notificationPreferences.app;
  }
  
  if (settings.displayMode && ['light', 'dark', 'system'].includes(settings.displayMode)) {
    validSettings.displayMode = settings.displayMode;
  }
  
  if (settings.language) {
    validSettings.language = settings.language;
  }
  
  if (typeof settings.sound === 'boolean') {
    validSettings.sound = settings.sound;
  }
  
  if (typeof settings.studyReminders === 'boolean') {
    validSettings.studyReminders = settings.studyReminders;
  }
  
  if (settings.reminderTime && /^([01]\d|2[0-3]):([0-5]\d)$/.test(settings.reminderTime)) {
    validSettings.reminderTime = settings.reminderTime;
  }
  
  return validSettings;
}