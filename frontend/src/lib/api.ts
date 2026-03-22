import axios from 'axios';

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api/v1'
).replace(/\/$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  // Render free tier can be slow on cold start; use a higher
  // timeout so registration and other first requests don't fail
  // with a client-side ECONNABORTED error.
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

let refreshTokenRequest: Promise<{ token: string; refreshToken: string } | null> | null = null;

const clearAuthStorage = () => {
  localStorage.removeItem('cdgi_token');
  localStorage.removeItem('cdgi_refresh_token');
  localStorage.removeItem('cdgi_user');
};

const isAuthEndpoint = (url?: string) => {
  if (!url) return false;
  return url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh-token');
};

const refreshAccessToken = async (): Promise<{ token: string; refreshToken: string } | null> => {
  const existingRefreshToken = localStorage.getItem('cdgi_refresh_token');
  if (!existingRefreshToken) return null;

  if (!refreshTokenRequest) {
    refreshTokenRequest = axios
      .post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken: existingRefreshToken })
      .then((response) => {
        const tokens = response?.data?.data;
        if (!tokens?.token || !tokens?.refreshToken) {
          return null;
        }

        localStorage.setItem('cdgi_token', tokens.token);
        localStorage.setItem('cdgi_refresh_token', tokens.refreshToken);

        return {
          token: tokens.token,
          refreshToken: tokens.refreshToken,
        };
      })
      .catch(() => null)
      .finally(() => {
        refreshTokenRequest = null;
      });
  }

  return refreshTokenRequest;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cdgi_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (error.code === 'ECONNABORTED') {
      window.alert('Request timeout. Please try again.');
      return Promise.reject(error);
    }

    if (!error.response) {
      window.alert('Network error. Please check your connection and try again.');
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint(originalRequest.url)) {
      originalRequest._retry = true;

      const newTokens = await refreshAccessToken();
      if (newTokens?.token) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newTokens.token}`;
        return api(originalRequest);
      }

      clearAuthStorage();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
