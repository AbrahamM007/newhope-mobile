import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface UserProfile {
    id: string;
    auth_id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
    campus_id?: string;
    is_active: boolean;
    is_discoverable: boolean;
}

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    profile?: UserProfile;
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

    useEffect(() => {
        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (session?.user) {
                    const profile = await fetchUserProfile(session.user.id);
                    if (profile) {
                        setUser({
                            id: session.user.id,
                            email: session.user.email || '',
                            firstName: profile.first_name,
                            lastName: profile.last_name,
                            avatar: profile.avatar_url,
                            profile,
                        });
                    }
                } else {
                    setUser(null);
                }
            }
        );

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const initAuth = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const profile = await fetchUserProfile(session.user.id);
                if (profile) {
                    setUser({
                        id: session.user.id,
                        email: session.user.email || '',
                        firstName: profile.first_name,
                        lastName: profile.last_name,
                        avatar: profile.avatar_url,
                        profile,
                    });
                }
            }
        } catch (error) {
            console.error('Auth init error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserProfile = async (authId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('auth_id', authId)
                .maybeSingle();

            if (error) throw error;
            return data as UserProfile | null;
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            return null;
        }
    };

    const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('No user created');

        const { error: profileError } = await supabase.from('profiles').insert({
            auth_id: authData.user.id,
            first_name: firstName,
            last_name: lastName,
            email,
        });

        if (profileError) throw profileError;

        const profile = await fetchUserProfile(authData.user.id);
        if (profile) {
            setUser({
                id: authData.user.id,
                email: authData.user.email || '',
                firstName: profile.first_name,
                lastName: profile.last_name,
                avatar: profile.avatar_url,
                profile,
            });
        }
    };

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        if (!data.user) throw new Error('No user returned');

        const profile = await fetchUserProfile(data.user.id);
        if (profile) {
            setUser({
                id: data.user.id,
                email: data.user.email || '',
                firstName: profile.first_name,
                lastName: profile.last_name,
                avatar: profile.avatar_url,
                profile,
            });
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
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
