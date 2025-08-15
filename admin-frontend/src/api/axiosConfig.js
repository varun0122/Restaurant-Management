import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const apiClient = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
});

// --- NEW: Axios Interceptor for Automatic Token Refresh ---
apiClient.interceptors.request.use(
    async (config) => {
        const accessToken = localStorage.getItem('admin_access_token');
        const refreshToken = localStorage.getItem('admin_refresh_token');
        const loginTimestamp = localStorage.getItem('admin_login_timestamp');

        if (!accessToken || !refreshToken || !loginTimestamp) {
            return config; // No tokens, proceed as normal
        }

        // Check if the 12-hour session has expired
        const twelveHours = 12 * 60 * 60 * 1000;
        if (Date.now() - loginTimestamp > twelveHours) {
            localStorage.removeItem('admin_access_token');
            localStorage.removeItem('admin_refresh_token');
            localStorage.removeItem('admin_login_timestamp');
            window.location.href = '/login'; // Force redirect
            return Promise.reject(new Error("Session expired"));
        }

        // Check if the access token itself is expired
        const user = jwtDecode(accessToken);
        const isExpired = Date.now() >= user.exp * 1000;

        if (!isExpired) {
            config.headers.Authorization = `Bearer ${accessToken}`;
            return config;
        }

        // Access token is expired, try to refresh it
        try {
            const response = await axios.post('http://127.0.0.1:8000/api/token/refresh/', {
                refresh: refreshToken,
            });

            localStorage.setItem('admin_access_token', response.data.access);
            config.headers.Authorization = `Bearer ${response.data.access}`;
            return config;
        } catch (error) {
            // If refresh fails, logout the user
            localStorage.removeItem('admin_access_token');
            localStorage.removeItem('admin_refresh_token');
            localStorage.removeItem('admin_login_timestamp');
            window.location.href = '/login';
            return Promise.reject(error);
        }
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;
