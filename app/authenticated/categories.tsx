import React, { useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { ViewLayout } from '@/components/view-layout';
import ThemedText from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useContextProvider } from '@/context/ctx';
import { getMedicinesByCategory } from '@/queries/medicine/medicineByCategory';
import { MedicineWithCategories, CategoryStatistics, MedicineByCategoryResponse } from '@/types/medicine-queries';

export default function CategoriesScreen() {
    const { axiosInstance } = useContextProvider();
    const { categoryName, categoryId } = useLocalSearchParams<{ categoryName: string; categoryId: string }>();
    const [medicines, setMedicines] = useState<MedicineWithCategories[]>([]);
    const [statistics, setStatistics] = useState<CategoryStatistics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [paginationInfo, setPaginationInfo] = useState<any>(null);

    useEffect(() => {
        if (categoryId) {
            fetchMedicines(1, false, false);
        }
    }, [categoryId]);

    const fetchMedicines = async (page: number = 1, isLoadMore: boolean = false, isRefresh = false) => {
        if (!axiosInstance) {
            setError('No authentication available');
            setIsLoading(false);
            return;
        }

        if (!categoryId) {
            setError('Category ID is required');
            setIsLoading(false);
            return;
        }

        try {
            if (isLoadMore) {
                setIsLoadingMore(true);
            } else if (!isRefresh) {
                setIsLoading(true);
            }
            setError(null);
            
            const response: MedicineByCategoryResponse = await getMedicinesByCategory(axiosInstance, { 
                categoryId: parseInt(categoryId),
                page,
                limit: 10 
            });
            
            if (isLoadMore) {
                setMedicines(prev => [...prev, ...response.medicines]);
            } else {
                setMedicines(response.medicines);
            }
            
            setStatistics(response.statistics);
            setPaginationInfo(response.pagination);
            setHasNextPage(response.pagination.hasNextPage);
            setCurrentPage(page);
        } catch (err) {
            console.error('Error fetching medicines:', err);
            setError('Failed to load medicines');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchMedicines(1, false, true);
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

    const renderMedicineItem = ({ item }: { item: MedicineWithCategories }) => {
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
                        <Ionicons name="medical-outline" size={24} color={iconColors.text.replace('text-', '#')} />
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
                            <View className="flex-row items-center space-x-2">
                                <View className={`px-3 py-1 rounded-full ${typeColors.bg}`}>
                                    <ThemedText weight="medium" className={`text-xs ${typeColors.text}`}>
                                        {item.type}
                                    </ThemedText>
                                </View>
                                {item.recommended && (
                                    <View className="px-2 py-1 bg-blue-100 rounded-full">
                                        <ThemedText weight="medium" className="text-xs text-blue-600">
                                            Recommended
                                        </ThemedText>
                                    </View>
                                )}
                            </View>
                            <View className="flex-row items-center">
                                <View className={`w-2 h-2 rounded-full mr-2 ${item.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                                <ThemedText weight="medium" className="text-sm text-gray-500">
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
            fetchMedicines(currentPage + 1, true, false);
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
                <ViewLayout scrollEnabled={false}>
                    <View className="flex-1 justify-center items-center py-8 h-full">
                        <ActivityIndicator size="large" color="#f8f8ff" />
                        <ThemedText weight="regular" className="mt-2 text-[#f8f8ff]">
                            Loading medicines...
                        </ThemedText>
                    </View>
                </ViewLayout>
            );
        }

        if (error) {
            return (
                <View className="flex justify-center items-center py-8 h-full">
                    <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                    <ThemedText weight="medium" className="mt-2 text-red-500">
                        {error}
                    </ThemedText>
                    <TouchableOpacity 
                        className="px-4 py-2 mt-4 bg-blue-600 rounded-lg"
                        onPress={() => fetchMedicines(1, false, false)}
                    >
                        <ThemedText weight="medium" className="text-white">
                            Retry
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View className="flex justify-center items-center py-8 h-full">
                <Ionicons name="medical-outline" size={48} color="#9CA3AF" />
                <ThemedText weight="medium" className="mt-2 text-gray-500">
                    No medicines found in this category
                </ThemedText>
            </View>
        );
    };

    return (
        <ViewLayout scrollEnabled={false}>
            <View className="flex-1">
                {/* Header */}
                <View className="px-6 pt-12 pb-4">
                    <View className="flex-row justify-between items-center">
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <ThemedText weight="bold" className="text-lg text-white">
                            {categoryName || 'Category'}
                        </ThemedText>
                        <View className='w-5 h-5'/>
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
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#3B82F6']}
                            tintColor="#3B82F6"
                        />
                    }
                    ListHeaderComponent={() => (
                        statistics ? (
                            <View className="mb-6">
                                <View className="p-6 bg-white rounded-2xl shadow-lg">
                                    {/* Card Header */}
                                    <View className="mb-4">
                                        <ThemedText weight="bold" className="mb-1 text-lg text-gray-800">
                                            Category Overview
                                        </ThemedText>
                                        <ThemedText weight="regular" className="text-sm text-gray-600">
                                            {categoryName} - Medicine Statistics
                                        </ThemedText>
                                    </View>
                                    
                                    {/* Total Medicines */}
                                    <View className="p-4 mb-4 bg-blue-50 rounded-xl">
                                        <View className="flex-row justify-between items-center">
                                            <View className="flex-row items-center">
                                                <View className="justify-center items-center mr-3 w-10 h-10 bg-blue-100 rounded-lg">
                                                    <Ionicons name="medical" size={20} color="#3B82F6" />
                                                </View>
                                                <View>
                                                    <ThemedText weight="bold" className="text-lg text-gray-800">
                                                        {statistics.totalMedicines}
                                                    </ThemedText>
                                                    <ThemedText weight="regular" className="text-sm text-gray-600">
                                                        Total Medicines
                                                    </ThemedText>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                    
                                    {/* Statistics Grid */}
                                    <View className="flex-row space-x-3">
                                        {/* Available Medicines */}
                                        <View className="flex-1 p-4 bg-green-50 rounded-xl">
                                            <View className="flex-row items-center mb-2">
                                                <View className="justify-center items-center mr-2 w-8 h-8 bg-green-100 rounded-lg">
                                                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                                </View>
                                                <ThemedText weight="bold" className="text-lg text-gray-800">
                                                    {statistics.availableMedicines}
                                                </ThemedText>
                                            </View>
                                            <ThemedText weight="regular" className="text-xs text-gray-600">
                                                Available
                                            </ThemedText>
                                        </View>
                                        
                                        {/* Recommended Medicines */}
                                        <View className="flex-1 p-4 bg-purple-50 rounded-xl">
                                            <View className="flex-row items-center mb-2">
                                                <View className="justify-center items-center mr-2 w-8 h-8 bg-purple-100 rounded-lg">
                                                    <Ionicons name="star" size={16} color="#8B5CF6" />
                                                </View>
                                                <ThemedText weight="bold" className="text-lg text-gray-800">
                                                    {statistics.recommendedMedicines}
                                                </ThemedText>
                                            </View>
                                            <ThemedText weight="regular" className="text-xs text-gray-600">
                                                Recommended
                                            </ThemedText>
                                        </View>
                                    </View>
                                    
                                    {/* Out of Stock Indicator */}
                                    {statistics.totalMedicines - statistics.availableMedicines > 0 && (
                                        <View className="p-3 mt-3 bg-red-50 rounded-xl">
                                            <View className="flex-row items-center">
                                                <View className="justify-center items-center mr-2 w-6 h-6 bg-red-100 rounded-lg">
                                                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                                                </View>
                                                <ThemedText weight="medium" className="text-sm text-red-600">
                                                    {statistics.totalMedicines - statistics.availableMedicines} out of stock
                                                </ThemedText>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </View>
                        ) : null
                    )}
                />
            </View>
        </ViewLayout>
    );
} 