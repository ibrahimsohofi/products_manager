// API Configuration
const getApiUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  // Check if we're in a Same.new preview environment
  if (hostname.includes('preview.same-app.com')) {
    // Replace the port number in the preview URL (5173 -> 3001)
    const apiHostname = hostname.replace('5173-', '3001-');
    return `${protocol}//${apiHostname}`;
  }

  // If we're running on a network IP (not localhost), use that for API calls too
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:3001`;
  }

  // Fallback to localhost for local development
  return 'http://localhost:3001';
};

export const API_BASE_URL = getApiUrl();

// Helper function for API calls
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response;
};

export default { API_BASE_URL, apiCall };
