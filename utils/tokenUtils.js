/**
 * Generates a simple token for authentication
 * This is a temporary function - in a real app, you would use server-provided tokens
 * 
 * @param {string} identifier - Unique identifier (like email) 
 * @returns {string} Generated auth token
 */
export const generateToken = (identifier) => {
  // In a real app, never generate tokens on client - this is a placeholder
  // Create a temporary token with timestamp and encoded user identifier
  const timestamp = new Date().getTime();
  const randomPart = Math.random().toString(36).substring(2, 10);
  
  return `temp_${timestamp}_${randomPart}_${btoa(identifier)}`;
}; 