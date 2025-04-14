import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import apiClient, { secureLog } from './api';
import { getAccessToken } from './authService';

/**
 * Vercel Blob Storage Helper for React Native
 * 
 * This utility provides methods for uploading images to Vercel Blob storage
 * from a React Native application, with proper handling of file format differences.
 */

/**
 * Checks if Vercel Blob storage is accessible and configured properly
 * @param {string} type - The upload type (banner, logo, etc.)
 * @returns {Promise<Object>} Status response from Blob storage
 */
export const checkBlobStorageStatus = async (type) => {
  try {
    // Get authentication token
    const token = await getAccessToken();
    
    if (!token) {
      secureLog.error('No authentication token available for Blob status check');
      return { success: false, error: 'Authentication required' };
    }
    
    // Use OPTIONS method to check Blob storage status
    const response = await fetch(`${apiClient.defaults.baseURL}/upload?type=${type}`, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      secureLog.warn(`Blob storage check failed with status: ${response.status}`);
      return { 
        success: false, 
        error: `Server returned ${response.status}` 
      };
    }
    
    // Parse the response data
    const data = await response.json();
    secureLog.info(`Blob storage check result: ${data.success ? 'Success' : 'Failed'}`);
    
    return {
      success: true,
      ...data
    };
  } catch (error) {
    secureLog.error(`Error checking Blob storage for ${type}:`, error);
    return { 
      success: false, 
      error: error.message || 'Unknown error checking Blob storage'
    };
  }
};

/**
 * Prepares a file from a local URI for upload
 * @param {string} uri - Local URI of the file to upload
 * @returns {Promise<Object>} File info object with type, name, and possibly a base64 string
 */
export const prepareFileForUpload = async (uri) => {
  try {
    // Get file info from URI
    const uriParts = uri.split('/');
    const fileName = uriParts[uriParts.length - 1];
    
    // Extract file extension and determine MIME type
    const fileExtension = fileName.split('.').pop().toLowerCase();
    const mimeType = fileExtension === 'jpg' || fileExtension === 'jpeg' ? 'image/jpeg' : 
                    fileExtension === 'png' ? 'image/png' : 
                    fileExtension === 'webp' ? 'image/webp' : 'image/jpeg';
    
    // Create a file object compatible with React Native's FormData
    const fileObject = {
      uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
      type: mimeType,
      name: fileName
    };
    
    return {
      fileObject,
      fileInfo: {
        name: fileName,
        type: mimeType,
        extension: fileExtension
      }
    };
  } catch (error) {
    secureLog.error('Error preparing file for upload:', error);
    throw new Error(`Failed to prepare file: ${error.message}`);
  }
};

/**
 * Uploads an image to Vercel Blob storage
 * @param {string} imageUri - Local URI of the image to upload
 * @param {string} type - Type of upload (banner, logo, etc.)
 * @returns {Promise<string>} URL of the uploaded image
 */
export const uploadImageToBlob = async (imageUri, type) => {
  if (!imageUri) return null;
  
  try {
    secureLog.info(`Preparing to upload ${type} image to Vercel Blob`);
    
    // Get authentication token
    const token = await getAccessToken();
    
    if (!token) {
      secureLog.error('No authentication token available for upload');
      throw new Error('Authentication required for upload');
    }
    
    // Check Blob storage status first
    const blobStatus = await checkBlobStorageStatus(type);
    
    if (!blobStatus.success) {
      secureLog.warn('Blob storage status check failed: ' + blobStatus.error);
      // Continue anyway as the server might still accept the upload
    } else {
      secureLog.info(`Blob storage is accessible using type: ${type}`);
    }
    
    // Prepare file for upload
    const { fileObject, fileInfo } = await prepareFileForUpload(imageUri);
    secureLog.info('File prepared for upload', { fileType: fileInfo.type, fileName: fileInfo.name });
    
    // Create FormData object for the upload
    const formData = new FormData();
    formData.append('file', fileObject);
    formData.append('type', type);
    
    secureLog.info(`FormData prepared for ${type} upload to Vercel Blob`);
    
    // Use fetch directly for better FormData handling
    const response = await fetch(`${apiClient.defaults.baseURL}/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`
        // No Content-Type header - let it be set automatically for multipart/form-data
      }
    });
    
    secureLog.info(`Upload response status: ${response.status}`);
    
    // Check if response is OK
    if (!response.ok) {
      secureLog.error(`Upload failed with status: ${response.status}`);
      throw new Error(`Server returned ${response.status}`);
    }
    
    // Parse JSON response
    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
      secureLog.info('Upload response parsed successfully');
    } catch (parseError) {
      secureLog.error('Failed to parse response as JSON:', parseError);
      throw new Error('Invalid response format from server');
    }
    
    // For Vercel Blob, the URL is returned in the data.url or data.blobUrl field
    if (data && (data.url || data.blobUrl)) {
      const imageUrl = data.url || data.blobUrl;
      // Only log a sanitized version of the URL for security
      secureLog.info(`Image uploaded successfully to Vercel Blob with URL path ending in: ...${imageUrl.substring(imageUrl.lastIndexOf('/'))}`);
      return imageUrl;
    } else {
      secureLog.error('Upload response did not contain a URL');
      throw new Error('Upload response missing URL');
    }
  } catch (error) {
    secureLog.error('Error uploading image to Vercel Blob:', error);
    throw error;
  }
};

export default {
  checkBlobStorageStatus,
  prepareFileForUpload,
  uploadImageToBlob
}; 