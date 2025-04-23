// File: utils/fileUtils.js - File utility functions
const fs = require('fs');
const path = require('path');

/**
 * Ensures a directory exists, creating it if necessary
 * @param {string} dirPath - Path to the directory
 */
const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

/**
 * Reads JSON data from a file
 * @param {string} filePath - Path to the JSON file
 * @param {any} defaultValue - Default value to return if file doesn't exist
 * @returns {any} Parsed JSON data or default value
 */
const readJsonFile = (filePath, defaultValue = []) => {
    try {
        // Ensure directory exists
        const dir = path.dirname(filePath);
        ensureDirectoryExists(dir);
        
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultValue));
            return defaultValue;
        }
        
        const data = fs.readFileSync(filePath, 'utf8');
        // Handle empty file case
        if (!data || data.trim() === '') {
            fs.writeFileSync(filePath, JSON.stringify(defaultValue));
            return defaultValue;
        }
        
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        // If there's an error parsing, reset the file
        fs.writeFileSync(filePath, JSON.stringify(defaultValue));
        return defaultValue;
    }
};

/**
 * Writes JSON data to a file
 * @param {string} filePath - Path to the JSON file
 * @param {any} data - Data to write
 * @returns {boolean} Success status
 */
const writeJsonFile = (filePath, data) => {
    try {
        // Ensure directory exists
        const dir = path.dirname(filePath);
        ensureDirectoryExists(dir);
        
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing file ${filePath}:`, error);
        return false;
    }
};

module.exports = {
    ensureDirectoryExists,
    readJsonFile,
    writeJsonFile
};