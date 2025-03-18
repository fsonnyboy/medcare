import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { SessionData } from '@/types/auth';
import { useCallback, useEffect, useReducer } from 'react';

type UseStateHook<T> = [[boolean, T | null], (value: T | null) => void];

function useAsyncState<T>(initialValue: [boolean, T | null] = [true, null]): UseStateHook<T> {
    return useReducer(
        (state: [boolean, T | null], action: T | null = null): [boolean, T | null] => [
            false,
            action,
        ],
        initialValue,
    ) as UseStateHook<T>;
}

const parseStorageValue = (value: string | null): SessionData | null => {
    if (!value) return null;

    try {
        const parsed = JSON.parse(value);
        if (parsed.token && parsed.userId) {
            return parsed as SessionData;
        }

        if (value.startsWith('ey')) {
            const payload = JSON.parse(atob(value.split('.')[1]));
            return {
                token: value,
                userId: payload.userId || payload.id,
                ownerId: payload.ownerId,
            };
        }

        return null;
    } catch (error) {
        console.error('Failed to parse storage value:', error);
        return null;
    }
};

export async function setStorageItemAsync(key: string, value: string | null) {
    if (Platform.OS === 'web') {
        try {
            if (value === null) {
                localStorage.removeItem(key);
            } else {
                localStorage.setItem(key, value);
            }
        } catch (e) {
            console.error('Local storage is unavailable:', e);
        }
    } else {
        try {
            if (value == null) {
                await SecureStore.deleteItemAsync(key);
            } else {
                await SecureStore.setItemAsync(key, value);
            }
        } catch (e) {
            console.error('SecureStore operation failed:', e);
        }
    }
}

export function useStorageState(key: string): UseStateHook<SessionData> {
    const [state, setState] = useAsyncState<SessionData>();

    useEffect(() => {
        let isMounted = true;

        const loadStorageData = async () => {
            try {
                const value =
                    Platform.OS === 'web'
                        ? localStorage.getItem(key)
                        : await SecureStore.getItemAsync(key);

                const parsedValue = value ? parseStorageValue(value) : null;

                if (isMounted) {
                    setState(parsedValue);
                }
            } catch (error) {
                console.error('Failed to load session:', error);
                if (isMounted) {
                    setState(null);
                }
            }
        };

        loadStorageData();
        return () => {
            isMounted = false;
        };
    }, [key]);

    const setValue = useCallback(
        async (value: SessionData | null) => {
            try {
                const storageValue = value ? JSON.stringify(value) : null;
                await setStorageItemAsync(key, storageValue);
                setState(value);
            } catch (error) {
                console.error('Failed to set session:', error);
                setState(null);
            }
        },
        [key],
    );

    return [state, setValue];
}
