import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function useTheme() {
    return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        // Default to dark mode if nothing is saved
        return localStorage.getItem('centrio_theme') || 'dark';
    });

    useEffect(() => {
        const root = document.documentElement;
        // Remove both classes to ensure clean state
        root.classList.remove('light', 'dark');
        // Add the current theme class
        root.classList.add(theme);
        // Persist
        localStorage.setItem('centrio_theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
