import React from 'react';
import { View, Text } from 'react-native';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface PermissionGateProps {
    children: React.ReactNode;
    requireApproved?: boolean;
    requirePending?: boolean;
    requireCanMakeRequests?: boolean;
    requireCanAddToCart?: boolean;
    fallback?: React.ReactNode;
    showStatusMessage?: boolean;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
    children,
    requireApproved = false,
    requirePending = false,
    requireCanMakeRequests = false,
    requireCanAddToCart = false,
    fallback = null,
    showStatusMessage = false,
}) => {
    const {
        isApprovedUser,
        isPendingUser,
        canMakeRequests,
        canAddToCart,
        userStatus,
        needsApproval,
    } = useUserPermissions();

    // Check if user meets all requirements
    const hasPermission = () => {
        if (requireApproved && !isApprovedUser()) return false;
        if (requirePending && !isPendingUser()) return false;
        if (requireCanMakeRequests && !canMakeRequests()) return false;
        if (requireCanAddToCart && !canAddToCart()) return false;
        return true;
    };

    if (hasPermission()) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    if (showStatusMessage) {
        return (
            <View className="p-4 bg-gray-100 rounded-lg m-2">
                <Text className="text-gray-600 text-center">
                    {needsApproval 
                        ? 'Your account is pending approval. You can only view content at this time.'
                        : 'You do not have permission to perform this action.'
                    }
                </Text>
            </View>
        );
    }

    return null;
};

// Convenience components for common permission checks
export const ApprovedUserOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback,
}) => (
    <PermissionGate requireApproved fallback={fallback}>
        {children}
    </PermissionGate>
);

export const PendingUserOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback,
}) => (
    <PermissionGate requirePending fallback={fallback}>
        {children}
    </PermissionGate>
);

export const CanMakeRequestsOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback,
}) => (
    <PermissionGate requireCanMakeRequests fallback={fallback}>
        {children}
    </PermissionGate>
);

export const CanAddToCartOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback,
}) => (
    <PermissionGate requireCanAddToCart fallback={fallback}>
        {children}
    </PermissionGate>
);
