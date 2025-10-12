import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, FlatList, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { ViewLayout } from '@/components/view-layout';
import ThemedText from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useContextProvider } from '@/context/ctx';
import { getMedicines } from '@/queries/medicine/recommended';
import { getMedicineCategories } from '@/queries/medicine/categories';
import { MedicineExtended } from '@/types/common';
import { MedicineCategory, RecommendedParams } from '@/types/medicine-queries';
import { useRecoilValue } from 'recoil';
import { userData } from '@/utils/atom';

type MedicineType = 'OTC' | 'PRESCRIPTION';

export default function Authenticated() {
    const { axiosInstance, refreshUserData } = useContextProvider();
    const user = useRecoilValue(userData);
    const [medicines, setMedicines] = useState<MedicineExtended[]>([]);
    const [medicineCategories, setMedicineCategories] = useState<MedicineCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [categoriesError, setCategoriesError] = useState<string | null>(null);
    const [selectedMedicineType, setSelectedMedicineType] = useState<MedicineType>('OTC');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchMedicineCategories();
    }, []);
    
    useEffect(() => {
        fetchMedicines();
    }, [selectedMedicineType]);

    const fetchMedicineCategories = async () => {
        if (!axiosInstance) {
            setCategoriesError('No authentication available');
            setCategoriesLoading(false);
            return;
        }

        try {
            setCategoriesLoading(true);
            setCategoriesError(null);
            const response = await getMedicineCategories(axiosInstance);
            setMedicineCategories(response.categories);
        } catch (err) {
            console.error('Error fetching medicine categories:', err);
            setCategoriesError('Failed to load medicine categories');
        } finally {
            setCategoriesLoading(false);
        }
    };

    const fetchMedicines = async () => {
        if (!axiosInstance) {
            setError('No authentication available');
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            
            // Build parameters object to avoid undefined values being sent as null
            const params: RecommendedParams = { 
                limit: 10,
                type: selectedMedicineType
            };
            
            const response = await getMedicines(axiosInstance, params);
            setMedicines(response.medicines);
        } catch (err) {
            console.error('Error fetching medicines:', err);
            setError('Failed to load medicines');
        } finally {
            setIsLoading(false);
        }
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

    const getCategoryIcon = (categoryName: string) => {
        const name = categoryName.toLowerCase();
        if (name.includes('heart')) return 'heart-outline';
        if (name.includes('diabetes')) return 'pulse-outline';
        if (name.includes('mental') || name.includes('psych')) return 'medical-outline';
        if (name.includes('pain')) return 'thermometer-outline';
        if (name.includes('vitamin')) return 'leaf-outline';
        if (name.includes('antibiotic')) return 'shield-outline';
        if (name.includes('skin')) return 'hand-left-outline';
        if (name.includes('eye')) return 'eye-outline';
        return 'medical-outline';
    };

    const getCategoryColors = (index: number) => {
        const colors = [
            { bg: 'bg-red-100', text: 'text-red-600' },
            { bg: 'bg-green-100', text: 'text-green-600' },
            { bg: 'bg-purple-100', text: 'text-purple-600' },
            { bg: 'bg-orange-100', text: 'text-orange-600' },
            { bg: 'bg-yellow-100', text: 'text-yellow-600' },
            { bg: 'bg-blue-100', text: 'text-blue-600' },
            { bg: 'bg-pink-100', text: 'text-pink-600' },
            { bg: 'bg-indigo-100', text: 'text-indigo-600' },
        ];
        return colors[index % colors.length];
    };

    const renderCategoryItem = ({ item, index }: { item: MedicineCategory; index: number }) => {
        const colors = getCategoryColors(index);
        const icon = getCategoryIcon(item.name);
        
        return (
            <TouchableOpacity 
                className={`w-36 p-4 h-36 rounded-xl ${colors.bg}`}
                onPress={() => router.push(`/authenticated/categories?categoryName=${encodeURIComponent(item.name)}&categoryId=${item.id}` as any)}
            >
                <View className="items-center">
                    <View className={`w-12 h-12 rounded-lg ${colors.bg} items-center justify-center`}>
                        <Ionicons name={icon as any} size={24} color={colors.text.replace('text-', '#')} />
                    </View>
                    <ThemedText weight="semibold" className={`text-center ${colors.text} mb-1 text-sm`}>
                        {item.name}
                    </ThemedText>
                    <ThemedText weight="regular" className="text-xs text-center text-gray-500">
                        {item.medicineCount}+ medicines
                    </ThemedText>
                </View>
            </TouchableOpacity>
        );
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

    const renderRecommendedSection = () => {
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
                        onPress={fetchMedicines}
                    >
                        <ThemedText weight="medium" className="text-white">
                            Retry
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            );
        }

        if (medicines.length === 0) {
            return (
                <View className="items-center py-8">
                    <Ionicons name="medical-outline" size={48} color="#9CA3AF" />
                    <ThemedText weight="medium" className="mt-2 text-gray-500">
                        No medicines available
                    </ThemedText>
                </View>
            );
        }

        return medicines.slice(0, 5).map((medicine) => (
            <View key={medicine.id}>
                {renderMedicineItem({ item: medicine })}
            </View>
        ));
    };

    const renderCategoriesSection = () => {
        if (categoriesLoading) {
            return (
                <View className="items-center py-8">
                    <ActivityIndicator size="large" color="#f8f8ff" />
                    <ThemedText weight="regular" className="mt-2 text-[#f8f8ff]">
                        Loading categories...
                    </ThemedText>
                </View>
            );
        }

        if (categoriesError) {
            return (
                <View className="items-center py-8">
                    <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                    <ThemedText weight="medium" className="mt-2 text-red-500">
                        {categoriesError}
                    </ThemedText>
                    <TouchableOpacity 
                        className="px-4 py-2 mt-4 bg-blue-600 rounded-lg"
                        onPress={fetchMedicineCategories}
                    >
                        <ThemedText weight="medium" className="text-white">
                            Retry
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            );
        }

        if (medicineCategories.length === 0) {
            return (
                <View className="items-center py-8">
                    <Ionicons name="medical-outline" size={48} color="#9CA3AF" />
                    <ThemedText weight="medium" className="mt-2 text-gray-500">
                        No categories available
                    </ThemedText>
                </View>
            );
        }

        return (
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 24 }}
            >
                {medicineCategories.map((category, index) => (
                    <View key={category.id} className="mr-4">
                        {renderCategoryItem({ item: category, index })}
                    </View>
                ))}
            </ScrollView>
        );
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await refreshUserData();
            await Promise.all([
                fetchMedicineCategories(),
                fetchMedicines()
            ]);
        } catch (error) {
            console.error('Error refreshing:', error);
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
                        <View/>
                        <ThemedText weight="bold" className="text-lg text-white">
                            Caremeds
                        </ThemedText>
                        <View/>
                    </View>
                </View>

                <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                    {/* Search Bar - Right Side */}
                    <View className="flex-row justify-end mb-4">
                        <TouchableOpacity 
                            className="flex-row items-center px-4 shadow-sm"
                            onPress={() => router.push('/authenticated/search' as any)}
                        >
                            <Ionicons name="search" size={20} color="#ffff" />
                            <ThemedText weight="regular" className="ml-2 text-white">
                                Search medicines...
                            </ThemedText>
                        </TouchableOpacity>
                    </View>

                    {/* Medicine Categories */}
                    <View className="mb-6">
                        <ThemedText weight="bold" className="mb-4 text-lg text-gray-800">
                            Medicine Categories
                        </ThemedText>
                        {renderCategoriesSection()}
                    </View>

                    {/* Medicine Type Filter */}
                    <View className="mb-4">
                        <View className="flex-row gap-2 space-x-4">
                            {/* OTC Option */}
                            <TouchableOpacity 
                                className={`flex-1 flex-row items-center justify-center px-4 py-2 rounded-lg border-2 ${
                                    selectedMedicineType === 'OTC' 
                                        ? 'border-green-500 bg-green-50' 
                                        : 'border-gray-200 bg-gray-50'
                                }`}
                                onPress={() => setSelectedMedicineType('OTC')}
                            >
                                <ThemedText 
                                    weight="medium" 
                                    className={`text-sm ${
                                        selectedMedicineType === 'OTC' ? 'text-green-700' : 'text-gray-600'
                                    }`}
                                >
                                    OTC
                                </ThemedText>
                            </TouchableOpacity>

                            {/* Prescription Option */}
                            <TouchableOpacity 
                                className={`flex-1 flex-row items-center justify-center px-4 py-2 rounded-lg border-2 ${
                                    selectedMedicineType === 'PRESCRIPTION' 
                                        ? 'border-purple-500 bg-purple-50' 
                                        : 'border-gray-200 bg-gray-50'
                                }`}
                                onPress={() => setSelectedMedicineType('PRESCRIPTION')}
                            >
                                <ThemedText 
                                    weight="medium" 
                                    className={`text-sm ${
                                        selectedMedicineType === 'PRESCRIPTION' ? 'text-purple-700' : 'text-gray-600'
                                    }`}
                                >
                                    Prescription
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Popular Medicines */}
                    <View className="mb-6">
                        <View className="flex-row justify-between items-center mb-4">
                            <ThemedText weight="bold" className="text-lg text-gray-800">
                                All Medicines
                            </ThemedText>
                            <TouchableOpacity 
                                className="flex-row items-center"
                                onPress={() => router.push('/authenticated/recommended' as any)}
                            >
                                <ThemedText weight="medium" className="mr-1 text-white">
                                    View All
                                </ThemedText>
                                <Ionicons name="chevron-forward" size={16} color="white" />
                            </TouchableOpacity>
                        </View>
                        
                        {renderRecommendedSection()}
                    </View>

                    {/* Free Delivery Banner */}
                    {/* <View className="p-4 mb-6 bg-blue-600 rounded-xl">
                        <View className="flex-row items-center">
                            <Ionicons name="car-outline" size={24} color="white" />
                            <View className="flex-1 ml-3">
                                <ThemedText weight="bold" className="mb-1 text-lg text-white">
                                    Free Delivery
                                </ThemedText>
                                <ThemedText weight="regular" className="text-blue-100">
                                    On orders above $25 - Same day
                                </ThemedText>
                                <ThemedText weight="regular" className="text-blue-100">
                                    delivery available
                                </ThemedText>
                            </View>
                        </View>
                    </View> */}
                </ScrollView>
            </View>
        </ViewLayout>
    );
}
