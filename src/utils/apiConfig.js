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

  // If in browser on Vercel deployment or any HTTPS production host,
  // automatically fallback to the active Render backend URL.
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
    if (!isLocalhost && (hostname.includes('vercel.app') || window.location.protocol === 'https:')) {
      return DEFAULT_RENDER_BACKEND_URL;
    }
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
  ANALYZE_IMAGE: () => getApiEndpoint('/api/analyze/image'),
  ANALYZE_FRAME: () => getApiEndpoint('/api/analyze/frame'),
  ANALYZE_VIDEO: () => getApiEndpoint('/api/analyze/video'),
};
