import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('centrio_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 responses (expired/invalid token)
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Don't redirect guests who are on board pages — they don't have tokens
            const onBoardPage = window.location.pathname.startsWith('/board/');
            const onJoinPage = window.location.pathname.startsWith('/join');
            if (!onBoardPage && !onJoinPage) {
                localStorage.removeItem('centrio_token');
                localStorage.removeItem('centrio_user');
                if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default API;
