import { useContextProvider } from '@/context/ctx';
import { BASE_URL } from '@/constants/api';

export interface RequestLimitInfo {
    canMakeRequest: boolean;
    currentCount: number;
    maxAllowed: number;
    remainingRequests: number;
    resetDate: Date;
}

// Constants for request limits
export const REQUEST_LIMITS = {
    MAX_REQUESTS_PER_MONTH: 5,
    MAX_APPROVED_REQUESTS: 3,
} as const;

export const checkRequestLimit = async (): Promise<RequestLimitInfo> => {
    const { user, axiosInstance } = useContextProvider();
    
    if (!user || !axiosInstance) {
        return {
            canMakeRequest: false,
            currentCount: 0,
            maxAllowed: 0,
            remainingRequests: 0,
            resetDate: new Date(),
        };
    }

    try {
        const searchParams = new URLSearchParams();
    
        if (user) searchParams.append('userId', user.id.toString());

        const response = await axiosInstance.get(`${BASE_URL}/medicine/request-limits?${searchParams.toString()}`);
        const { currentCount, approvedCount } = response.data;
        
        // Check if user has reached the monthly limit
        const hasReachedMonthlyLimit = currentCount >= REQUEST_LIMITS.MAX_REQUESTS_PER_MONTH;
        
        // Check if user has reached the approved requests limit
        const hasReachedApprovedLimit = approvedCount >= REQUEST_LIMITS.MAX_APPROVED_REQUESTS;
        
        const canMakeRequest = !hasReachedMonthlyLimit && !hasReachedApprovedLimit;
        
        // Calculate remaining requests
        const remainingRequests = Math.max(0, REQUEST_LIMITS.MAX_REQUESTS_PER_MONTH - currentCount);
        
        // Calculate next month reset date
        const now = new Date();
        const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        
        return {
            canMakeRequest,
            currentCount,
            maxAllowed: REQUEST_LIMITS.MAX_REQUESTS_PER_MONTH,
            remainingRequests,
            resetDate,
        };
    } catch (error) {
        console.error('Error checking request limits:', error);
        
        // Return default values on error
        return {
            canMakeRequest: false,
            currentCount: 0,
            maxAllowed: REQUEST_LIMITS.MAX_REQUESTS_PER_MONTH,
            remainingRequests: 0,
            resetDate: new Date(),
        };
    }
};

/**
 * Get a user-friendly message about their request limits
 */
export const getRequestLimitMessage = (limitInfo: RequestLimitInfo): string => {
    if (limitInfo.canMakeRequest) {
        return `You can make ${limitInfo.remainingRequests} more request(s) this month.`;
    }
    
    if (limitInfo.currentCount >= REQUEST_LIMITS.MAX_REQUESTS_PER_MONTH) {
        return `You have reached your monthly limit of ${limitInfo.maxAllowed} requests. Limit resets on ${limitInfo.resetDate.toLocaleDateString()}.`;
    }
    
    return 'You have reached the maximum number of approved requests.';
};

/**
 * Check if user can make a request (simple boolean check)
 */
export const canMakeRequest = async (): Promise<boolean> => {
    const limitInfo = await checkRequestLimit();
    return limitInfo.canMakeRequest;
};
