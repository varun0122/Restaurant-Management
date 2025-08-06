import axios from 'axios';

// Create a new Axios instance
const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // Your Django API base URL
});

// Use an interceptor to add the auth token to every request
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('admin_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export default apiClient;