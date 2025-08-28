import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { ViewLayout } from '@/components/view-layout';
import ThemedText from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useContextProvider } from '@/context/ctx';
import { getMedicineById, MedicineByIdResponse } from '@/queries/medicine/medicineById';
import { addToCart } from '@/mutations/cart/addToCart';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { PermissionGate } from '@/components/PermissionGate';

export default function AddToCart() {
    const params = useLocalSearchParams();
    const { axiosInstance, session } = useContextProvider();
    const { canAddToCart, isApprovedUser, isPendingUser } = useUserPermissions();
    const [medicine, setMedicine] = useState<MedicineByIdResponse['medicine'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [quantity, setQuantity] = useState(1);

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

    const handleQuantityChange = (change: number) => {
        const newQuantity = Math.max(1, quantity + change);
        if (medicine && newQuantity <= medicine.stock) {
            setQuantity(newQuantity);
        }
    };

    const validateQuantity = () => {
        if (!medicine) return false;
        if (quantity <= 0) {
            Alert.alert('Error', 'Quantity must be at least 1');
            return false;
        }
        if (quantity > medicine.stock) {
            Alert.alert('Error', `Only ${medicine.stock} units available in stock`);
            return false;
        }
        return true;
    };

    const handleAddToCart = async () => {
        // Check if user can add to cart
        if (!canAddToCart()) {
            if (isPendingUser()) {
                Alert.alert('Account Pending', 'Your account is pending approval. You can only view content at this time.');
            } else {
                Alert.alert('Permission Denied', 'Your account status does not allow adding items to cart.');
            }
            return;
        }
        
        if (!validateQuantity()) return;
        if (!session?.userId || !medicine) return;

        try {
            setIsAddingToCart(true);
            
            const cartData = {
                userId: parseInt(session.userId),
                medicineId: medicine.id,
                quantity: quantity
            };

            const response = await addToCart(axiosInstance, cartData);
            
            Alert.alert(
                'Added to Cart Successfully',
                `${medicine.name} has been added to your cart. Total items in cart: ${response.cartCount}`,
                [
                    {
                        text: 'Continue Shopping',
                        onPress: () => router.back()
                    },
                    {
                        text: 'View Cart',
                        onPress: () => router.push('/authenticated/cart' as any)
                    }
                ]
            );
        } catch (err: any) {
            console.error('Error adding to cart:', err);
            
            let errorMessage = 'Failed to add item to cart';
            
            // Handle specific error types
            if (err.message.includes('stock')) {
                errorMessage = 'Insufficient stock available for this quantity';
            } else if (err.message.includes('already in cart')) {
                errorMessage = 'This item is already in your cart';
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            Alert.alert('Error', errorMessage);
        } finally {
            setIsAddingToCart(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short' 
        });
    };

    if (loading) {
        return (
            <ViewLayout scrollEnabled={false}>
                <View className="flex-1 justify-center items-center">
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
        <ViewLayout scrollEnabled={false}>
            <View className="flex-1">
                {/* Header */}
                <View className="px-6 pt-12 pb-4">
                    <View className="flex-row justify-between items-center">
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <ThemedText weight="bold" className="flex-1 text-lg text-center text-white">
                            Add to Cart
                        </ThemedText>
                        <View className="w-6" />
                    </View>
                </View>

                <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                    {/* Medicine Summary Card */}
                    <View className="p-6 mt-6 mb-4 bg-[#E7F3FE] rounded-xl shadow-sm">
                        <View className="flex-row items-center mb-3">
                            <Ionicons name="medical-outline" size={20} color="#3B82F6" />
                            <ThemedText weight="bold" className="ml-2 text-lg text-gray-800">
                                Medicine Summary
                            </ThemedText>
                        </View>
                        
                        <View className="flex-row">
                            {/* Product Icon */}
                            <View className="justify-center items-center mr-4 w-16 h-16 bg-blue-100 rounded-xl">
                                <Ionicons name="medical-outline" size={32} color="#3B82F6" />
                            </View>
                            
                            {/* Product Details */}
                            <View className="flex-1">
                                <ThemedText weight="bold" className="mb-1 text-lg text-gray-800">
                                    {medicine.name}
                                </ThemedText>
                                <ThemedText weight="regular" className="mb-2 text-gray-600">
                                    {medicine.brand}
                                </ThemedText>
                                
                                {/* Stock Status */}
                                <View className={`px-2 py-1 rounded-full ${medicine.stock > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                                    <ThemedText weight="medium" className={`text-xs ${medicine.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {medicine.stock > 0 ? `In Stock (${medicine.stock} available)` : 'Out of Stock'}
                                    </ThemedText>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Quantity Selection Card */}
                    <View className="p-6 mb-4 bg-[#E7F3FE] rounded-xl shadow-sm">
                        <View className="flex-row items-center mb-3">
                            <Ionicons name="cube-outline" size={20} color="#10B981" />
                            <ThemedText weight="bold" className="ml-2 text-lg text-gray-800">
                                Select Quantity
                            </ThemedText>
                        </View>
                        
                        <ThemedText weight="regular" className="mb-4 text-gray-600">
                            Choose how many units you want to add to your cart
                        </ThemedText>

                        {/* Quantity Controls */}
                        <View className="flex-row justify-center items-center">
                            <TouchableOpacity 
                                className={`justify-center items-center w-12 h-12 rounded-full ${
                                    quantity <= 1 ? 'bg-gray-300' : 'bg-blue-500'
                                }`}
                                onPress={() => handleQuantityChange(-1)}
                                disabled={quantity <= 1}
                            >
                                <Ionicons name="remove" size={20} color={quantity <= 1 ? "#9CA3AF" : "white"} />
                            </TouchableOpacity>
                            
                            <View className="mx-6">
                                <TextInput
                                    className="text-center text-2xl font-bold text-gray-800 min-w-[60px]"
                                    value={quantity.toString()}
                                    onChangeText={(value) => {
                                        const newQuantity = parseInt(value) || 1;
                                        if (newQuantity >= 1 && newQuantity <= (medicine?.stock || 1)) {
                                            setQuantity(newQuantity);
                                        }
                                    }}
                                    keyboardType="numeric"
                                    textAlign="center"
                                />
                                <ThemedText weight="medium" className="text-sm text-center text-gray-600">
                                    units
                                </ThemedText>
                            </View>
                            
                            <TouchableOpacity 
                                className={`justify-center items-center w-12 h-12 rounded-full ${
                                    quantity >= (medicine?.stock || 1) ? 'bg-gray-300' : 'bg-blue-500'
                                }`}
                                onPress={() => handleQuantityChange(1)}
                                disabled={quantity >= (medicine?.stock || 1)}
                            >
                                <Ionicons name="add" size={20} color={quantity >= (medicine?.stock || 1) ? "#9CA3AF" : "white"} />
                            </TouchableOpacity>
                        </View>

                        {/* Stock Warning */}
                        {medicine.stock < 10 && medicine.stock > 0 && (
                            <View className="p-3 mt-4 bg-yellow-100 rounded-lg">
                                <View className="flex-row items-center">
                                    <Ionicons name="warning" size={16} color="#F59E0B" />
                                    <ThemedText weight="medium" className="ml-2 text-yellow-800">
                                        Only {medicine.stock} units left in stock
                                    </ThemedText>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Medicine Details Card */}
                    <View className="p-6 mb-4 bg-[#E7F3FE] rounded-xl shadow-sm">
                        <View className="flex-row items-center mb-3">
                            <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
                            <ThemedText weight="bold" className="ml-2 text-lg text-gray-800">
                                Medicine Details
                            </ThemedText>
                        </View>
                        
                        <View className="space-y-2">
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
                        </View>
                    </View>

                    {/* Important Notice */}
                    <View className="p-4 mb-6 bg-blue-100 rounded-lg">
                        <View className="flex-row items-start">
                            <Ionicons name="information-circle" size={20} color="#3B82F6" />
                            <ThemedText weight="medium" className="flex-1 ml-2 text-blue-800">
                                Adding to cart allows you to review and manage your items before making a final request. You can modify quantities or remove items from your cart at any time.
                            </ThemedText>
                        </View>
                    </View>
                </ScrollView>

                {/* Bottom Action Buttons */}
                <View className="px-6 py-4">
                    {/* Permission Gate for Add to Cart Button */}
                    <PermissionGate requireCanAddToCart fallback={
                        <View className="p-4 mb-3 bg-gray-100 rounded-xl">
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
                                isAddingToCart || medicine.stock === 0 ? 'bg-gray-400' : 'bg-[#10B981]'
                            }`}
                            onPress={handleAddToCart}
                            disabled={isAddingToCart || medicine.stock === 0}
                        >
                            {isAddingToCart ? (
                                <>
                                    <ActivityIndicator size="small" color="white" />
                                    <ThemedText weight="semibold" className="ml-2 text-lg text-white">
                                        Adding to Cart...
                                    </ThemedText>
                                </>
                            ) : medicine.stock === 0 ? (
                                <>
                                    <Ionicons name="close-circle" size={20} color="white" />
                                    <ThemedText weight="semibold" className="ml-2 text-lg text-white">
                                        Out of Stock
                                    </ThemedText>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="cart" size={20} color="white" />
                                    <ThemedText weight="semibold" className="ml-2 text-lg text-white">
                                        Add to Cart ({quantity} {quantity === 1 ? 'unit' : 'units'})
                                    </ThemedText>
                                </>
                            )}
                        </TouchableOpacity>
                    </PermissionGate>
                    
                    {/* Permission Status Message */}
                    {!canAddToCart() && (
                        <View className="p-3 mt-3 bg-blue-50 rounded-lg border border-blue-200">
                            <View className="flex-row items-center justify-center">
                                <Ionicons name="information-circle" size={16} color="#3B82F6" />
                                <ThemedText weight="medium" className="ml-2 text-blue-700 text-center">
                                    {isPendingUser() 
                                        ? 'You can view medicine details but cannot add items to cart until your account is approved.'
                                        : 'Contact support if you believe this is an error.'
                                    }
                                </ThemedText>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </ViewLayout>
    );
} 