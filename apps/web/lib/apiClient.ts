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
      // Handle unauthorized - redirect to login if needed
      if (typeof window !== 'undefined') {
        // window.location.pathname is the real, basePath-included path
        // (e.g. "/geely/admin/..."), not stripped the way Next's own
        // router treats it — comparing against a bare "/admin" prefix
        // never matched in production, so this redirect never fired.
        const path = window.location.pathname;
        const adminPrefix = withBasePath('/admin');
        if (path.startsWith(adminPrefix)) {
          window.location.href = withBasePath('/admin/login');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
