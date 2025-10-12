import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { ViewLayout } from '@/components/view-layout';
import ThemedText from '@/components/themed-text';
import { MaterialIcons } from '@expo/vector-icons';
import { useContextProvider } from '@/context/ctx';
import { getMedicineRequests } from '@/queries/medicine/request';
import { MedicineRequest, RequestResponse } from '@/types/medicine-requests';

const HistoryScreen = () => {
  const { axiosInstance, user, refreshUserData } = useContextProvider();
  const [requests, setRequests] = useState<MedicineRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false,
    limit: 10,
  });

  const fetchRequests = async (page = 1, refresh = false) => {
    if (!axiosInstance || !user) {
      setError('No authentication available');
      setLoading(false);
      return;
    }

    try {
      if (refresh) {
        setRefreshing(true);
      } else if (page === 1) {
        setLoading(true);
      }
      setError(null);

      const response: RequestResponse = await getMedicineRequests(axiosInstance, {
        userId: user.id,
        page,
        limit: 10,
      });

      if (refresh || page === 1) {
        setRequests(response.requests);
      } else {
        setRequests(prev => [...prev, ...response.requests]);
      }

      setPagination({
        currentPage: response.pagination.currentPage,
        totalPages: response.pagination.totalPages,
        totalCount: response.pagination.totalCount,
        hasNextPage: response.pagination.hasNextPage,
        hasPreviousPage: response.pagination.hasPreviousPage,
        limit: response.pagination.limit,
      });
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch requests';
      setError(errorMessage);
      
      if (page === 1) {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [axiosInstance, user]);

  const onRefresh = async () => {
    try {
      await refreshUserData();
      await fetchRequests(1, true);
    } catch (error) {
      console.error('Error refreshing history:', error);
    }
  };

  const loadMore = () => {
    if (pagination.hasNextPage && !loading && !refreshing) {
      fetchRequests(pagination.currentPage + 1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return '#f59e0b';
      case 'GIVEN':
        return '#10b981';
      case 'CANCELLED':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return 'pending';
      case 'GIVEN':
        return 'check-circle';
      case 'CANCELLED':
        return 'cancel';
      default:
        return 'help';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const renderRequestItem = ({ item }: { item: MedicineRequest }) => (
    <View className="p-4 mb-3 bg-white rounded-xl shadow-sm">
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center gap-1.5">
          <MaterialIcons
            name={getStatusIcon(item.status) as any}
            size={20}
            color={getStatusColor(item.status)}
          />
          <ThemedText 
            weight="semibold" 
            className="text-sm capitalize"
            style={{ color: getStatusColor(item.status) }}
          >
            {item.status}
          </ThemedText>
        </View>
        <ThemedText weight="regular" className="text-xs text-gray-500">
          {formatDate(item.createdAt)}
        </ThemedText>
      </View>

      <ThemedText weight="regular" className="mb-4 text-base leading-5 text-gray-800">
        {item.reason || 'No reason provided'}
      </ThemedText>

      <View className="mb-4">
        <ThemedText weight="semibold" className="mb-2 text-sm text-gray-700">
          Medicines ({item.totalMedicines || 0}):
        </ThemedText>
        {item.medicines && item.medicines.length > 0 ? (
          item.medicines.map((medicineItem) => (
            <View key={medicineItem.id} className="flex-row justify-between items-center px-2 py-1 mb-1 bg-gray-50 rounded-md">
              <ThemedText weight="regular" className="flex-1 text-sm text-gray-700">
                {medicineItem.medicine?.name || 'Unknown Medicine'}
              </ThemedText>
              <ThemedText weight="medium" className="text-xs text-gray-500">
                Qty: {medicineItem.quantity || 0}
              </ThemedText>
            </View>
          ))
        ) : (
          <ThemedText weight="regular" className="text-sm italic text-gray-500">
            No medicines in this request
          </ThemedText>
        )}
      </View>

      <View className="pt-3 border-t border-gray-200">
        <ThemedText weight="semibold" className="text-sm text-right text-gray-700">
          Total Quantity: {item.totalQuantity || 0}
        </ThemedText>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View className="justify-center items-center py-15">
      <MaterialIcons name="history" size={64} color="#9ca3af" />
      <ThemedText weight="semibold" className="mt-4 mb-2 text-xl text-gray-700">
        No History Yet
      </ThemedText>
      <ThemedText weight="regular" className="text-base text-[#EF4444] text-center leading-5">
        Your medicine request history will appear here
      </ThemedText>
    </View>
  );

  const renderErrorState = () => (
    <View className="items-center py-8">
      <MaterialIcons name="error-outline" size={64} color="#ef4444" />
      <ThemedText weight="medium" className="mt-4 mb-2 text-lg text-red-600">
        Something went wrong
      </ThemedText>
      <ThemedText weight="regular" className="mb-4 text-base text-center text-gray-600">
        {error}
      </ThemedText>
      <TouchableOpacity 
        className="px-4 py-2 bg-blue-600 rounded-lg"
        onPress={() => fetchRequests(1, true)}
      >
        <ThemedText weight="medium" className="text-white">
          Retry
        </ThemedText>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingState = () => (
    <View className="items-center py-8">
      <ActivityIndicator size="large" color="#3B82F6" />
      <ThemedText weight="regular" className="mt-2 text-gray-600">
        Loading your history...
      </ThemedText>
    </View>
  );

  if (loading && requests.length === 0) {
    return (
      <ViewLayout scrollEnabled={false}>
        <View className="flex-1">
          <View className="px-6 pt-12 pb-4">
            <View className="flex-row justify-between items-center">
              <View className="w-5 h-5" />
              <ThemedText weight="bold" className="text-lg text-white">
                Request History
              </ThemedText>
              <View className="w-5 h-5" />
            </View>
          </View>
          {renderLoadingState()}
        </View>
      </ViewLayout>
    );
  }

  if (error && requests.length === 0) {
    return (
      <ViewLayout scrollEnabled={false}>
        <View className="flex-1">
          <View className="px-6 pt-12 pb-4">
            <View className="flex-row justify-between items-center">
              <View className="w-5 h-5" />
              <ThemedText weight="bold" className="text-lg text-white">
                Request History
              </ThemedText>
              <View className="w-5 h-5" />
            </View>
          </View>
          {renderErrorState()}
        </View>
      </ViewLayout>
    );
  }

  return (
    <ViewLayout scrollEnabled={false}>
      <View className="flex-1">
        <View className="px-6 pt-12 pb-4">
          <View className="flex-row justify-between items-center">
            <View className="w-5 h-5" />
            <ThemedText weight="bold" className="text-lg text-white">
              Request History
            </ThemedText>
            <View className="w-5 h-5" />
          </View>
        </View>

        <FlatList
          className="flex-1 px-6"
          data={requests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={
            pagination.hasNextPage ? (
              <View className="flex-row gap-2 justify-center items-center py-4">
                <ActivityIndicator size="small" color="#3B82F6" />
                <ThemedText weight="regular" className="text-sm text-gray-500">
                  Loading more...
                </ThemedText>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ViewLayout>
  );
};

export default HistoryScreen;
