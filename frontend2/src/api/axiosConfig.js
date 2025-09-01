// apiClient.js
import axios from 'axios';
// RIGHT:
import { jwtDecode } from 'jwt-decode';
import mitt from 'mitt';

export const emitter = mitt();

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});

// Request interceptor for token checking and refreshing
apiClient.interceptors.request.use(
  async (config) => {
    const accessToken = localStorage.getItem('customer_access_token');
    const refreshToken = localStorage.getItem('customer_refresh_token');
    const loginTimestamp = localStorage.getItem('customer_login_timestamp');

    if (!accessToken || !refreshToken || !loginTimestamp) {
      return config;
    }

    const oneHour = 60 * 60 * 1000;
    if (Date.now() - loginTimestamp > oneHour) {
      localStorage.removeItem('customer_access_token');
      localStorage.removeItem('customer_refresh_token');
      localStorage.removeItem('customer_login_timestamp');
      localStorage.removeItem('customer');
      return config;
    }

    try {
      const user = jwtDecode(accessToken);
      const isExpired = Date.now() >= user.exp * 1000;

      if (!isExpired) {
        config.headers.Authorization = `Bearer ${accessToken}`;
        return config;
      }

      const response = await axios.post('http://127.0.0.1:8000/api/customers/token/refresh/', {
        refresh: refreshToken,
      });

      localStorage.setItem('customer_access_token', response.data.access);
      config.headers.Authorization = `Bearer ${response.data.access}`;
      return config;
    } catch (error) {
      localStorage.removeItem('customer_access_token');
      localStorage.removeItem('customer_refresh_token');
      localStorage.removeItem('customer_login_timestamp');
      localStorage.removeItem('customer');
      return Promise.reject(error);
    }
  },
  (error) => Promise.reject(error)
);

// Response interceptor to catch 401 errors and emit logout event
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (
        error.response.data.detail &&
        error.response.data.code === 'token_not_valid'
      ) {
        localStorage.removeItem('customer_access_token');
        localStorage.removeItem('customer_refresh_token');
        localStorage.removeItem('customer_login_timestamp');
        localStorage.removeItem('customer');
        emitter.emit('logout');
      }
    }
    return Promise.reject(error);
  }
);


export default apiClient;

