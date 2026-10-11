/**
 * RoadSense AI - Centralized API Configuration
 * ============================================
 * Provides dynamic base URL resolution for FastAPI backend across:
 * 1. Local development (Vite dev server -> http://127.0.0.1:8000)
 * 2. Vercel production deployment (-> Render web service)
 * 3. Custom environments via VITE_API_URL
 */

export const DEFAULT_RENDER_BACKEND_URL = 'https://roadsense-ai-backend-nu1l.onrender.com';
export const DEFAULT_LOCAL_BACKEND_URL = 'http://127.0.0.1:8000';

/**
 * Returns the sanitized base URL for the backend API.
 * Ensures no trailing slash.
 */
export function getApiBaseUrl() {
  const envUrl = import.meta.env?.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // If running in browser and NOT on local machine, always connect to production Render backend
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
    if (!isLocalhost) {
      return DEFAULT_RENDER_BACKEND_URL;
    }
  }

  // In production bundle builds, always point to the production Render backend
  if (import.meta.env?.PROD) {
    return DEFAULT_RENDER_BACKEND_URL;
  }

  return DEFAULT_LOCAL_BACKEND_URL;
}

/**
 * Returns full URL for a given API endpoint path.
 */
export function getApiEndpoint(path) {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export const API_ENDPOINTS = {
  HEALTH: () => getApiEndpoint('/health'),
  ANALYZE_IMAGE: (conf) => getApiEndpoint(conf !== undefined ? `/api/analyze/image?conf=${conf}` : '/api/analyze/image'),
  ANALYZE_FRAME: (conf) => getApiEndpoint(conf !== undefined ? `/api/analyze/frame?conf=${conf}` : '/api/analyze/frame'),
  ANALYZE_VIDEO: () => getApiEndpoint('/api/analyze/video'),
};
