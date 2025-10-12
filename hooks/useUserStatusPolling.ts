import { useEffect, useRef, useCallback } from 'react';
import { useContextProvider } from '@/context/ctx';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface UseUserStatusPollingOptions {
    enabled?: boolean;
    intervalMs?: number;
    onStatusChange?: (oldStatus: string, newStatus: string) => void;
}

export const useUserStatusPolling = (options: UseUserStatusPollingOptions = {}) => {
    const { enabled = true, intervalMs = 30000, onStatusChange } = options; // Default 30 seconds
    const { refreshUserData, user } = useContextProvider();
    const { userStatus } = useUserPermissions();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastStatusRef = useRef<string | null>(null);

    const startPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(async () => {
            try {
                const previousStatus = lastStatusRef.current;
                await refreshUserData();
                
                // Check if status changed
                if (previousStatus && previousStatus !== userStatus && onStatusChange) {
                    onStatusChange(previousStatus, userStatus);
                }
                
                lastStatusRef.current = userStatus;
            } catch (error) {
                console.error('Error during user status polling:', error);
            }
        }, intervalMs);
    }, [refreshUserData, userStatus, onStatusChange, intervalMs]);

    const stopPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        // Initialize last status
        if (user?.status) {
            lastStatusRef.current = user.status;
        }
    }, [user?.status]);

    useEffect(() => {
        if (enabled && user?.status === 'PENDING') {
            // Only poll for pending users to check for approval
            startPolling();
        } else {
            stopPolling();
        }

        return () => {
            stopPolling();
        };
    }, [enabled, user?.status, startPolling, stopPolling]);

    return {
        startPolling,
        stopPolling,
        isPolling: intervalRef.current !== null,
    };
};
