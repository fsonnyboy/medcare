import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useUserStatusPolling } from '@/hooks/useUserStatusPolling';

export default function AuthenticatedLayout() {
  // Set up user status polling for real-time updates
  useUserStatusPolling({
    enabled: true,
    intervalMs: 30000, // Check every 30 seconds
    onStatusChange: (oldStatus, newStatus) => {
      if (oldStatus === 'PENDING' && newStatus === 'APPROVED') {
        Alert.alert(
          'Account Approved! 🎉',
          'Your account has been approved! You can now request medicines and add items to your cart.',
          [{ text: 'Great!', style: 'default' }]
        );
      } else if (oldStatus === 'PENDING' && newStatus === 'REJECTED') {
        Alert.alert(
          'Account Rejected',
          'Your account has been rejected. Please contact support for more information.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    }
  });

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="medicine-detail" 
        options={{ 
          title: 'Medicine Details',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="request-medicine" 
        options={{ 
          title: 'Request Medicine',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="categories" 
        options={{ 
          title: 'Categories',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="recommended" 
        options={{ 
          title: 'Recommended',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="update-profile" 
        options={{ 
          title: 'Update Profile',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="add-to-cart" 
        options={{ 
          title: 'Add to Cart',
          headerShown: false 
        }} 
      />
    </Stack>
  );
} 