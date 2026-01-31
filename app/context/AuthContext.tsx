"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { StorageService } from '../services/storage';

interface AuthContextType {
    user: User | null;
    login: (username: string) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: () => { },
    logout: () => { },
    isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing session
        const currentUser = StorageService.getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
        }
        setIsLoading(false);
    }, []);

    const login = (username: string) => {
        const foundUser = StorageService.login(username);
        if (foundUser) {
            setUser(foundUser);
        } else {
            alert("Kullanıcı bulunamadı (Mock: 'admin', 'hasan', 'berat' deneyin)");
        }
    };

    const logout = () => {
        StorageService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}
