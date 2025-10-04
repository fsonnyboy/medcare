import React, { useState, useContext, createContext, useEffect, useCallback, useMemo } from 'react';
import axios, { AxiosError } from 'axios';
import { useResetRecoilState, useSetRecoilState } from 'recoil';
import { BASE_URL } from '@/constants/api';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAxiosInstance } from '@/utils/axiosInstance';
import { userData } from '@/utils/atom';
import { useStorageState } from '@/utils/useStorageState';
import { signin } from '@/mutations/auth/signin';
import { googleSignIn, googleSignUp } from '@/mutations/auth/googleAuth';
import { signInWithGoogle, signOutFromGoogle } from '@/utils/googleAuth';
import { AuthUser, GoogleAuthData } from '@/types/auth';

type LoginPayloadStatus = 'error' | 'success';

interface LoginPayload {
    status: LoginPayloadStatus;
    message?: string;
}

interface SessionData {
    token: string;
    userId: string;
    expiresAt?: number;
}

interface Credentials {
    username: string;
    password: string;
}

interface ErrorData {
    message: string;
}

interface AuthContextProps {
    login: (credentials: Credentials) => Promise<LoginPayload> | null;
    googleLogin: () => Promise<LoginPayload> | null;
    googleSignup: () => Promise<LoginPayload> | null;
    logout: () => void;
    axiosInstance: any;
    session?: SessionData | null;
    user?: AuthUser | null;
    isLoading: boolean;
    // Helper functions for user status checking
    isApprovedUser: () => boolean;
    isPendingUser: () => boolean;
    isRejectedUser: () => boolean;
    canMakeRequests: () => boolean;
    canAddToCart: () => boolean;
}

const AuthContext = createContext<AuthContextProps>({
    login: () => null,
    googleLogin: () => null,
    googleSignup: () => null,
    logout: () => null,
    axiosInstance: null,
    session: null,
    user: null,
    isLoading: false,
    isApprovedUser: () => false,
    isPendingUser: () => false,
    isRejectedUser: () => false,
    canMakeRequests: () => false,
    canAddToCart: () => false,
});

export function useContextProvider(): AuthContextProps {
    const value = useContext(AuthContext);
    if (process.env.NODE_ENV !== 'production') {
        if (!value) {
            throw new Error('useSession must be wrapped in a <SessionProvider />');
        }
    }
    return value;
}

export const ContextProvider: React.FC<React.PropsWithChildren> = (props) => {
    const setUserState = useSetRecoilState(userData);
    const resetUserState = useResetRecoilState(userData);
    const [[isLoading, session], setSession] = useStorageState('session');
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [user, setUser] = useState<AuthUser | null>(null);

    const logout = useCallback(async () => {
        try {
            // Sign out from Google if signed in
            try {
                await signOutFromGoogle();
            } catch (error) {
                console.log('Not signed in to Google or error signing out:', error);
            }
            
            await AsyncStorage.removeItem('user');
            setSession(null);
            setUser(null);
            resetUserState();
            setIsAuthenticating(false);
            router.replace('/');
        } catch (error) {
            console.error('Error during logout:', error);
            setIsAuthenticating(false);
        }
    }, [setSession, resetUserState]);

    const axiosInstance = useMemo(
        () => (session?.token ? getAxiosInstance(session, logout) : null),
        [session?.token, logout],
    );

    // Helper functions for user status checking
    const isApprovedUser = useCallback(() => {
        return user?.status === 'APPROVED';
    }, [user?.status]);

    const isPendingUser = useCallback(() => {
        return user?.status === 'PENDING';
    }, [user?.status]);

    const isRejectedUser = useCallback(() => {
        return user?.status === 'REJECTED';
    }, [user?.status]);

    const canMakeRequests = useCallback(() => {
        // Only approved users can make requests
        return isApprovedUser();
    }, [isApprovedUser]);

    const canAddToCart = useCallback(() => {
        // Only approved users can add to cart
        return isApprovedUser();
    }, [isApprovedUser]);

    useEffect(() => {
        const validateSession = async () => {
            if (isLoading) return;
            if (session?.token && session?.userId) {
                // Load user data from AsyncStorage if available
                try {
                    const userDataString = await AsyncStorage.getItem('user');
                    if (userDataString) {
                        const userData = JSON.parse(userDataString);
                        setUser(userData);
                    }
                } catch (error) {
                    console.error('Error loading user data:', error);
                }
                router.replace('/authenticated');
            }
        };
        validateSession();
    }, [session, isLoading, isAuthenticating]);

    const login = useCallback(
        async (credentials: Credentials): Promise<LoginPayload> => {
            setIsAuthenticating(true);
            try {
                const { accessToken, user } = await signin(credentials);

                if (!accessToken || !user?.id) {
                    throw new Error('Invalid response format');
                }

                const sessionData: SessionData = {
                    token: accessToken,
                    userId: user.id.toString(),
                };

                await Promise.all([
                    AsyncStorage.setItem('user', JSON.stringify(user)),
                    setSession(sessionData),
                    new Promise((resolve) => setUserState(user)),
                ]);

                // Set user in local state
                setUser(user);

                return { status: 'success' };
            } catch (error) {
                const axiosError = error as AxiosError<ErrorData>;
                const errorMessage =
                    axiosError.response?.data?.message ||
                    'Authentication failed. Please try again.';
                return {
                    status: 'error',
                    message: errorMessage,
                };
            } finally {
                setIsAuthenticating(false);
            }
        },
        [setSession, setUserState],
    );

    const googleLogin = useCallback(
        async (): Promise<LoginPayload> => {
            setIsAuthenticating(true);
            try {
                // Get Google auth data
                const googleAuthData = await signInWithGoogle();
                
                let accessToken: string;
                let user: any;
                
                try {
                    const apiResponse = await googleSignIn(googleAuthData);
                    accessToken = apiResponse.accessToken;
                    user = apiResponse.user;
                    
                } catch (apiError) {
                    console.error('Google signin API error:', apiError);
                    throw apiError;
                }

                if (!accessToken || !user?.id) {
                    throw new Error('Invalid response format from Google signin');
                }

                const sessionData: SessionData = {
                    token: accessToken,
                    userId: user.id.toString(),
                };

                console.log('Storing user session...');
                await Promise.all([
                    AsyncStorage.setItem('user', JSON.stringify(user)),
                    setSession(sessionData),
                    new Promise((resolve) => setUserState(user)),
                ]);

                // Set user in local state
                setUser(user);
                console.log('Google login successful!');

                return { status: 'success' };
            } catch (error) {
                console.error('Google login error:', error);
                
                let errorMessage = 'Google authentication failed. Please try again.';
                
                if (error instanceof Error) {
                    if (error.message.includes('dismissed')) {
                        errorMessage = 'Sign-in was dismissed. Please try again and complete the sign-in process.';
                    } else if (error.message.includes('cancelled')) {
                        errorMessage = 'Sign-in was cancelled. Please try again if you want to sign in.';
                    } else {
                        errorMessage = error.message;
                    }
                } else if (typeof error === 'object' && error !== null && 'message' in error) {
                    errorMessage = (error as any).message;
                }
                
                return {
                    status: 'error',
                    message: errorMessage,
                };
            } finally {
                setIsAuthenticating(false);
            }
        },
        [setSession, setUserState],
    );

    const googleSignup = useCallback(
        async (): Promise<LoginPayload> => {
            setIsAuthenticating(true);
            try {
                // Get Google auth data
                const googleAuthData = await signInWithGoogle();
                
                // Call Google signup API
                const { user } = await googleSignUp(googleAuthData);

                if (!user?.id) {
                    throw new Error('Invalid response format from Google signup');
                }

                // For signup, we might not get a token immediately
                // The user might need to be approved first
                if (user.status === 'PENDING') {
                    // Store user data but don't create session yet
                    await AsyncStorage.setItem('user', JSON.stringify(user));
                    setUser(user);
                    
                    return { 
                        status: 'success',
                        message: 'Account created successfully. Please wait for approval.'
                    };
                }

                // If user is approved, create session
                const sessionData: SessionData = {
                    token: 'temp-token', // You might need to adjust this based on your API
                    userId: user.id.toString(),
                };

                await Promise.all([
                    AsyncStorage.setItem('user', JSON.stringify(user)),
                    setSession(sessionData),
                    new Promise((resolve) => setUserState(user)),
                ]);

                setUser(user);

                return { status: 'success' };
            } catch (error) {
                const axiosError = error as AxiosError<ErrorData>;
                const errorMessage =
                    axiosError.response?.data?.message ||
                    'Google signup failed. Please try again.';
                return {
                    status: 'error',
                    message: errorMessage,
                };
            } finally {
                setIsAuthenticating(false);
            }
        },
        [setSession, setUserState],
    );

    return (
        <AuthContext.Provider
            value={{
                login,
                googleLogin,
                googleSignup,
                logout,
                session,
                user,
                isLoading: isAuthenticating || isLoading,
                axiosInstance,
                isApprovedUser,
                isPendingUser,
                isRejectedUser,
                canMakeRequests,
                canAddToCart,
            }}>
            {props.children}
        </AuthContext.Provider>
    );
};
