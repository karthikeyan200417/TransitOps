import React, { createContext, useState, useEffect } from 'react';
import { authApi, getToken, clearToken } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('transitops_user');
        return saved ? JSON.parse(saved) : null;
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // On mount — if a token exists, re-fetch profile to validate it
    useEffect(() => {
        const token = getToken();
        if (token && !user) {
            authApi.profile()
                .then(profile => {
                    const u = buildUser(profile);
                    setUser(u);
                    localStorage.setItem('transitops_user', JSON.stringify(u));
                })
                .catch(() => {
                    clearToken();
                    localStorage.removeItem('transitops_user');
                    setUser(null);
                });
        }
    }, []);

    function buildUser(profile) {
        return {
            id: profile.id,
            name: profile.full_name,
            email: profile.email,
            role: profile.role.name,          // e.g. "ADMIN", "DISPATCHER"
            roleDisplay: formatRole(profile.role.name),
        };
    }

    function formatRole(roleName) {
        // "FLEET_MANAGER" → "Fleet Manager"
        return roleName
            .split('_')
            .map(w => w.charAt(0) + w.slice(1).toLowerCase())
            .join(' ');
    }

    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            // 1. Get JWT token
            const tokenResp = await authApi.login(email, password);
            localStorage.setItem('transitops_token', tokenResp.access_token);

            // 2. Fetch user profile
            const profile = await authApi.profile();
            const u = buildUser(profile);
            setUser(u);
            localStorage.setItem('transitops_user', JSON.stringify(u));
            return u;
        } catch (err) {
            setError(err.message || 'Login failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } catch (_) { /* ignore */ }
        clearToken();
        localStorage.removeItem('transitops_user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
}
