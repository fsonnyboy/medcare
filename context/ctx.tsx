import React, { useState, useContext, createContext, useEffect, useCallback, useMemo } from 'react';
import axios, { AxiosError } from 'axios';
import { useResetRecoilState, useSetRecoilState } from 'recoil';
import { BASE_URL } from '@/constants/api';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAxiosInstance } from '@/utils/axiosInstance';
import { userData } from '@/utils/atom';
import { useStorageState } from '@/utils/useStorageState';

type LoginPayloadStatus = 'error' | 'success';

interface LoginPayload {
    status: LoginPayloadStatus;
    message?: string;
}

interface SessionData {
    token: string;
    userId: string;
    ownerId: number;
    expiresAt?: number;
}

interface Credentials {
    email: string;
    password: string;
}

interface ErrorData {
    message: string;
}

interface LoginResponse {
    message: string;
    token: string;
    userData: {
        id: string;
        email: string;
        ownerId: number;
    };
}

interface AuthContextProps {
    login: (credentials: Credentials) => Promise<LoginPayload> | null;
    logout: () => void;
    axiosInstance: any;
    session?: SessionData | null;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextProps>({
    login: () => null,
    logout: () => null,
    axiosInstance: null,
    session: null,
    isLoading: false,
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

    const logout = useCallback(async () => {
        try {
            await AsyncStorage.removeItem('user');
            setSession(null);
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

    useEffect(() => {
        const validateSession = async () => {
            if (isLoading) return;
            if (session?.token && session?.userId) {
                router.replace('/authenticated');
            }
        };
        validateSession();
    }, [session, isLoading, isAuthenticating]);

    const login = useCallback(
        async (credentials: Credentials): Promise<LoginPayload> => {
            setIsAuthenticating(true);
            try {
                const response = await axios.post<LoginResponse>(
                    `${BASE_URL}/auth/login`,
                    credentials,
                    { timeout: 10000 },
                );

                const { token, userData } = response.data;
                if (!token || !userData?.id) {
                    throw new Error('Invalid response format');
                }

                const sessionData: SessionData = {
                    token,
                    userId: userData.id,
                    ownerId: userData.ownerId,
                };

                await Promise.all([
                    AsyncStorage.setItem('user', JSON.stringify(userData)),
                    setSession(sessionData),
                    new Promise((resolve) => setUserState(userData)),
                ]);

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

    return (
        <AuthContext.Provider
            value={{
                login,
                logout,
                session,
                isLoading: isAuthenticating || isLoading,
                axiosInstance,
            }}>
            {props.children}
        </AuthContext.Provider>
    );
};
