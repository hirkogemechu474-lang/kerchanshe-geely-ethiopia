import axios from 'axios';
import { withBasePath } from './basePath';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Real navigation, not fetch() — bypasses the basePath-aware fetch
        // patch in layout.tsx, so a bare "/admin/login" lands outside
        // "/geely" entirely on every session expiry, not just explicit logout.
        window.location.href = withBasePath('/admin/login');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
