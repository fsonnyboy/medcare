import { Stack } from 'expo-router';

export default function AuthenticatedLayout() {
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