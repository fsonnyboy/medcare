import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { ViewLayout } from '@/components/view-layout';
import ThemedText from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useContextProvider } from '@/context/ctx';
import { useRecoilValue } from 'recoil';
import { userData as userDataAtom } from '@/utils/atom';
import { UserDataResponse } from '@/types/profile';
import { getUserData } from '@/queries/profile/user-data';
import { router } from 'expo-router';

export default function Profile() {
    const { logout, axiosInstance, session, refreshUserData } = useContextProvider();
    const storedUserData = useRecoilValue(userDataAtom);
    const [userData, setUserData] = useState<UserDataResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchUserData = async () => {
        if (!axiosInstance || !session?.userId) {
            setError('No authentication available');
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            const data = await getUserData(axiosInstance, { 
                userId: parseInt(session.userId) 
            });
            setUserData(data);
        } catch (err: any) {
            console.error('Error fetching user data:', err);
            setError(err.message || 'Failed to fetch user data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [axiosInstance, session?.userId]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshUserData();
            await fetchUserData();
        } catch (error) {
            console.error('Error refreshing profile:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: logout }
            ]
        );
    };

    const renderProfileHeader = () => {
        if (isLoading) {
            return (
                <View className="bg-[#E7F3FE] rounded-xl p-6 mt-6 mb-6 shadow-sm">
                    <View className="items-center">
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <ThemedText weight="medium" className="mt-4 text-gray-600">
                            Loading profile...
                        </ThemedText>
                    </View>
                </View>
            );
        }

        if (error) {
            return (
                <View className="bg-[#FEE2E2] rounded-xl p-6 mt-6 mb-6 shadow-sm">
                    <View className="items-center">
                        <Ionicons name="alert-circle" size={40} color="#EF4444" />
                        <ThemedText weight="medium" className="mt-2 text-red-600">
                            {error}
                        </ThemedText>
                        <TouchableOpacity 
                            className="px-4 py-2 mt-4 bg-red-100 rounded-xl"
                            onPress={() => {
                                setError(null);
                                setIsLoading(true);
                                fetchUserData();
                            }}
                        >
                            <ThemedText weight="medium" className="text-red-600">
                                Retry
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        const profile = userData?.profile || storedUserData;
        const fullName = `${profile.name + ' '} ${profile.middleName ? profile.middleName?.charAt(0) + '. ' : ''} ${profile.lastName ? profile.lastName : ''}`.trim();

        return (
            <View className="bg-[#E7F3FE] rounded-xl p-6 mt-6 mb-6 shadow-sm">
                <View className="items-center">
                    <View className="justify-center items-center mb-4 w-20 h-20 bg-blue-100 rounded-full">
                        {profile.image ? (
                            <Image 
                                source={{ uri: profile.image }} 
                                className="w-20 h-20 rounded-full"
                            />
                        ) : (
                            <Ionicons name="person" size={40} color="#3B82F6" />
                        )}
                    </View>
                    <ThemedText weight="bold" className="mb-1 text-xl text-gray-800">
                        {fullName || 'User Name'}
                    </ThemedText>
                    <ThemedText weight="regular" className="mb-2 text-gray-600">
                        {profile.username || 'username@example.com'}
                    </ThemedText>
                    
                    {/* Status Badge */}
                    <View className={`px-3 py-1 mb-4 rounded-full ${
                        profile.status === 'APPROVED' ? 'bg-green-100' :
                        profile.status === 'PENDING' ? 'bg-yellow-100' :
                        'bg-red-100'
                    }`}>
                        <ThemedText weight="medium" className={`text-sm ${
                            profile.status === 'APPROVED' ? 'text-green-700' :
                            profile.status === 'PENDING' ? 'text-yellow-700' :
                            'text-red-700'
                        }`}>
                            {profile.status === 'APPROVED' ? '✓ Approved' :
                             profile.status === 'PENDING' ? '⏳ Pending Approval' :
                             '✗ Rejected'}
                        </ThemedText>
                    </View>
                    <View className="flex-row space-x-3">
                        <TouchableOpacity 
                            className="px-4 py-2 bg-blue-100 rounded-xl"
                            onPress={() => router.push('/authenticated/update-profile')}
                        >
                            <ThemedText weight="medium" className="text-blue-600">
                                Edit Profile
                            </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            className="px-4 py-2 bg-green-100 rounded-xl"
                            onPress={handleRefresh}
                            disabled={isRefreshing}
                        >
                            <View className="flex-row items-center">
                                <Ionicons 
                                    name="refresh" 
                                    size={16} 
                                    color="#10B981" 
                                    style={{ transform: [{ rotate: isRefreshing ? '180deg' : '0deg' }] }}
                                />
                                <ThemedText weight="medium" className="ml-1 text-green-600">
                                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                                </ThemedText>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    const renderAdditionalInfoCard = () => {
        if (isLoading) {
            return (
                <View className="bg-[#E7F3FE] rounded-xl p-6 mb-6 shadow-sm">
                    <View className="items-center">
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <ThemedText weight="medium" className="mt-4 text-gray-600">
                            Loading additional info...
                        </ThemedText>
                    </View>
                </View>
            );
        }

        if (error) {
            return null;
        }

        const profile = userData?.profile || storedUserData;

        // Calculate age from date of birth
        const calculateAge = (dateOfBirth: string | null) => {
            if (!dateOfBirth) return 'N/A';
            const birthDate = new Date(dateOfBirth);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age.toString();
        };

        // Format date for display
        const formatDate = (dateString: string | null) => {
            if (!dateString) return 'N/A';
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };

        return (
            <View className="bg-[#E7F3FE] rounded-xl p-6 mb-6 shadow-sm">
                <View className="mb-4">
                    <ThemedText weight="bold" className="mb-3 text-lg text-gray-800">
                        Personal Information
                    </ThemedText>
                </View>
                
                <View className="gap-3 space-y-4">

                    {/* Date of Birth */}
                    <View className="flex-row justify-between items-center p-3 bg-white rounded-lg">
                        <View className="flex-row items-center">
                            <Ionicons name="calendar-outline" size={20} color="#8B5CF6" />
                            <ThemedText weight="medium" className="ml-3 text-gray-700">
                                Date of Birth
                            </ThemedText>
                        </View>
                        <ThemedText weight="regular" className="text-gray-600">
                            {formatDate(profile.DateOfBirth)}
                        </ThemedText>
                    </View>

                    {/* Age */}
                    <View className="flex-row justify-between items-center p-3 bg-white rounded-lg">
                        <View className="flex-row items-center">
                            <Ionicons name="person-outline" size={20} color="#F59E0B" />
                            <ThemedText weight="medium" className="ml-3 text-gray-700">
                                Age
                            </ThemedText>
                        </View>
                        <ThemedText weight="regular" className="text-gray-600">
                            {profile.age ? `${profile.age} years` : calculateAge(profile.DateOfBirth) !== 'N/A' ? `${calculateAge(profile.DateOfBirth)} years` : 'N/A'}
                        </ThemedText>
                    </View>

                    {/* Contact Number */}
                        <View className="flex-row justify-between items-center p-3 bg-white rounded-lg">
                            <View className="flex-row items-center">
                                <Ionicons name="call-outline" size={20} color="#10B981" />
                                <ThemedText weight="medium" className="ml-3 text-gray-700">
                                    Contact Number
                                </ThemedText>
                            </View>
                            <ThemedText weight="regular" className="text-gray-600">
                                {profile.contactNumber || 'N/A'}
                            </ThemedText>
                        </View>

                    {/* Address */}
                        <View className="flex-row justify-between items-center p-3 bg-white rounded-lg">
                            <View className="flex-row items-center">
                                <Ionicons name="location-outline" size={20} color="#EF4444" />
                                <ThemedText weight="medium" className="ml-3 text-gray-700">
                                    Address
                                </ThemedText>
                            </View>
                            <ThemedText weight="regular" className="flex-1 ml-2 text-right text-gray-600">
                                {profile.address || 'N/A'}
                            </ThemedText>
                        </View>

                    {/* Account Status */}
                    <View className="flex-row justify-between items-center p-3 bg-white rounded-lg">
                        <View className="flex-row items-center">
                            <Ionicons name="shield-checkmark-outline" size={20} color="#10B981" />
                            <ThemedText weight="medium" className="ml-3 text-gray-700">
                                Account Status
                            </ThemedText>
                        </View>
                        <View className="flex-row items-center">
                            <View className={`w-2 h-2 rounded-full mr-2 ${profile.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`} />
                            <ThemedText weight="medium" className={`${profile.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>
                                {profile.status || 'Active'}
                            </ThemedText>
                        </View>
                    </View>

                    {/* Registration Date */}
                    <View className="flex-row justify-between items-center p-3 bg-white rounded-lg">
                        <View className="flex-row items-center">
                            <Ionicons name="time-outline" size={20} color="#6B7280" />
                            <ThemedText weight="medium" className="ml-3 text-gray-700">
                                Member Since
                            </ThemedText>
                        </View>
                        <ThemedText weight="regular" className="text-gray-600">
                            {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                        </ThemedText>
                    </View>

                    {/* OAuth Registration */}
                    <View className="flex-row justify-between items-center p-3 bg-white rounded-lg">
                        <View className="flex-row items-center">
                            <Ionicons name="logo-google" size={20} color="#EA4335" />
                            <ThemedText weight="medium" className="ml-3 text-gray-700">
                                OAuth Registered
                            </ThemedText>
                        </View>
                        <ThemedText weight="regular" className="text-gray-600">
                            {('isAlreadyRegisteredIn0auth' in profile && profile.isAlreadyRegisteredIn0auth) ? 'Yes' : 'No'}
                        </ThemedText>
                    </View>
                </View>

                {/* Logout Button */}
                <TouchableOpacity 
                    className="p-4 mt-6 bg-red-100 rounded-xl"
                    onPress={handleLogout}
                >
                    <View className="flex-row justify-center items-center">
                        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                        <ThemedText weight="medium" className="ml-2 text-red-600">
                            Logout
                        </ThemedText>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <ViewLayout 
            scrollEnabled={true}
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={handleRefresh}
                    colors={['#3B82F6']}
                    tintColor="#3B82F6"
                />
            }
        >
            <View className="flex-1">
                {/* Header */}
                <View className="px-6 pt-12 pb-4">
                    <View className="flex-row justify-between items-center">
                        <View/>
                        <ThemedText weight="bold" className="text-lg text-white">
                            Profile
                        </ThemedText>
                        <View/>
                    </View>
                </View>

                <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                    {/* Profile Header */}
                    {renderProfileHeader()}

                    {/* Additional Info Card */}
                    {renderAdditionalInfoCard()}

                    {/* App Version */}
                    <View className="items-center mt-8 mb-6">
                        <ThemedText weight="regular" className="text-sm text-[#f8f8ff]">
                            MediCare+ v1.0.0
                        </ThemedText>
                    </View>
                </ScrollView>
            </View>
        </ViewLayout>
    );
} 