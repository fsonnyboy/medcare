import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Alert, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { ViewLayout } from '@/components/view-layout';
import ThemedText from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useContextProvider } from '@/context/ctx';
import { getMedicineById, MedicineByIdResponse } from '@/queries/medicine/medicineById';
import { getUserData } from '@/queries/profile/user-data';
import { createMedicineRequest } from '@/mutations/medicine/request';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { PermissionGate } from '@/components/PermissionGate';

// Utility function to calculate age from birthdate
const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
};

// Utility function to get full name from user data
const getFullName = (user: any): string => {
    const parts = [user.name, user.middleName, user.lastName].filter(Boolean);
    return parts.join(' ');
};

export default function RequestMedicine() {
    const params = useLocalSearchParams();
    const { axiosInstance, session, refreshUserData } = useContextProvider();
    const { canRequestMedicine, hasReachedRequestLimits, remainingRequests, currentRequestCount, maxAllowedRequests, isLoadingLimits } = useUserPermissions();
    // const [quantity, setQuantity] = useState(1);
    const [isLoadingUserData, setIsLoadingUserData] = useState(true);
    const [isLoadingMedicine, setIsLoadingMedicine] = useState(true);
    const [medicine, setMedicine] = useState<MedicineByIdResponse['medicine'] | null>(null);
    const [medicineError, setMedicineError] = useState<string | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [userDataError, setUserDataError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        age: '',
        contactNumber: '',
        address: '',
        reason: '',
    });

    // Fetch user data
    const fetchUserData = async () => {
        if (!axiosInstance || !session?.userId) {
            setUserDataError('No authentication available');
            setIsLoadingUserData(false);
            return;
        }

        try {
            setIsLoadingUserData(true);
            setUserDataError(null);
            const response = await getUserData(axiosInstance, { 
                userId: parseInt(session.userId) 
            });
            setUserData(response.profile);
            
            // Prepopulate form with user data
            const fullName = getFullName(response.profile);
            const calculatedAge = response.profile.DateOfBirth ? calculateAge(response.profile.DateOfBirth) : response.profile.age || 0;
            
            setFormData(prev => ({
                ...prev,
                fullName: fullName || prev.fullName,
                age: calculatedAge ? calculatedAge.toString() : prev.age,
                contactNumber: response.profile.contactNumber || prev.contactNumber,
                address: response.profile.address || prev.address,
            }));
        } catch (err: any) {
            console.error('Error fetching user data:', err);
            setUserDataError(err.message || 'Failed to fetch user data');
        } finally {
            setIsLoadingUserData(false);
        }
    };

    // Fetch user data when component mounts
    useEffect(() => {
        fetchUserData();
    }, [axiosInstance, session?.userId]);

    // Fetch medicine data
    const fetchMedicineData = async () => {
        if (!axiosInstance || !params.id) {
            setMedicineError('No medicine ID provided');
            setIsLoadingMedicine(false);
            return;
        }

        try {
            setIsLoadingMedicine(true);
            setMedicineError(null);
            const response = await getMedicineById(axiosInstance, parseInt(params.id as string));
            setMedicine(response.medicine);
        } catch (err: any) {
            console.error('Error fetching medicine data:', err);
            setMedicineError(err.message || 'Failed to fetch medicine data');
        } finally {
            setIsLoadingMedicine(false);
        }
    };

    // Fetch medicine data when component mounts
    useEffect(() => {
        fetchMedicineData();
    }, [axiosInstance, params.id]);
    
    // const handleQuantityChange = (change: number) => {
    //     const newQuantity = Math.max(1, quantity + change);
    //     setQuantity(newQuantity);
    // };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateForm = () => {
        // Check if user can make requests
        if (!canRequestMedicine()) {
            if (hasReachedRequestLimits) {
                Alert.alert('Request Limit Reached', `You have reached your monthly limit of ${maxAllowedRequests} requests.`);
            } else {
                Alert.alert('Permission Denied', 'Your account status does not allow medicine requests.');
            }
            return false;
        }

        if (!formData.fullName.trim()) {
            Alert.alert('Error', 'Please enter your full name');
            return false;
        }
        if (!formData.age.trim()) {
            Alert.alert('Error', 'Please enter your age');
            return false;
        }
        if (!formData.contactNumber.trim()) {
            Alert.alert('Error', 'Please enter your contact number');
            return false;
        }
        if (!formData.address.trim()) {
            Alert.alert('Error', 'Please enter your address');
            return false;
        }
        if (!formData.reason.trim()) {
            Alert.alert('Error', 'Please provide a reason for your medicine request');
            return false;
        }
        // if (medicine && medicine.stock < quantity) {
        //     Alert.alert('Error', `Only ${medicine.stock} units available in stock. Please reduce your quantity.`);
        //     return false;
        // }
        return true;
    };

    const handleSubmitRequest = async () => {
        if (!validateForm()) return;
        if (!session?.userId || !medicine) return;

        try {
            setIsSubmitting(true);
            
            const requestData = {
                userId: parseInt(session.userId),
                reason: formData.reason || 'Medicine request',
                medicines: [
                    {
                        medicineId: medicine.id,
                        quantity: 0
                    }
                ]
            };

            const response = await createMedicineRequest(axiosInstance, requestData);
            
            Alert.alert(
                'Request Submitted Successfully',
                `Your medicine request has been submitted. Request ID: ${response.request.id}`,
                [
                    {
                        text: 'OK',
                        onPress: () => router.back()
                    }
                ]
            );
        } catch (err: any) {
            console.error('Error submitting medicine request:', err);
            
            let errorMessage = 'Failed to submit medicine request';
            
            // Handle specific error types
            if (err.message.includes('stock')) {
                errorMessage = 'Insufficient stock available for this medicine';
            } else if (err.message.includes('status')) {
                errorMessage = 'Your account status does not allow medicine requests';
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            Alert.alert('Error', errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveDraft = () => {
        Alert.alert('Draft Saved', 'Your request has been saved as a draft.');
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await refreshUserData();
            // Re-fetch both medicine and user data
            await Promise.all([
                fetchMedicineData(),
                fetchUserData()
            ]);
        } catch (error) {
            console.error('Error refreshing request medicine:', error);
        } finally {
            setRefreshing(false);
        }
    };

    // const getTotalEstimate = () => {
    //     // For now, we'll use a default price since the API doesn't return price
    //     const defaultPrice = 0.25; // This should come from the API in the future
    //     return (quantity * defaultPrice).toFixed(2);
    // };

    // Show loading state while fetching data
    if (isLoadingMedicine || isLoadingUserData) {
        return (
            <ViewLayout scrollEnabled={false}>
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#f8f8ff" />
                    <ThemedText weight="medium" className="mt-4 text-[#f8f8ff]">
                        {isLoadingMedicine ? 'Loading medicine details...' : 'Loading user data...'}
                    </ThemedText>
                </View>
            </ViewLayout>
        );
    }

    // Show error state if data failed to load
    if (medicineError || !medicine || userDataError) {
        return (
            <ViewLayout scrollEnabled={false}>
                <View className="flex-1 justify-center items-center px-6">
                    <Ionicons name="alert-circle" size={60} color="#EF4444" />
                    <ThemedText weight="medium" className="mt-4 text-center text-red-600">
                        {medicineError || userDataError || 'Data not found'}
                    </ThemedText>
                    <View className="flex-row mt-6 space-x-3">
                        {medicineError && (
                            <TouchableOpacity 
                                className="px-6 py-3 bg-red-100 rounded-xl"
                                onPress={fetchMedicineData}
                            >
                                <ThemedText weight="medium" className="text-red-600">
                                    Retry Medicine
                                </ThemedText>
                            </TouchableOpacity>
                        )}
                        {userDataError && (
                            <TouchableOpacity 
                                className="px-6 py-3 bg-red-100 rounded-xl"
                                onPress={fetchUserData}
                            >
                                <ThemedText weight="medium" className="text-red-600">
                                    Retry User Data
                                </ThemedText>
                            </TouchableOpacity>
                        )}
                    </View>
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
                            Request Medicine
                        </ThemedText>
                        <TouchableOpacity>
                            <Ionicons name="information-circle-outline" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                    {/* Medicine Details Card */}
                    <View className="p-6 mt-6 mb-4 bg-[#E7F3FE] rounded-xl shadow-sm">
                        <View className="flex-row items-center mb-3">
                            <Ionicons name="medical-outline" size={20} color="#3B82F6" />
                            <ThemedText weight="bold" className="ml-2 text-lg text-gray-800">
                                Medicine Details
                            </ThemedText>
                        </View>
                        <ThemedText weight="regular" className="mb-4 text-gray-600">
                            Review the medication information before requesting
                        </ThemedText>

                        {/* Medicine Name */}
                        <ThemedText weight="bold" className="mb-4 text-xl text-gray-800">
                            {medicine.name}
                        </ThemedText>

                        {/* Medicine Attributes */}
                        <View className="flex-row mb-4 space-x-4">
                            <View>
                                <ThemedText weight="medium" className="text-sm text-gray-600">
                                    Type
                                </ThemedText>
                                <ThemedText weight="semibold" className="text-gray-800">
                                    {medicine.type}
                                </ThemedText>
                            </View>
                            <View>
                                <ThemedText weight="medium" className="text-sm text-gray-600">
                                    Size
                                </ThemedText>
                                <ThemedText weight="semibold" className="text-gray-800">
                                    {medicine.size}
                                </ThemedText>
                            </View>
                        </View>

                        {/* Brand */}
                        <View className="mb-4">
                            <ThemedText weight="medium" className="mb-1 text-sm text-gray-600">
                                Brand
                            </ThemedText>
                            <ThemedText weight="semibold" className="text-gray-800">
                                {medicine.brand}
                            </ThemedText>
                        </View>

                        {/* Dosage Form */}
                        <View className="mb-4">
                            <ThemedText weight="medium" className="mb-1 text-sm text-gray-600">
                                Dosage Form
                            </ThemedText>
                            <ThemedText weight="semibold" className="text-gray-800">
                                {medicine.dosageForm}
                            </ThemedText>
                        </View>

                        {/* Categories */}
                        {medicine.categories && medicine.categories.length > 0 && (
                            <View className="mb-4">
                                <ThemedText weight="medium" className="mb-1 text-sm text-gray-600">
                                    Categories
                                </ThemedText>
                                <View className="flex-row flex-wrap">
                                    {medicine.categories.map((category, index) => (
                                        <View key={category.id} className="px-2 py-1 mr-2 mb-1 bg-blue-100 rounded-lg">
                                            <ThemedText weight="medium" className="text-xs text-blue-600">
                                                {category.name}
                                            </ThemedText>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Description */}
                        <View className="mb-4">
                            <ThemedText weight="medium" className="mb-1 text-sm text-gray-600">
                                Description
                            </ThemedText>
                            <ThemedText weight="regular" className="text-gray-700">
                                {medicine.description}
                            </ThemedText>
                        </View>

                        {/* Availability and Price */}
                        <View className="flex-row space-x-3">
                            <View className="flex-1 p-3 bg-green-100 rounded-lg">
                                <View className="flex-row items-center">
                                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                    <ThemedText weight="medium" className="ml-1 text-green-600">
                                        {medicine.stock > 0 ? `In Stock (${medicine.stock})` : 'Out of Stock'}
                                    </ThemedText>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Request Information Card */}
                    <View className="p-6 mb-4 bg-[#E7F3FE] rounded-xl shadow-sm">
                        <View className="flex-row items-center mb-3">
                            <Ionicons name="person-outline" size={20} color="#10B981" />
                            <ThemedText weight="bold" className="ml-2 text-lg text-gray-800">
                                Request Information
                            </ThemedText>
                        </View>
                        <ThemedText weight="regular" className="mb-4 text-gray-600">
                            Please provide your details for the medicine request
                        </ThemedText>
                        
                        {/* Auto-fill indicator */}
                        {isLoadingUserData ? (
                            <View className="p-3 mb-4 bg-blue-50 rounded-lg border border-blue-200">
                                <View className="flex-row items-center">
                                    <Ionicons name="refresh" size={16} color="#3B82F6" />
                                    <ThemedText weight="medium" className="ml-2 text-blue-700">
                                        Loading your profile information...
                                    </ThemedText>
                                </View>
                            </View>
                        ) : userData && (userData.name || userData.contactNumber || userData.address) ? (
                            <View className="p-3 mb-4 bg-green-50 rounded-lg border border-green-200">
                                <View className="flex-row items-center">
                                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                    <ThemedText weight="medium" className="ml-2 text-green-700">
                                        Form auto-filled with your profile information
                                    </ThemedText>
                                </View>
                            </View>
                        ) : null}

                        {/* Form Fields */}
                        <View className="space-y-4">
                            {/* Full Name */}
                            <View className='mb-2'>
                                <ThemedText weight="medium" className="text-gray-700">
                                    Full Name <Text className="text-red-500">*</Text>
                                </ThemedText>
                                <TextInput
                                    className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200"
                                    placeholder="Enter your full name"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.fullName}
                                    onChangeText={(value) => handleInputChange('fullName', value)}
                                />
                            </View>

                            {/* Age */}
                            <View className='mb-2'>
                                <ThemedText weight="medium" className="text-gray-700">
                                    Age <Text className="text-red-500">*</Text>
                                </ThemedText>
                                <TextInput
                                    className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200"
                                    placeholder={userData?.DateOfBirth ? "Age calculated from birthdate" : "Enter your age"}
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.age}
                                    onChangeText={(value) => handleInputChange('age', value)}
                                    keyboardType="numeric"
                                />
                                {userData?.DateOfBirth && (
                                    <ThemedText weight="regular" className="mt-1 text-xs text-gray-500">
                                        Age calculated from birthdate: {userData.DateOfBirth}
                                    </ThemedText>
                                )}
                            </View>

                            {/* Contact Number */}
                            <View className='mb-2'>
                                <ThemedText weight="medium" className="text-gray-700">
                                    Contact Number <Text className="text-red-500">*</Text>
                                </ThemedText>
                                <TextInput
                                    className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200"
                                    placeholder="+1 (555) 123-4567"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.contactNumber}
                                    onChangeText={(value) => handleInputChange('contactNumber', value)}
                                    keyboardType="phone-pad"
                                />
                            </View>

                            <View className='mb-2'>
                                <ThemedText weight="medium" className="text-gray-700">
                                    Address <Text className="text-red-500">*</Text>
                                </ThemedText>
                                <TextInput
                                    className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200"
                                    placeholder="Enter your delivery address"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.address}
                                    onChangeText={(value) => handleInputChange('address', value)}
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                             {/* Reason for Request */}
                            <View className='mb-2'>
                                 <ThemedText weight="medium" className="text-gray-700">
                                     Reason for Request <Text className="text-red-500">*</Text>
                                 </ThemedText>
                                 <TextInput
                                     className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200"
                                     placeholder="Please provide a reason for your medicine request"
                                     placeholderTextColor="#9CA3AF"
                                     value={formData.reason}
                                     onChangeText={(value) => handleInputChange('reason', value)}
                                     multiline
                                     numberOfLines={3}
                                     textAlignVertical="top"
                                 />
                            </View>
                            
                            {/* Quantity */}
                            {/* <View>
                                <ThemedText weight="medium" className="text-gray-700">
                                    Quantity <Text className="text-red-500">*</Text>
                                </ThemedText>
                                <View className="flex-row items-center">
                                    <TouchableOpacity 
                                        className="justify-center items-center w-10 h-10 bg-blue-500 rounded-full"
                                        onPress={() => handleQuantityChange(-1)}
                                    >
                                        <Ionicons name="remove" size={16} color="white" />
                                    </TouchableOpacity>
                                    <TextInput
                                        className="flex-1 mx-4 text-lg font-semibold text-center text-gray-800"
                                        value={quantity.toString()}
                                        onChangeText={(value) => setQuantity(parseInt(value) || 1)}
                                        keyboardType="numeric"
                                    />
                                    <TouchableOpacity 
                                        className="justify-center items-center w-10 h-10 bg-blue-500 rounded-full"
                                        onPress={() => handleQuantityChange(1)}
                                    >
                                        <Ionicons name="add" size={16} color="white" />
                                    </TouchableOpacity>
                                    <ThemedText weight="medium" className="ml-3 text-gray-700">
                                        units
                                    </ThemedText>
                                </View>
                            </View> */}

                        </View>

                         {/* Important Notice */}
                        <View className="p-4 mt-4 bg-yellow-100 rounded-lg">
                            <View className="flex-row items-start">
                                <Ionicons name="warning" size={20} color="#F59E0B" className="mt-1" />
                                <ThemedText weight="medium" className="flex-1 ml-2 text-yellow-800">
                                    Important Notice: This medicine requires prescription verification before dispensing
                                </ThemedText>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                {/* Action Buttons */}
                <View className="px-6 py-4">
                    {/* Permission Gate for Submit Button */}
                    <PermissionGate requireCanMakeRequests fallback={
                        <View className="p-4 mb-3 bg-gray-100 rounded-xl">
                            <View className="flex-row justify-center items-center">
                                <Ionicons name="information-circle" size={20} color="#6B7280" />
                                <ThemedText weight="medium" className="ml-2 text-center text-gray-600">
                                    {hasReachedRequestLimits 
                                        ? `You have reached your monthly limit of ${maxAllowedRequests} requests.`
                                        : 'Your account is pending approval. You can only view content at this time.'
                                    }
                                </ThemedText>
                            </View>
                        </View>
                    }>
                        <TouchableOpacity
                            className={`flex-row justify-center items-center py-4 mb-3 rounded-xl ${
                                isSubmitting || (medicine && medicine.stock === 0) ? 'bg-gray-400' : 'bg-[#0D8AED]'
                            }`}
                            onPress={handleSubmitRequest}
                            disabled={isSubmitting || (medicine && medicine.stock === 0)}
                        >
                            {isSubmitting ? (
                                <>
                                    <ActivityIndicator size="small" color="white" />
                                    <ThemedText weight="semibold" className="ml-2 text-lg text-white">
                                        Submitting...
                                    </ThemedText>
                                </>
                            ) : medicine && medicine.stock === 0 ? (
                                <>
                                    <ThemedText weight="semibold" className="mr-2 text-lg text-white">
                                        Out of Stock
                                    </ThemedText>
                                    <Ionicons name="close-circle" size={20} color="white" />
                                </>
                            ) : (
                                <>
                                    <ThemedText weight="semibold" className="mr-2 text-lg text-white">
                                        Submit Request
                                    </ThemedText>
                                    <Ionicons name="paper-plane" size={20} color="white" />
                                </>
                            )}
                        </TouchableOpacity>
                    </PermissionGate>
                    
                    {/* Request Limit Status */}
                    {canRequestMedicine() && (
                        <View className="p-3 mb-3 bg-blue-50 rounded-lg border border-blue-200">
                            <View className="flex-row justify-center items-center">
                                <Ionicons name="information-circle" size={16} color="#3B82F6" />
                                <ThemedText weight="medium" className="ml-2 text-center text-blue-700">
                                    {isLoadingLimits 
                                        ? 'Checking request limits...'
                                        : `You can make ${remainingRequests} more request(s) this month.`
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