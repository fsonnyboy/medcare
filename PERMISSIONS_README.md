# User Permissions System

This document explains how to use the user permissions system implemented in the mobile template app.

## Overview

The permission system enforces the following constraints:
- **Only Approved users** can request medicines and add items to cart
- **Pending users** can only view screens
- **Users are limited to 5 requests per month**
- **If admin approves 3 requests, user cannot make more requests**

## Components

### 1. Auth Context (`context/ctx.tsx`)

The main context provider that manages user authentication and provides permission checking functions.

**Key Functions:**
- `isApprovedUser()` - Check if user is approved
- `isPendingUser()` - Check if user is pending approval
- `isRejectedUser()` - Check if user is rejected
- `canMakeRequests()` - Check if user can make requests
- `canAddToCart()` - Check if user can add to cart

### 2. User Permissions Hook (`hooks/useUserPermissions.ts`)

A comprehensive hook that provides easy access to all permission-related functions and state.

**Key Features:**
- User status checking
- Request limit information
- Permission validation
- Request limit refresh functionality

**Usage:**
```tsx
import { useUserPermissions } from '@/hooks/useUserPermissions';

function MyComponent() {
    const { 
        canRequestMedicine, 
        hasReachedRequestLimits, 
        remainingRequests,
        isApprovedUser 
    } = useUserPermissions();
    
    // Use permission checks in your component
}
```

### 3. Permission Gate Component (`components/PermissionGate.tsx`)

A component that conditionally renders content based on user permissions.

**Props:**
- `requireApproved` - Only show for approved users
- `requirePending` - Only show for pending users
- `requireCanMakeRequests` - Only show for users who can make requests
- `requireCanAddToCart` - Only show for users who can add to cart
- `fallback` - Content to show when permission is denied
- `showStatusMessage` - Show a default status message

**Usage:**
```tsx
import { PermissionGate, ApprovedUserOnly } from '@/components/PermissionGate';

// Basic usage
<PermissionGate requireApproved>
    <TouchableOpacity onPress={handleSubmit}>
        <Text>Submit Request</Text>
    </TouchableOpacity>
</PermissionGate>

// With fallback
<ApprovedUserOnly fallback={
    <Text>You need approval to perform this action</Text>
}>
    <TouchableOpacity onPress={handleSubmit}>
        <Text>Submit Request</Text>
    </TouchableOpacity>
</ApprovedUserOnly>
```

### 4. Request Limits Utility (`utils/requestLimits.ts`)

Utilities for checking and managing user request limits.

**Key Functions:**
- `checkRequestLimit()` - Get current request limit status
- `canMakeRequest()` - Simple boolean check
- `getRequestLimitMessage()` - User-friendly message

## Implementation Examples

### Example 1: Conditional Button Rendering

```tsx
import { useUserPermissions } from '@/hooks/useUserPermissions';

function RequestButton() {
    const { canRequestMedicine, remainingRequests } = useUserPermissions();
    
    if (!canRequestMedicine()) {
        return (
            <View className="p-4 bg-gray-100 rounded-lg">
                <Text>You cannot make requests at this time</Text>
            </View>
        );
    }
    
    return (
        <TouchableOpacity className="bg-blue-500 p-4 rounded-lg">
            <Text>Submit Request ({remainingRequests} remaining)</Text>
        </TouchableOpacity>
    );
}
```

### Example 2: Using Permission Gate

```tsx
import { CanMakeRequestsOnly } from '@/components/PermissionGate';

function MedicineRequestForm() {
    return (
        <View>
            <Text>Medicine Request Form</Text>
            
            <CanMakeRequestsOnly fallback={
                <View className="p-4 bg-yellow-100 rounded-lg">
                    <Text>Your account is pending approval</Text>
                </View>
            }>
                <FormFields />
                <SubmitButton />
            </CanMakeRequestsOnly>
        </View>
    );
}
```

### Example 3: Request Limit Checking

```tsx
import { checkRequestLimit } from '@/utils/requestLimits';

async function handleSubmitRequest() {
    const limitInfo = await checkRequestLimit();
    
    if (!limitInfo.canMakeRequest) {
        Alert.alert('Limit Reached', 'You have reached your monthly request limit');
        return;
    }
    
    // Proceed with request submission
    submitRequest();
}
```

## Backend Integration

The current implementation includes placeholder logic for request limits. To fully implement the system, you'll need to:

1. **Create API endpoints** to track user request counts
2. **Update the `checkRequestLimit` function** in `utils/requestLimits.ts` to call your backend
3. **Implement monthly reset logic** on your backend
4. **Track approved vs pending requests** separately

**Example Backend Endpoint:**
```
GET /api/users/{userId}/request-limits
Response: {
    currentCount: 2,
    approvedCount: 1,
    maxAllowed: 5,
    resetDate: "2024-02-01T00:00:00Z"
}
```

## Best Practices

1. **Always check permissions** before allowing actions
2. **Use the PermissionGate component** for UI elements that require specific permissions
3. **Provide clear feedback** when permissions are denied
4. **Cache permission results** when possible to avoid repeated API calls
5. **Handle edge cases** like network errors gracefully

## Testing

To test the permission system:

1. **Create test users** with different statuses (PENDING, APPROVED, REJECTED)
2. **Test request limits** by making multiple requests
3. **Verify UI updates** when permissions change
4. **Test error handling** for network failures

## Troubleshooting

**Common Issues:**
- **Permission checks not working**: Ensure the component is wrapped in `ContextProvider`
- **Request limits not updating**: Check if `refreshRequestLimits()` is called after requests
- **UI not hiding/showing**: Verify the correct permission props are passed to `PermissionGate`

**Debug Tips:**
- Use `console.log` to check permission values
- Verify user status in the auth context
- Check if request limits are being fetched correctly
