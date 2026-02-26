import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

// Derive socket server URL from VITE_API_URL (strip /api suffix)
const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

export function SocketProvider({ children }) {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const guestName = sessionStorage.getItem('guestName');
        const guestEmail = sessionStorage.getItem('guestEmail');

        // Authenticated user
        if (user) {
            const token = localStorage.getItem('centrio_token');
            if (!token) return;

            const newSocket = io(SOCKET_URL, {
                auth: { token },
                transports: ['websocket', 'polling'],
            });

            newSocket.on('connect', () => {
                console.log('Socket connected (auth):', newSocket.id);
            });

            newSocket.on('connect_error', (err) => {
                console.error('Socket connection error:', err.message);
            });

            setSocket(newSocket);
            return () => { newSocket.disconnect(); };
        }

        // Guest user (joined via room code)
        if (guestName) {
            const newSocket = io(SOCKET_URL, {
                auth: { guestName, guestEmail },
                transports: ['websocket', 'polling'],
            });

            newSocket.on('connect', () => {
                console.log('Socket connected (guest):', newSocket.id);
            });

            newSocket.on('connect_error', (err) => {
                console.error('Socket guest connection error:', err.message);
            });

            setSocket(newSocket);
            return () => { newSocket.disconnect(); };
        }

        // No user and no guest — disconnect
        if (socket) {
            socket.disconnect();
            setSocket(null);
        }
    }, [user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
}
