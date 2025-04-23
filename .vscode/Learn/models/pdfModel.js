// File: models/pdfModel.js - PDF data model operations for Supabase
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');

/**
 * Get all PDFs
 * @returns {Promise<Array>} Array of PDF objects
 */
const getAllPDFs = async () => {
  const { data, error } = await supabase
    .from('pdf_uploads')
    .select('*');
  
  if (error) {
    console.error('Error fetching PDFs:', error);
    throw error;
  }
  
  return data || [];
};

/**
 * Get PDFs for a specific user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of PDF objects for the user
 */
const getUserPDFs = async (userId) => {
  const { data, error } = await supabase
    .from('pdf_uploads')
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching user PDFs:', error);
    throw error;
  }
  
  return data || [];
};

/**
 * Get a PDF by ID
 * @param {string} pdfId - PDF ID
 * @returns {Promise<Object|null>} PDF object or null if not found
 */
const getPDFById = async (pdfId) => {
  const { data, error } = await supabase
    .from('pdf_uploads')
    .select('*')
    .eq('id', pdfId)
    .single();
  
  if (error) {
    console.error('Error fetching PDF by ID:', error);
    return null;
  }
  
  return data;
};

/**
 * Add a new PDF
 * @param {Object} pdfData - PDF data including file buffer
 * @returns {Promise<Object>} Added PDF object
 */
const addPDF = async (pdfData) => {
  const { userId, originalName, buffer, contentType, size } = pdfData;
  
  // Generate unique filename
  const filename = `${uuidv4()}-${originalName.replace(/\s+/g, '_')}`;
  const filePath = `pdfs/${filename}`;
  
  // Upload file to Supabase Storage
  const { error: uploadError } = await supabase
    .storage
    .from('pdf_uploads')
    .upload(filePath, buffer, {
      contentType,
      cacheControl: '3600'
    });
  
  if (uploadError) {
    console.error('Error uploading file to storage:', uploadError);
    throw uploadError;
  }
  
  // Get the public URL of the uploaded file
  const { data: { publicUrl } } = supabase
    .storage
    .from('pdf_uploads')
    .getPublicUrl(filePath);
  
  // Add record to database
  const timestamp = new Date().toISOString();
  const newPDF = {
    user_id: userId,
    filename: originalName,
    file_path: filePath,
    file_url: publicUrl,
    file_size: size,
    uploaded_at: timestamp,
    summary: null // Will be filled later by the summarization API
  };
  
  const { data, error } = await supabase
    .from('pdf_uploads')
    .insert([newPDF])
    .select();
  
  if (error) {
    console.error('Error inserting PDF record:', error);
    // Clean up - delete the uploaded file
    await supabase.storage.from('pdf_uploads').remove([filePath]);
    throw error;
  }
  
  return data[0];
};

/**
 * Update PDF summary
 * @param {string} pdfId - PDF ID
 * @param {string} summary - Generated summary
 * @returns {Promise<Object|null>} Updated PDF object or null if not found
 */
const updatePDFSummary = async (pdfId, summary) => {
  const { data, error } = await supabase
    .from('pdf_uploads')
    .update({ summary })
    .eq('id', pdfId)
    .select();
  
  if (error) {
    console.error('Error updating PDF summary:', error);
    throw error;
  }
  
  return data?.[0] || null;
};

/**
 * Delete a PDF
 * @param {string} pdfId - PDF ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
const deletePDF = async (pdfId, userId) => {
  // Get the PDF to find the file path
  const pdf = await getPDFById(pdfId);
  
  if (!pdf || pdf.user_id !== userId) {
    return false;
  }
  
  // Delete the file from storage
  const { error: storageError } = await supabase
    .storage
    .from('pdf_uploads')
    .remove([pdf.file_path]);
  
  if (storageError) {
    console.error('Error deleting file from storage:', storageError);
    throw storageError;
  }
  
  // Delete the record from the database
  const { error } = await supabase
    .from('pdf_uploads')
    .delete()
    .eq('id', pdfId)
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error deleting PDF record:', error);
    throw error;
  }
  
  return true;
};

module.exports = {
  getAllPDFs,
  getUserPDFs,
  getPDFById,
  addPDF,
  updatePDFSummary,
  deletePDF
};