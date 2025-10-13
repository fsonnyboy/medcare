import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Alert, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { ViewLayout } from '@/components/view-layout';
import ThemedText from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useContextProvider } from '@/context/ctx';
import { getUserConcerns } from '@/queries/concern/getUserConcerns';
import { Concern } from '@/types/concern';

export default function ConcernsList() {
  const { axiosInstance, session } = useContextProvider();
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedConcerns, setExpandedConcerns] = useState<Set<string>>(new Set());

  const fetchConcerns = async () => {
    if (!axiosInstance || !session?.userId) {
      setError('Authentication required to view concerns');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await getUserConcerns(axiosInstance, session.userId, { limit: 50 });
      setConcerns(response.concerns);
    } catch (err: any) {
      console.error('Error fetching concerns:', err);
      setError(err.message || 'Failed to fetch concerns');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConcerns();
  }, [axiosInstance, session?.userId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchConcerns();
    } catch (error) {
      console.error('Error refreshing concerns:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleExpanded = (concernId: number) => {
    const newExpanded = new Set(expandedConcerns);
    if (newExpanded.has(concernId.toString())) {
      newExpanded.delete(concernId.toString());
    } else {
      newExpanded.add(concernId.toString());
    }
    setExpandedConcerns(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'IN_REVIEW':
        return 'bg-blue-100 text-blue-700';
      case 'RESOLVED':
        return 'bg-green-100 text-green-700';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'time-outline';
      case 'IN_REVIEW':
        return 'eye-outline';
      case 'RESOLVED':
        return 'checkmark-circle-outline';
      case 'CLOSED':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderConcernItem = (concern: Concern) => {
    const isExpanded = expandedConcerns.has(concern.id.toString());
    
    return (
      <View key={concern.id} className="mb-4 bg-white rounded-xl shadow-sm">
        {/* Concern Header */}
        <TouchableOpacity
          className="p-4"
          onPress={() => toggleExpanded(concern.id)}
          activeOpacity={0.7}
        >
          <View className="flex-row justify-between items-start">
            <View className="flex-1 mr-3">
              <ThemedText weight="medium" className="text-gray-800 mb-1">
                {concern.subject}
              </ThemedText>
              <View className="flex-row items-center mb-2">
                <View className={`px-2 py-1 rounded-full ${getStatusColor(concern.status)}`}>
                  <View className="flex-row items-center">
                    <Ionicons 
                      name={getStatusIcon(concern.status)} 
                      size={12} 
                      color={concern.status === 'PENDING' ? '#D97706' : 
                             concern.status === 'IN_REVIEW' ? '#2563EB' :
                             concern.status === 'RESOLVED' ? '#059669' : '#6B7280'} 
                    />
                    <ThemedText weight="medium" className="ml-1 text-xs">
                      {concern.status.replace('_', ' ')}
                    </ThemedText>
                  </View>
                </View>
              </View>
              <ThemedText weight="regular" className="text-xs text-gray-500">
                Submitted: {formatDate(concern.createdAt)}
              </ThemedText>
            </View>
            
            {/* Arrow Icon */}
            <View className="justify-center items-center">
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#6B7280" 
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* Expanded Description */}
        {isExpanded && (
          <View className="px-4 pb-4 border-t border-gray-100">
            <View className="pt-4">
              <ThemedText weight="medium" className="mb-2 text-gray-700">
                Description:
              </ThemedText>
              <ThemedText weight="regular" className="text-gray-600 leading-5">
                {concern.description}
              </ThemedText>
              
              {concern.updatedAt !== concern.createdAt && (
                <View className="mt-3 pt-3 border-t border-gray-100">
                  <ThemedText weight="regular" className="text-xs text-gray-500">
                    Last updated: {formatDate(concern.updatedAt)}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <ThemedText weight="medium" className="mt-4 text-gray-600">
            Loading your concerns...
          </ThemedText>
        </View>
      );
    }

    if (error) {
      return (
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-[#FEE2E2] rounded-xl p-6 w-full">
            <View className="items-center">
              <Ionicons name="alert-circle" size={40} color="#EF4444" />
              <ThemedText weight="medium" className="mt-2 text-red-600 text-center">
                {error}
              </ThemedText>
              <TouchableOpacity 
                className="px-4 py-2 mt-4 bg-red-100 rounded-xl"
                onPress={() => {
                  setError(null);
                  setIsLoading(true);
                  fetchConcerns();
                }}
              >
                <ThemedText weight="medium" className="text-red-600">
                  Retry
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    if (concerns.length === 0) {
      return (
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-[#E7F3FE] rounded-xl p-6 w-full">
            <View className="items-center">
              <View className="w-16 h-16 bg-blue-100 rounded-full justify-center items-center mb-4">
                <Ionicons name="chatbubble-outline" size={32} color="#3B82F6" />
              </View>
              <ThemedText weight="bold" className="text-lg text-gray-800 mb-2">
                No Concerns Yet
              </ThemedText>
              <ThemedText weight="regular" className="text-center text-gray-600 mb-4">
                You haven't submitted any concerns yet. Use the "Report Concern" button to share your feedback with our admin team.
              </ThemedText>
              <TouchableOpacity 
                className="px-4 py-2 bg-blue-100 rounded-xl"
                onPress={() => router.push('/authenticated/concern-feedback')}
              >
                <ThemedText weight="medium" className="text-blue-600">
                  Report a Concern
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return (
      <ScrollView 
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
      >
        <View className="pt-6">
          <ThemedText weight="bold" className="text-lg text-gray-800 mb-4">
            Your Concerns ({concerns.length})
          </ThemedText>
          {concerns.map(renderConcernItem)}
        </View>
      </ScrollView>
    );
  };

  return (
    <ViewLayout>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-12 pb-4">
          <View className="flex-row justify-between items-center">
            <TouchableOpacity 
              className="p-2"
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <ThemedText weight="bold" className="text-lg text-white">
              My Concerns
            </ThemedText>
            <View style={{ width: 40 }} />
          </View>
        </View>

        {renderContent()}
      </View>
    </ViewLayout>
  );
}
