import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { ViewLayout } from '@/components/view-layout';
import ThemedText from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useContextProvider } from '@/context/ctx';
import { getMedicineById, MedicineByIdResponse } from '@/queries/medicine/medicineById';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { PermissionGate } from '@/components/PermissionGate';
import { Image } from 'react-native';

export default function MedicineDetail() {
    const params = useLocalSearchParams();
    const { axiosInstance, refreshUserData } = useContextProvider();
    const { canAddToCart, canRequestMedicine, isApprovedUser, isPendingUser } = useUserPermissions();
    const [medicine, setMedicine] = useState<MedicineByIdResponse['medicine'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const medicineId = params.id ? parseInt(params.id as string) : null;

    useEffect(() => {
        const fetchMedicine = async () => {
            if (!medicineId || !axiosInstance) {
                setError('Invalid medicine ID or not authenticated');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const response = await getMedicineById(axiosInstance, medicineId);
                setMedicine(response.medicine);
            } catch (err: any) {
                console.error('Error fetching medicine:', err);
                setError(err.response?.data?.error || 'Failed to fetch medicine details');
            } finally {
                setLoading(false);
            }
        };

        fetchMedicine();
    }, [medicineId, axiosInstance]);

    const handleRequestNow = () => {
        // Check if user can make requests
        if (!canRequestMedicine()) {
            if (isPendingUser()) {
                Alert.alert('Account Pending', 'Your account is pending approval. You can only view content at this time.');
            } else {
                Alert.alert('Permission Denied', 'Your account status does not allow medicine requests.');
            }
            return;
        }
        
        if (medicine) {
            router.push(`/authenticated/request-medicine?id=${medicine.id}` as any);
        }
    };

    const handleAddToCart = () => {
        // Check if user can add to cart
        if (!canAddToCart()) {
            if (isPendingUser()) {
                Alert.alert('Account Pending', 'Your account is pending approval. You can only view content at this time.');
            } else {
                Alert.alert('Permission Denied', 'Your account status does not allow adding items to cart.');
            }
            return;
        }
        
        if (medicine) {
            router.push(`/authenticated/add-to-cart?id=${medicine.id}` as any);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short' 
        });
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await refreshUserData();
            // Re-fetch medicine data
            if (medicineId && axiosInstance) {
                const response = await getMedicineById(axiosInstance, medicineId);
                setMedicine(response.medicine);
            }
        } catch (error) {
            console.error('Error refreshing medicine detail:', error);
        } finally {
            setRefreshing(false);
        }
    };

    if (loading) {
        return (
            <ViewLayout scrollEnabled={false}>
                <View className="flex-1 justify-center items-center h-full">
                    <ActivityIndicator size="large" color="#f8f8ff" />
                    <ThemedText weight="medium" className="mt-4 text-[#f8f8ff]">
                        Loading medicine details...
                    </ThemedText>
                </View>
            </ViewLayout>
        );
    }

    if (error || !medicine) {
        return (
            <ViewLayout scrollEnabled={false}>
                <View className="flex-1 justify-center items-center px-6">
                    <Ionicons name="alert-circle" size={64} color="#EF4444" />
                    <ThemedText weight="bold" className="mt-4 text-xl text-gray-800">
                        Error Loading Medicine
                    </ThemedText>
                    <ThemedText weight="regular" className="mt-2 text-center text-gray-600">
                        {error || 'Medicine not found'}
                    </ThemedText>
                    <TouchableOpacity
                        className="mt-6 px-6 py-3 bg-[#0D8AED] rounded-xl"
                        onPress={() => router.back()}
                    >
                        <ThemedText weight="medium" className="text-white">
                            Go Back
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </ViewLayout>
        );
    }

    return (
        <ViewLayout 
            scrollEnabled={true}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#3B82F6']}
                    tintColor="#3B82F6"
                />
            }
        >
            <View className="flex-1">
                {/* Header */}
                <View className="px-6 pt-12 pb-4">
                    <View className="flex-row justify-between items-center">
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <ThemedText weight="bold" className="flex-1 text-lg text-center text-white">
                            Medicine Details
                        </ThemedText>
                    </View>
                </View>

                {/* Permission Status Message */}
                {(!canAddToCart() || !canRequestMedicine()) && (
                    <View className="px-6 pb-4">
                        <View className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <View className="flex-row items-center justify-center">
                                <Ionicons name="information-circle" size={16} color="#3B82F6" />
                                <ThemedText weight="medium" className="ml-2 text-blue-700 text-center">
                                    {isPendingUser() 
                                        ? 'Your account is pending approval. You can view medicine details but cannot make requests or add to cart until approved.'
                                        : 'You have limited permissions for this medicine. Contact support if you believe this is an error.'
                                    }
                                </ThemedText>
                            </View>
                        </View>
                    </View>
                )}

                <View className="flex-1 px-6">
                    {/* Product Overview Card */}
                    <View className="p-6 mt-6 mb-4 bg-[#E7F3FE] rounded-xl shadow-sm">
                        <View className="flex-row">
                            {/* Product Icon */}
                            <View className="justify-center items-center mr-4 w-20 h-20 bg-blue-100 rounded-xl">
                                {medicine.image ? (
                                    <Image source={{ uri: medicine.image }} className="w-20 h-20 rounded-xl" />
                                ) : (
                                    <Ionicons name="medical-outline" size={40} color="#3B82F6" />
                                )}
                            </View>
                            
                            {/* Product Details */}
                            <View className="flex-1">
                                <ThemedText weight="bold" className="mb-1 text-xl text-gray-800">
                                    {medicine.name}
                                </ThemedText>
                                <ThemedText weight="regular" className="mb-3 text-gray-600">
                                    {medicine.brand}
                                </ThemedText>
                                
                                {/* Tags */}
                                <View className="flex-row mb-3 space-x-2">
                                    <View className="px-3 py-1 rounded-full border border-gray-300">
                                        <ThemedText weight="medium" className="text-xs text-gray-700">
                                            {medicine.type}
                                        </ThemedText>
                                    </View>
                                    <View className={`px-3 py-1 rounded-full ${medicine.stock > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                                        <ThemedText weight="medium" className={`text-xs ${medicine.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {medicine.stock > 0 ? 'In Stock' : 'Out of Stock'}
                                        </ThemedText>
                                    </View>
                                    {medicine.recommended && (
                                        <View className="px-3 py-1 bg-yellow-100 rounded-full">
                                            <ThemedText weight="medium" className="text-xs text-yellow-600">
                                                Recommended
                                            </ThemedText>
                                        </View>
                                    )}
                                </View>
                                
                                {/* Stock Info */}
                                <View className="flex-row items-center">
                                    <Ionicons name="cube-outline" size={16} color="#6B7280" />
                                    <ThemedText weight="medium" className="ml-1 text-gray-800">
                                        Stock: {medicine.stock} units
                                    </ThemedText>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Product Information Card */}
                    <View className="p-6 mb-4 bg-[#E7F3FE] rounded-xl shadow-sm">
                        <ThemedText weight="bold" className="mb-4 text-lg text-gray-800">
                            Product Information
                        </ThemedText>
                        <View className="space-y-3">
                            <View className="flex-row justify-between">
                                <ThemedText weight="medium" className="text-gray-600">Brand</ThemedText>
                                <ThemedText weight="medium" className="text-gray-800">{medicine.brand}</ThemedText>
                            </View>
                            <View className="flex-row justify-between">
                                <ThemedText weight="medium" className="text-gray-600">Type</ThemedText>
                                <ThemedText weight="medium" className="text-gray-800">{medicine.type}</ThemedText>
                            </View>
                            <View className="flex-row justify-between">
                                <ThemedText weight="medium" className="text-gray-600">Dosage Form</ThemedText>
                                <ThemedText weight="medium" className="text-gray-800">{medicine.dosageForm}</ThemedText>
                            </View>
                            <View className="flex-row justify-between">
                                <ThemedText weight="medium" className="text-gray-600">Size</ThemedText>
                                <ThemedText weight="medium" className="text-gray-800">{medicine.size}</ThemedText>
                            </View>
                            <View className="flex-row justify-between">
                                <ThemedText weight="medium" className="text-gray-600">Expiry Date</ThemedText>
                                <ThemedText weight="medium" className="text-gray-800">
                                    {medicine.expiryDate ? formatDate(medicine.expiryDate) : 'Not specified'}
                                </ThemedText>
                            </View>
                            {medicine.categories && medicine.categories.length > 0 && (
                                <View className="flex-row justify-between">
                                    <ThemedText weight="medium" className="text-gray-600">Categories</ThemedText>
                                    <ThemedText weight="medium" className="text-gray-800">
                                        {medicine.categories.map(cat => cat.name).join(', ')}
                                    </ThemedText>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Description Card */}
                    {medicine.description && (
                        <View className="p-6 mb-6 bg-[#E7F3FE] rounded-xl shadow-sm">
                            <ThemedText weight="bold" className="mb-4 text-lg text-gray-800">
                                Description
                            </ThemedText>
                            <ThemedText weight="regular" className="leading-6 text-gray-700">
                                {medicine.description}
                            </ThemedText>
                        </View>
                    )}
                </View>

                {/* Bottom Action Buttons */}
                <View className="gap-2 px-6 py-4 space-y-3">
                    {/* Add to Cart Button */}
                    <PermissionGate requireCanAddToCart fallback={
                        <View className="p-4 bg-gray-100 rounded-xl">
                            <View className="flex-row items-center justify-center">
                                <Ionicons name="information-circle" size={20} color="#6B7280" />
                                <ThemedText weight="medium" className="ml-2 text-gray-600 text-center">
                                    {isPendingUser() 
                                        ? 'Your account is pending approval. You can only view content at this time.'
                                        : 'You do not have permission to add items to cart.'
                                    }
                                </ThemedText>
                            </View>
                        </View>
                    }>
                        <TouchableOpacity
                            className={`flex-row justify-center items-center py-4 rounded-xl ${
                                medicine.stock > 0 ? 'bg-[#10B981]' : 'bg-gray-400'
                            }`}
                            onPress={handleAddToCart}
                            disabled={medicine.stock <= 0}
                        >
                            <Ionicons name="cart" size={20} color="white" />
                            <ThemedText weight="semibold" className="ml-2 text-lg text-white">
                                {medicine.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                            </ThemedText>
                        </TouchableOpacity>
                    </PermissionGate>

                    {/* Request Now Button */}
                    <PermissionGate requireCanMakeRequests fallback={
                        <View className="p-4 bg-gray-100 rounded-xl">
                            <View className="flex-row items-center justify-center">
                                <Ionicons name="information-circle" size={20} color="#6B7280" />
                                <ThemedText weight="medium" className="ml-2 text-gray-600 text-center">
                                    {isPendingUser() 
                                        ? 'Your account is pending approval. You can only view content at this time.'
                                        : 'You do not have permission to make medicine requests.'
                                    }
                                </ThemedText>
                            </View>
                        </View>
                    }>
                        <TouchableOpacity
                            className={`flex-row justify-center items-center py-4 rounded-xl ${
                                medicine.stock > 0 ? 'bg-[#0D8AED]' : 'bg-gray-400'
                            }`}
                            onPress={handleRequestNow}
                            disabled={medicine.stock <= 0}
                        >
                            <Ionicons name="flash" size={20} color="white" />
                            <ThemedText weight="semibold" className="ml-2 text-lg text-white">
                                {medicine.stock > 0 ? 'Request Now' : 'Out of Stock'}
                            </ThemedText>
                        </TouchableOpacity>
                    </PermissionGate>
                </View>
            </View>
        </ViewLayout>
    );
} 