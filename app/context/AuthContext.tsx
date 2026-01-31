"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { FirebaseStorage } from '../services/firebaseStorage';

interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: async (u: string, p: string) => { },
    logout: () => { },
    isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const currentUserData = localStorage.getItem('app_current_user');
        if (currentUserData) {
            setUser(JSON.parse(currentUserData));
        }
        setIsLoading(false);
    }, []);

    const login = async (username: string, password: string) => {
        const users = await FirebaseStorage.getUsers();
        const foundUser = users.find(u =>
            u.username === username.toLowerCase().trim() &&
            (u.password === password || (!u.password && password === "123456"))
        );
        if (foundUser) {
            setUser(foundUser);
            localStorage.setItem('app_current_user', JSON.stringify(foundUser));
        } else {
            throw new Error("Kullanıcı adı veya şifre hatalı.");
        }
    };

    const logout = () => {
        localStorage.removeItem('app_current_user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}
