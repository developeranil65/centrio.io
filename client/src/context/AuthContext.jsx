import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getMe } from '../api/auth.api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Hydrate user from stored token on mount
    useEffect(() => {
        const hydrate = async () => {
            const token = localStorage.getItem('centrio_token');
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const { data } = await getMe();
                setUser(data);
            } catch {
                localStorage.removeItem('centrio_token');
                localStorage.removeItem('centrio_user');
            } finally {
                setLoading(false);
            }
        };
        hydrate();
    }, []);

    const login = async (email, password) => {
        const { data } = await loginUser({ email, password });
        localStorage.setItem('centrio_token', data.token);
        localStorage.setItem('centrio_user', JSON.stringify(data));
        setUser(data);
        toast.success('Welcome back!');
        return data;
    };

    const register = async (name, email, password) => {
        const { data } = await registerUser({ name, email, password });
        localStorage.setItem('centrio_token', data.token);
        localStorage.setItem('centrio_user', JSON.stringify(data));
        setUser(data);
        toast.success('Account created!');
        return data;
    };

    const logout = () => {
        localStorage.removeItem('centrio_token');
        localStorage.removeItem('centrio_user');
        setUser(null);
        toast('Logged out', { icon: '👋' });
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
