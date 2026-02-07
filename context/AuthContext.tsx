import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    authAPI,
    setAuthToken,
    getAuthToken,
    removeAuthToken,
    setStoredUser,
    getStoredUser,
    removeStoredUser,
    apiClient,
} from '@/lib/api';

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    roles: string[];
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Setup Axios Interceptor
    useEffect(() => {
        const interceptor = apiClient.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;
                if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
                    originalRequest._retry = true;
                    await signOut();
                }
                return Promise.reject(error);
            }
        );

        return () => {
            apiClient.interceptors.response.eject(interceptor);
        };
    }, []);

    useEffect(() => {
        initAuth();
    }, []);

    const initAuth = async () => {
        try {
            // Check for existing token
            const token = await getAuthToken();
            if (token) {
                // Validate token by fetching user
                try {
                    const userData = await authAPI.me();
                    setUser(userData);
                    await setStoredUser(userData);
                } catch (error) {
                    // Token invalid, clear it
                    await removeAuthToken();
                    await removeStoredUser();
                }
            }
        } catch (error) {
            console.error('Auth init error:', error);
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
        const response = await authAPI.register(email, password, firstName, lastName);

        if (response.token) {
            await setAuthToken(response.token);
            setUser(response.user);
            await setStoredUser(response.user);
        }
    };

    const signIn = async (email: string, password: string) => {
        const response = await authAPI.login(email, password);

        if (response.token) {
            await setAuthToken(response.token);
            setUser(response.user);
            await setStoredUser(response.user);
        }
    };

    const signOut = async () => {
        await removeAuthToken();
        await removeStoredUser();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isAuthenticated: !!user,
                signUp,
                signIn,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
