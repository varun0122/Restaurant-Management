import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const apiClient = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
});

// --- NEW: Axios Interceptor for Automatic Token Refresh ---
apiClient.interceptors.request.use(
    async (config) => {
        const accessToken = localStorage.getItem('customer_access_token');
        const refreshToken = localStorage.getItem('customer_refresh_token');
        const loginTimestamp = localStorage.getItem('customer_login_timestamp');

        if (!accessToken || !refreshToken || !loginTimestamp) {
            return config;
        }

        // Check if the 1-hour session has expired
        const oneHour = 60 * 60 * 1000;
        if (Date.now() - loginTimestamp > oneHour) {
            localStorage.removeItem('customer_access_token');
            localStorage.removeItem('customer_refresh_token');
            localStorage.removeItem('customer_login_timestamp');
            localStorage.removeItem('customer');
            // We can't force a redirect here, but the next API call will fail gracefully.
            // The App.jsx logic will then show the login modal.
            return config;
        }

        const user = jwtDecode(accessToken);
        const isExpired = Date.now() >= user.exp * 1000;

        if (!isExpired) {
            config.headers.Authorization = `Bearer ${accessToken}`;
            return config;
        }

        try {
            const response = await axios.post('http://127.0.0.1:8000/api/customers/token/refresh/', { // Note the different URL
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
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;
