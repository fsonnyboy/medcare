import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { ViewLayout } from '@/components/view-layout';
import ThemedText from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useContextProvider } from '@/context/ctx';
import { getMedicines } from '@/queries/medicine/recommended';
import { MedicineExtended } from '@/types/common';
import { RecommendedResponse, RecommendedParams } from '@/types/medicine-queries';
import { Image } from 'react-native';

type MedicineType = 'otc' | 'prescription';

export default function RecommendedScreen() {
    const { axiosInstance, refreshUserData } = useContextProvider();
    const [medicines, setMedicines] = useState<MedicineExtended[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [paginationInfo, setPaginationInfo] = useState<any>(null);
    const [selectedType, setSelectedType] = useState<MedicineType>('otc');
    const [isRecommended, setIsRecommended] = useState<boolean | undefined>(undefined);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        // Reset pagination and medicines when filters change
        setCurrentPage(1);
        setMedicines([]);
        setHasNextPage(true);
        setError(null);
        fetchMedicines(1, false);
    }, [selectedType, isRecommended, axiosInstance]);

    const fetchMedicines = async (page: number = 1, isLoadMore: boolean = false) => {
        if (!axiosInstance) {
            setError('No authentication available');
            setIsLoading(false);
            return;
        }

        try {
            if (isLoadMore) {
                setIsLoadingMore(true);
            } else {
                setIsLoading(true);
            }
            setError(null);
            
            // Determine the type parameter based on selection
            let typeParam: 'OTC' | 'PRESCRIPTION' | undefined;
            if (selectedType === 'otc') {
                typeParam = 'OTC';
            } else if (selectedType === 'prescription') {
                typeParam = 'PRESCRIPTION';
            }
            // If 'all' is selected, typeParam remains undefined
            
            // Build parameters object, only including type if it's defined
            const params: RecommendedParams = { 
                page, 
                limit: 10,
                isRecommended: isRecommended
            };
            if (typeParam) {
                params.type = typeParam;
            }

            const response: RecommendedResponse = await getMedicines(axiosInstance, params);
            
            if (isLoadMore) {
                setMedicines(prev => [...prev, ...response.medicines]);
            } else {
                setMedicines(response.medicines);
            }
            
            setPaginationInfo(response.pagination);
            setHasNextPage(response.pagination.hasNextPage);
            setCurrentPage(page);
        } catch (err) {
            console.error('Error fetching recommended medicines:', err);
            setError('Failed to load recommended medicines');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    const handleTypeChange = (type: MedicineType) => {
        setSelectedType(type);
    };

    const getMedicineTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'prescription':
                return { bg: 'bg-gray-100', text: 'text-gray-600' };
            case 'otc':
                return { bg: 'bg-green-100', text: 'text-green-600' };
            default:
                return { bg: 'bg-blue-100', text: 'text-blue-600' };
        }
    };

    const getMedicineIconColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'prescription':
                return { bg: 'bg-purple-100', text: 'text-purple-600' };
            case 'otc':
                return { bg: 'bg-green-100', text: 'text-green-600' };
            default:
                return { bg: 'bg-blue-100', text: 'text-blue-600' };
        }
    };

    const renderMedicineItem = ({ item }: { item: MedicineExtended }) => {
        const typeColors = getMedicineTypeColor(item.type);
        const iconColors = getMedicineIconColor(item.type);
        
        return (
            <TouchableOpacity 
                className="p-4 mb-3 bg-white rounded-xl shadow-sm"
                onPress={() => router.push(`/authenticated/medicine-detail?id=${item.id}` as any)}
            >
                <View className="flex-row items-center">
                    {/* Medicine Icon */}
                    <View className={`w-12 h-12 rounded-lg ${iconColors.bg} items-center justify-center mr-4`}>
                        
                        {item.image ? (
                            <Image source={{ uri: item.image }} className="w-12 h-12 rounded-lg" />
                        ) : (
                            <Ionicons name="medical-outline" size={24} color={iconColors.text.replace('text-', '#')} />
                        )}
                    </View>
                    
                    {/* Medicine Details */}
                    <View className="flex-1">
                        <View className="flex-row items-center mb-1">
                            <ThemedText weight="bold" className="mr-1 text-gray-800">
                                {item.name}
                            </ThemedText>
                            {item.size && (
                                <ThemedText weight="regular" className="text-gray-600">
                                    {item.size}
                                </ThemedText>
                            )}
                        </View>
                        <ThemedText weight="regular" className="mb-2 text-gray-600">
                            {item.description}
                        </ThemedText>
                        {item.brand && (
                            <ThemedText weight="regular" className="mb-2 text-sm text-gray-500">
                                {item.brand}
                            </ThemedText>
                        )}
                        <View className="flex-row justify-between items-center">
                            <View className={`px-3 py-1 rounded-full ${typeColors.bg}`}>
                                <ThemedText weight="medium" className={`text-xs ${typeColors.text}`}>
                                    {item.type}
                                </ThemedText>
                            </View>
                            <View className="flex-row items-center">
                                <ThemedText weight="medium" className="mr-2 text-sm text-gray-500">
                                    Stock: {item.stock}
                                </ThemedText>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const handleLoadMore = useCallback(() => {
        if (!isLoadingMore && hasNextPage) {
            fetchMedicines(currentPage + 1, true);
        }
    }, [isLoadingMore, hasNextPage, currentPage]);

    const renderFooter = () => {
        // Only show footer when loading more AND we have existing data
        if (!isLoadingMore || medicines.length === 0) return null;
        
        return (
            <View className="items-center py-4">
                <ActivityIndicator size="small" color="#3B82F6" />
                <ThemedText weight="regular" className="mt-2 text-gray-500">
                    Loading more medicines...
                </ThemedText>
            </View>
        );
    };

    const renderEmpty = () => {
        if (isLoading) {
            return (
                <View className="items-center py-8">
                    <ActivityIndicator size="large" color="#f8f8ff" />
                    <ThemedText weight="regular" className="mt-2 text-[#f8f8ff]">
                        Loading medicines...
                    </ThemedText>
                </View>
            );
        }

        if (error) {
            return (
                <View className="items-center py-8">
                    <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                    <ThemedText weight="medium" className="mt-2 text-red-500">
                        {error}
                    </ThemedText>
                    <TouchableOpacity 
                        className="px-4 py-2 mt-4 bg-blue-600 rounded-lg"
                        onPress={() => fetchMedicines(1, false)}
                    >
                        <ThemedText weight="medium" className="text-white">
                            Retry
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View className="items-center py-8">
                <Ionicons name="medical-outline" size={48} color="#9CA3AF" />
                <ThemedText weight="medium" className="mt-2 text-gray-500">
                    No medicines available
                </ThemedText>
            </View>
        );
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await refreshUserData();
            // Reset pagination and fetch fresh data
            setCurrentPage(1);
            setMedicines([]);
            setHasNextPage(true);
            await fetchMedicines(1, false);
        } catch (error) {
            console.error('Error refreshing recommended:', error);
        } finally {
            setRefreshing(false);
        }
    };

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
                        <ThemedText weight="bold" className="text-lg text-white">
                            Medicines List
                        </ThemedText>
                        <View className="w-6" />
                    </View>
                </View>

                {/* Filters */}
                <View className="px-6 mb-4">
                    <View className="flex-row justify-between items-center mb-3">
                        <ThemedText weight="bold" className="text-black">
                            Filters
                        </ThemedText>
                        <TouchableOpacity onPress={() => {
                            Alert.alert(
                                "Filter Tips",
                                "You can mix filters:\n• Recommended + OTC\n• Recommended + Prescription\n\nTap Recommended to toggle it on/off, then select your medicine type.",
                                [{ text: "Got it", style: "default" }]
                            );
                        }}>
                            <Ionicons name="information-circle-outline" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                    <View className="flex-row gap-2 space-x-4">
                            <TouchableOpacity 
                                className={`flex-row items-center px-4 py-2 rounded-lg border-2 ${
                                    isRecommended ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-200'
                                }`}
                                onPress={() => setIsRecommended(isRecommended === true ? undefined : true)}
                            >
                                <ThemedText 
                                    weight="medium" 
                                    className={`text-sm ${
                                        isRecommended ? 'text-blue-700' : 'text-gray-600'
                                    }`}
                                >
                                    Recommended
                                </ThemedText>
                            </TouchableOpacity>

                            {/* OTC Option */}
                            <TouchableOpacity 
                                className={`flex-1 flex-row items-center justify-center px-4 py-2 rounded-lg border-2 ${
                                    selectedType === 'otc' 
                                        ? 'border-green-500 bg-green-50' 
                                        : 'border-gray-200 bg-gray-50'
                                }`}
                                onPress={() => handleTypeChange('otc')}
                            >
                                <ThemedText 
                                    weight="medium" 
                                    className={`text-sm ${
                                        selectedType === 'otc' ? 'text-green-700' : 'text-gray-600'
                                    }`}
                                >
                                    OTC
                                </ThemedText>
                            </TouchableOpacity>

                            {/* Prescription Option */}
                            <TouchableOpacity 
                                className={`flex-1 flex-row items-center justify-center px-4 py-2 rounded-lg border-2 ${
                                    selectedType === 'prescription' 
                                        ? 'border-purple-500 bg-purple-50' 
                                        : 'border-gray-200 bg-gray-50'
                                }`}
                                onPress={() => handleTypeChange('prescription')}
                            >
                                <ThemedText 
                                    weight="medium" 
                                    className={`text-sm ${
                                        selectedType === 'prescription' ? 'text-purple-700' : 'text-gray-600'
                                    }`}
                                >
                                    Prescription
                                </ThemedText>
                            </TouchableOpacity>
                    </View>
                </View>

                <FlatList
                    className="flex-1 px-6"
                    data={medicines}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderMedicineItem}
                    ListEmptyComponent={renderEmpty}
                    ListFooterComponent={renderFooter}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.1}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            </View>
        </ViewLayout>
    );
} 