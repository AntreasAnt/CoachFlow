// Backend Configuration  
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}/CoachFlow`;
export const BACKEND_ROUTES_API = `${API_BASE_URL}/backend/src/routes/`;

// Frontend Configuration
export const FRONTEND_BASE_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';