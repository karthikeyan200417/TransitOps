import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('transitops_user');
        return saved ? JSON.parse(saved) : null;
    });

    const login = (email, role) => {
        const name = email.split('@')[0];
        const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
        const mockUser = {
            name: formattedName || 'Raven K.',
            email,
            role: role || 'Dispatcher'
        };
        setUser(mockUser);
        localStorage.setItem('transitops_user', JSON.stringify(mockUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('transitops_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
