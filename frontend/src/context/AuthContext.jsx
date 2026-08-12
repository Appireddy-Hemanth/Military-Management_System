import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            api.get('/auth/me')
                .then(res => {
                    setUser(res.data);
                    setLoading(false);
                })
                .catch(() => {
                    localStorage.removeItem('token');
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (username, password) => {
        const res = await api.post('/auth/login', { username, password });
        if (res.data.requires2FA) {
            return { requires2FA: true, tempToken: res.data.tempToken };
        }
        localStorage.setItem('token', res.data.token);
        setUser({ id: res.data.userId, role: res.data.role, baseId: res.data.baseId, username });
        return { success: true };
    };

    const verify2FA = async (tempToken, token) => {
        const res = await api.post('/auth/login/verify-2fa', { tempToken, token });
        localStorage.setItem('token', res.data.token);
        const me = await api.get('/auth/me');
        setUser(me.data);
    }

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, verify2FA, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
