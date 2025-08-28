import { useCallback, useMemo, useState, useEffect } from 'react';
import { useContextProvider } from '@/context/ctx';
import { checkRequestLimit, RequestLimitInfo } from '@/queries/medicine/requestLimits';

export const useUserPermissions = () => {
    const { user, isApprovedUser, isPendingUser, isRejectedUser, canMakeRequests, canAddToCart } = useContextProvider();
    const [requestLimitInfo, setRequestLimitInfo] = useState<RequestLimitInfo | null>(null);
    const [isLoadingLimits, setIsLoadingLimits] = useState(false);

    // Load request limits when user changes
    useEffect(() => {
        const loadRequestLimits = async () => {
            if (!user || !isApprovedUser()) {
                setRequestLimitInfo(null);
                return;
            }

            setIsLoadingLimits(true);
            try {
                const limits = await checkRequestLimit();
                setRequestLimitInfo(limits);
            } catch (error) {
                console.error('Error loading request limits:', error);
            } finally {
                setIsLoadingLimits(false);
            }
        };

        loadRequestLimits();
    }, [user, isApprovedUser]);

    // Check if user can make requests (considering monthly limit)
    const canMakeRequestThisMonth = useCallback(() => {
        if (!isApprovedUser()) return false;
        return requestLimitInfo?.canMakeRequest ?? false;
    }, [isApprovedUser, requestLimitInfo]);

    // Check if user can add items to cart
    const canAddItemToCart = useCallback(() => {
        return canAddToCart();
    }, [canAddToCart]);

    // Check if user can view screens (all authenticated users can view)
    const canViewScreens = useCallback(() => {
        return !!user; // Any authenticated user can view
    }, [user]);

    // Check if user can make medicine requests
    const canRequestMedicine = useCallback(() => {
        return canMakeRequests() && canMakeRequestThisMonth();
    }, [canMakeRequests, canMakeRequestThisMonth]);

    // Get user status for display purposes
    const userStatus = useMemo(() => {
        if (!user) return 'UNAUTHENTICATED';
        return user.status;
    }, [user]);

    // Check if user needs approval
    const needsApproval = useMemo(() => {
        return userStatus === 'PENDING';
    }, [userStatus]);

    // Check if user is fully approved
    const isFullyApproved = useMemo(() => {
        return userStatus === 'APPROVED';
    }, [userStatus]);

    // Check if user has reached request limits
    const hasReachedRequestLimits = useMemo(() => {
        if (!requestLimitInfo) return false;
        return !requestLimitInfo.canMakeRequest;
    }, [requestLimitInfo]);

    // Get remaining requests count
    const remainingRequests = useMemo(() => {
        return requestLimitInfo?.remainingRequests ?? 0;
    }, [requestLimitInfo]);

    // Get current request count
    const currentRequestCount = useMemo(() => {
        return requestLimitInfo?.currentCount ?? 0;
    }, [requestLimitInfo]);

    // Get max allowed requests
    const maxAllowedRequests = useMemo(() => {
        return requestLimitInfo?.maxAllowed ?? 0;
    }, [requestLimitInfo]);

    // Refresh request limits
    const refreshRequestLimits = useCallback(async () => {
        if (!user || !isApprovedUser()) return;
        
        setIsLoadingLimits(true);
        try {
            const limits = await checkRequestLimit();
            setRequestLimitInfo(limits);
        } catch (error) {
            console.error('Error refreshing request limits:', error);
        } finally {
            setIsLoadingLimits(false);
        }
    }, [user, isApprovedUser]);

    return {
        // User status checks
        isApprovedUser,
        isPendingUser,
        isRejectedUser,
        userStatus,
        needsApproval,
        isFullyApproved,
        
        // Permission checks
        canViewScreens,
        canMakeRequests,
        canMakeRequestThisMonth,
        canAddToCart,
        canAddItemToCart,
        canRequestMedicine,
        
        // Request limit information
        requestLimitInfo,
        hasReachedRequestLimits,
        remainingRequests,
        currentRequestCount,
        maxAllowedRequests,
        isLoadingLimits,
        refreshRequestLimits,
        
        // User data
        user,
    };
};
