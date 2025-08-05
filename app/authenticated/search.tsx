import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert, StatusBar, ScrollView } from 'react-native';
import { ViewLayout } from '@/components/view-layout';
import ThemedText from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { searchMedicines } from '@/queries/medicine/search';
import { debounce } from 'lodash';
import { useContextProvider } from '@/context/ctx';
import { MedicineExtended } from '@/types';

export default function SearchScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<MedicineExtended[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [searchPerformed, setSearchPerformed] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [activeFilters, setActiveFilters] = useState<string[]>([]);
    const [sortOption, setSortOption] = useState('relevance');
    
    const searchInputRef = useRef<TextInput>(null);
    const { axiosInstance } = useContextProvider();

    // Filter options
    const filterOptions = [
        { id: 'prescription', label: 'Prescription', color: 'bg-orange-100 text-orange-700' },
        { id: 'otc', label: 'Over the Counter', color: 'bg-green-100 text-green-700' },
        { id: 'recommended', label: 'Recommended', color: 'bg-blue-100 text-blue-700' },
        { id: 'instock', label: 'In Stock', color: 'bg-green-100 text-green-700' }
    ];

    // Sort options
    const sortOptions = [
        { id: 'relevance', label: 'Relevance' },
        { id: 'name', label: 'Name A-Z' },
        { id: 'brand', label: 'Brand' },
        { id: 'stock', label: 'Stock' }
    ];

    // Memoized search function to prevent re-creation
    const performSearch = useCallback(async (query: string, page: number = 1) => {
        try {
            if (page === 1) {
                setIsSearching(true);
            } else {
                setIsLoadingMore(true);
            }
            setSearchPerformed(true);
            
            const response = await searchMedicines(axiosInstance, {
                query: query.trim(),
                page,
                limit: 15
            });
            
            if (page === 1) {
                setSearchResults(response.medicines);
            } else {
                setSearchResults(prev => [...prev, ...response.medicines]);
            }
            
            setCurrentPage(response.pagination.currentPage);
            setHasNextPage(response.pagination.hasNextPage);
        } catch (error) {
            console.error('Error searching medicines:', error);
        } finally {
            setIsSearching(false);
            setIsLoadingMore(false);
        }
    }, [axiosInstance]);

    // Debounced search using lodash debounce
    const debouncedSearch = useCallback(
        debounce((query: string) => {
            if (query.trim()) {
                performSearch(query, 1);
            } else {
                setSearchResults([]);
                setSearchPerformed(false);
            }
        }, 1500),
        [performSearch]
    );

    // Trigger search when query changes
    useEffect(() => {
        debouncedSearch(searchQuery);
        
        // Cleanup function to cancel pending debounced calls
        return () => {
            debouncedSearch.cancel();
        };
    }, [searchQuery, debouncedSearch]);

    // Focus input on mount with multiple attempts
    useEffect(() => {
        const focusInput = () => {
            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }
        };
        
        // Try multiple times with increasing delays
        const timers = [
            setTimeout(focusInput, 100),
            setTimeout(focusInput, 500),
            setTimeout(focusInput, 1000),
            setTimeout(focusInput, 2000)
        ];
        
        return () => {
            timers.forEach(timer => clearTimeout(timer));
        };
    }, []);

    // Memoized input handler to prevent re-creation
    const handleSearchInput = useCallback((query: string) => {
        setSearchQuery(query);
    }, []);

    const loadMoreResults = useCallback(() => {
        if (hasNextPage && !isSearching && !isLoadingMore && searchQuery.trim()) {
            performSearch(searchQuery, currentPage + 1);
        }
    }, [hasNextPage, isSearching, isLoadingMore, searchQuery, currentPage, performSearch]);

    const clearSearch = useCallback(() => {
        setSearchQuery('');
        setSearchResults([]);
        setSearchPerformed(false);
        setCurrentPage(1);
        setHasNextPage(false);
        setActiveFilters([]);
        setSortOption('relevance');
        // Cancel any pending debounced search
        debouncedSearch.cancel();
        // Refocus after clearing
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 100);
    }, [debouncedSearch]);

    const handleMedicinePress = useCallback((medicine: MedicineExtended) => {
        router.push(`/authenticated/medicine-detail?id=${medicine.id}` as any);
    }, []);

    const toggleFilter = useCallback((filterId: string) => {
        setActiveFilters(prev => 
            prev.includes(filterId) 
                ? prev.filter(id => id !== filterId)
                : [...prev, filterId]
        );
    }, []);

    const removeFilter = useCallback((filterId: string) => {
        setActiveFilters(prev => prev.filter(id => id !== filterId));
    }, []);

    // Memoized render functions to prevent re-creation
    const renderMedicineItem = useCallback(({ item }: { item: MedicineExtended }) => (
        <TouchableOpacity 
            className="mx-4 mb-3 bg-white rounded-2xl border border-gray-100 shadow-lg"
            onPress={() => handleMedicinePress(item)}
            activeOpacity={0.7}
        >
            <View className="p-4">
                <View className="flex-row items-start">
                    {/* Medicine Icon */}
                    <View className={`w-14 h-14 rounded-xl ${item.recommended ? 'bg-blue-50' : 'bg-gray-50'} items-center justify-center mr-4 border ${item.recommended ? 'border-blue-200' : 'border-gray-200'}`}>
                        <Ionicons 
                            name="medical-outline" 
                            size={28} 
                            color={item.recommended ? '#3B82F6' : '#6B7280'} 
                        />
                    </View>
                    
                    {/* Medicine Details */}
                    <View className="flex-1">
                        <View className="flex-row items-center mb-2">
                            <ThemedText weight="bold" className="flex-1 text-lg text-[#014b5f] mr-2">
                                {item.name}
                            </ThemedText>
                            {item.recommended && (
                                <View className="px-2 py-1 bg-blue-100 rounded-full">
                                    <ThemedText weight="medium" className="text-xs text-blue-700">
                                        ★ Recommended
                                    </ThemedText>
                                </View>
                            )}
                        </View>
                        
                        <ThemedText weight="medium" className="mb-1 text-[#014b5f] opacity-80">
                            {item.brand}
                        </ThemedText>
                        
                        {item.dosageForm && (
                            <View className="flex-row items-center mb-2">
                                <ThemedText weight="regular" className="text-sm text-[#014b5f] opacity-70">
                                    {item.dosageForm}
                                </ThemedText>
                                {item.size && (
                                    <ThemedText weight="regular" className="text-sm text-[#014b5f] opacity-70 ml-2">
                                        • {item.size}
                                    </ThemedText>
                                )}
                            </View>
                        )}
                        
                        {item.description && (
                            <ThemedText weight="regular" className="mb-3 text-sm text-[#014b5f] opacity-60 line-clamp-2">
                                {item.description}
                            </ThemedText>
                        )}
                        
                        <View className="flex-row justify-between items-center">
                            <View className={`px-3 py-1.5 rounded-full ${item.type === 'Prescription' ? 'bg-orange-100' : 'bg-green-100'}`}>
                                <ThemedText weight="medium" className={`text-xs ${item.type === 'Prescription' ? 'text-orange-700' : 'text-green-700'}`}>
                                    {item.type}
                                </ThemedText>
                            </View>
                            
                            <View className="flex-row items-center">
                                <View className={`w-2 h-2 rounded-full mr-2 ${item.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                                <ThemedText weight="bold" className={`text-sm ${item.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
                                </ThemedText>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    ), [handleMedicinePress]);

    const renderEmptyState = useCallback(() => {
        if (isSearching) {
            return (
                <View className="flex-1 justify-center items-center py-20">
                    <View className="items-center">
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <ThemedText weight="medium" className="mt-4 text-lg text-[#F8F8FF]">
                            Searching medicines...
                        </ThemedText>
                        <ThemedText weight="regular" className="mt-2 text-center text-[#F8F8FF] opacity-70">
                            Please wait while we find the best matches
                        </ThemedText>
                    </View>
                </View>
            );
        }

        if (searchPerformed && searchResults.length === 0) {
            return (
                <View className="flex-1 justify-center items-center px-6 py-20">
                    <View className="items-center">
                        <View className="justify-center items-center mb-4 w-20 h-20 bg-gray-100 rounded-full">
                            <Ionicons name="search-outline" size={32} color="#6B7280" />
                        </View>
                        <ThemedText weight="bold" className="text-xl text-[#F8F8FF] mb-2">
                            No medicines found
                        </ThemedText>
                        <ThemedText weight="regular" className="text-center text-[#F8F8FF] opacity-70 mb-4">
                            Try different keywords or check your spelling
                        </ThemedText>
                        <TouchableOpacity 
                            className="px-6 py-3 bg-blue-600 rounded-xl"
                            onPress={clearSearch}
                        >
                            <ThemedText weight="medium" className="text-white">
                                Clear Search
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return (
            <View className="flex-1 justify-center items-center px-6 py-20">
                <View className="items-center">
                    <View className="justify-center items-center mb-6 w-24 h-24 bg-blue-50 rounded-full">
                        <Ionicons name="search" size={40} color="#3B82F6" />
                    </View>
                    <ThemedText weight="bold" className="text-2xl text-[#F8F8FF] mb-3">
                        Search Medicines
                    </ThemedText>
                    <ThemedText weight="regular" className="text-center text-[#F8F8FF] opacity-70 text-base leading-6">
                        Enter medicine name, brand, or description to find what you need
                    </ThemedText>
                </View>
            </View>
        );
    }, [isSearching, searchPerformed, searchResults.length, clearSearch]);

    const renderFooter = useCallback(() => {
        if (!hasNextPage || searchResults.length === 0) return null;
        
        return (
            <View className="items-center py-6">
                {isLoadingMore ? (
                    <View className="flex-row items-center">
                        <ActivityIndicator size="small" color="#3B82F6" />
                        <ThemedText weight="medium" className="ml-2 text-[#F8F8FF]">
                            Loading more...
                        </ThemedText>
                    </View>
                ) : (
                    <TouchableOpacity 
                        className="px-6 py-3 bg-blue-600 rounded-xl shadow-lg"
                        onPress={loadMoreResults}
                        activeOpacity={0.8}
                    >
                        <ThemedText weight="medium" className="text-white">
                            Load More Results
                        </ThemedText>
                    </TouchableOpacity>
                )}
            </View>
        );
    }, [hasNextPage, searchResults.length, isLoadingMore, loadMoreResults]);

    const renderHeader = useCallback(() => {
        if (!searchPerformed || searchResults.length === 0) return null;
        
        return (
            <View className="px-4 py-3 mx-4 mb-2 bg-blue-50 rounded-xl">
                <ThemedText weight="medium" className="text-center text-blue-700">
                    Found {searchResults.length} medicine{searchResults.length !== 1 ? 's' : ''}
                </ThemedText>
            </View>
        );
    }, [searchPerformed, searchResults.length]);

    const renderSearchHeader = useCallback(() => (
        <View className="border-b border-gray-200">
            {/* Top Navigation Bar */}
            <View className="flex-row items-center px-4 py-2.5">
                <TouchableOpacity 
                    onPress={() => router.back()}
                    className="justify-center items-center w-10 h-10 bg-gray-100 rounded-full"
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={20} color="#374151" />
                </TouchableOpacity>
                
                {/* Search Bar */}
                <View className="flex-1 mx-3 bg-gray-50 rounded-lg border border-gray-200">
                    <View className="flex-row items-center px-3 py-1">
                        <Ionicons name="search" size={18} color="#6B7280" />
                        <TextInput
                            ref={searchInputRef}
                            className="flex-1 ml-2 text-base text-gray-900"
                            placeholder="Search products..."
                            placeholderTextColor="#9CA3AF"
                            value={searchQuery}
                            onChangeText={handleSearchInput}
                            returnKeyType="search"
                            autoCorrect={false}
                            autoCapitalize="none"
                            blurOnSubmit={false}
                            keyboardType="default"
                            autoFocus={true}
                            selectTextOnFocus={false}
                            contextMenuHidden={true}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity 
                                onPress={clearSearch}
                                className="justify-center items-center w-6 h-6 rounded-full"
                                activeOpacity={0.7}
                            >
                                <Ionicons name="close" size={14} color="#6B7280" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                
                <View className="justify-center items-center w-10 h-10">
                </View>
            </View>
        </View>
    ), [searchQuery, searchPerformed, searchResults.length, activeFilters, handleSearchInput, clearSearch, toggleFilter, removeFilter]);

    return (
        <ViewLayout scrollEnabled={false}>
            <StatusBar barStyle="dark-content" backgroundColor="white" />
            
            {/* Enhanced Search Header */}
            {renderSearchHeader()}

            {/* Results Container */}
            <View className="flex-1">
                {searchPerformed && (
                    <FlatList
                        data={searchResults}
                        renderItem={renderMedicineItem}
                        keyExtractor={(item) => item.id.toString()}
                        ListHeaderComponent={renderHeader}
                        ListEmptyComponent={renderEmptyState}
                        ListFooterComponent={renderFooter}
                        onEndReached={loadMoreResults}
                        onEndReachedThreshold={0.3}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ flexGrow: 1, paddingTop: 8 }}
                        keyboardShouldPersistTaps="handled"
                        removeClippedSubviews={true}
                        maxToRenderPerBatch={10}
                        windowSize={10}
                    />
                )}
                
                {!searchPerformed && (
                    <View className="flex-1">
                        {renderEmptyState()}
                    </View>
                )}
            </View>
        </ViewLayout>
    );
} 