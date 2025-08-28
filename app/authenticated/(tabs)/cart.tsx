import React, { useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, ActivityIndicator, RefreshControl, FlatList, Alert, TextInput, Modal } from 'react-native';
import { ViewLayout } from '@/components/view-layout';
import ThemedText from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useContextProvider } from '@/context/ctx';
import { getCartItems } from '@/queries/cart/getCartItems';
import { deleteCartItem } from '@/mutations/cart/deleteCartItem';
import { createBulkMedicineRequests } from '@/mutations/medicine/request';
import { CartItemWithAvailability, CartSummary, GetCartItemsResponse } from '@/types/cart';
import { CreateMedicineRequestData } from '@/types/medicine-requests';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { PermissionGate } from '@/components/PermissionGate';

export default function CartScreen() {
  const { axiosInstance, session } = useContextProvider();
  const { canRequestMedicine, isPendingUser } = useUserPermissions();
  const [cartItems, setCartItems] = useState<CartItemWithAvailability[]>([]);
  const [cartSummary, setCartSummary] = useState<CartSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [deletingItems, setDeletingItems] = useState<Set<number>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [reasonInput, setReasonInput] = useState('');
  const [isReasonModalVisible, setIsReasonModalVisible] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  useEffect(() => {
    if (session?.userId) {
      fetchCartItems(1, false, false);
    }
  }, [session?.userId]);

  const fetchCartItems = async (page: number = 1, isLoadMore: boolean = false, isRefresh = false) => {
    if (!axiosInstance || !session?.userId) {
      setError('No authentication available');
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
      
      const response: GetCartItemsResponse = await getCartItems(axiosInstance, { 
        userId: parseInt(session.userId),
        page,
        limit: 10 
      });
      
      if (isLoadMore) {
        setCartItems(prev => [...prev, ...response.cartItems]);
      } else {
        setCartItems(response.cartItems);
      }
      
      setCartSummary(response.cartSummary);
      setHasNextPage(response.pagination.hasNextPage);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching cart items:', err);
      setError('Failed to load cart items');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCartItems(1, false, true);
  };

  const handleClearCart = async () => {
    if (!axiosInstance || !session?.userId) {
      Alert.alert('Error', 'No authentication available');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Cart Empty', 'Your cart is already empty.');
      return;
    }

    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete all items one by one
              const deletePromises = cartItems.map(item => 
                deleteCartItem(axiosInstance, {
                  userId: parseInt(session.userId),
                  cartItemId: item.id
                })
              );
              
              await Promise.all(deletePromises);
              
              // Refresh cart data
              await fetchCartItems(1, false, false);
              
              Alert.alert(
                'Cart Cleared',
                'All items have been removed from your cart.',
                [{ text: 'OK' }]
              );
            } catch (err: any) {
              console.error('Error clearing cart:', err);
              Alert.alert('Error', 'Failed to clear cart. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteItem = async (cartItemId: number, itemName?: string) => {
    if (!axiosInstance || !session?.userId) {
      Alert.alert('Error', 'No authentication available');
      return;
    }

    Alert.alert(
      'Remove Item',
      `Are you sure you want to remove ${itemName ? `"${itemName}"` : 'this item'} from your cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Set loading state for this specific item
              setDeletingItems(prev => new Set(prev).add(cartItemId));
              
              await deleteCartItem(axiosInstance, {
                userId: parseInt(session.userId),
                cartItemId
              });
              
              // Remove from loading state
              setDeletingItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(cartItemId);
                return newSet;
              });
              
              // Refresh cart data to get updated summary
              await fetchCartItems(1, false, false);
              
              // Show success message
              Alert.alert(
                'Item Removed',
                `${itemName ? `"${itemName}"` : 'Item'} has been removed from your cart.`,
                [{ text: 'OK' }]
              );
            } catch (err: any) {
              console.error('Error deleting cart item:', err);
              
              // Remove from loading state
              setDeletingItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(cartItemId);
                return newSet;
              });
              
              // Refresh cart data to restore state
              await fetchCartItems(1, false, false);
              
              let errorMessage = 'Failed to remove item from cart';
              if (err.message) {
                errorMessage = err.message;
              }
              
              Alert.alert('Error', errorMessage);
            }
          }
        }
      ]
    );
  };

  const handleItemSelection = (itemId: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cartItems.map(item => item.id)));
    }
  };

  const handleRequestSelected = () => {
    if (selectedItems.size === 0) return;
    
    // Check if user can make requests
    if (!canRequestMedicine()) {
      if (isPendingUser()) {
        Alert.alert('Account Pending', 'Your account is pending approval. You can only view content at this time.');
      } else {
        Alert.alert('Permission Denied', 'Your account status does not allow medicine requests.');
      }
      return;
    }
    
    // Show reason input modal instead of routing
    setIsReasonModalVisible(true);
  };

  const handleSubmitRequest = async () => {
    if (!reasonInput.trim()) {
      Alert.alert('Error', 'Please provide a reason for your medicine request');
      return;
    }

    if (!axiosInstance || !session?.userId) {
      Alert.alert('Error', 'No authentication available');
      return;
    }

    setIsSubmittingRequest(true);
    
    try {
      // Get selected cart items
      const selectedCartItems = getSelectedItems();
      
      // Transform cart items to request format
      const requestData: CreateMedicineRequestData = {
        userId: parseInt(session.userId),
        reason: reasonInput.trim(),
        medicines: selectedCartItems.map(item => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
        })),
      };

      // Call the bulk request API (even for single user, it handles both cases)
      const response = await createBulkMedicineRequests(axiosInstance, [requestData]);
      
      // Show success message
      Alert.alert(
        'Success',
        `Successfully created medicine request with ${response.totalMedicinesRequested} medicine(s)`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Clear selection and close modal
              setSelectedItems(new Set());
              setIsReasonModalVisible(false);
              setReasonInput('');
              // Refresh cart items
              fetchCartItems(1, false, false);
            }
          }
        ]
      );
      
    } catch (error: any) {
      console.error('Error creating medicine request:', error);
      
      let errorMessage = 'Failed to create medicine request';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const getSelectedItemsCount = () => selectedItems.size;

  const getSelectedItems = () => {
    return cartItems.filter(item => selectedItems.has(item.id));
  };

  const renderCartItem = ({ item }: { item: CartItemWithAvailability }) => (
    <View className={`p-4 mb-3 bg-white rounded-xl shadow-sm ${deletingItems.has(item.id) ? 'opacity-50' : ''}`}>
      <View className="flex-row items-center">
        {/* Selection Checkbox */}
        <TouchableOpacity 
          onPress={() => handleItemSelection(item.id)}
          className="mr-3"
        >
          <View className={`w-6 h-6 rounded-md border-2 items-center justify-center ${
            selectedItems.has(item.id) 
              ? 'bg-blue-600 border-blue-600' 
              : 'border-gray-300'
          }`}>
            {selectedItems.has(item.id) && (
              <Ionicons name="checkmark" size={16} color="white" />
            )}
          </View>
        </TouchableOpacity>

        <View className="justify-center items-center mr-4 w-12 h-12 bg-blue-100 rounded-lg">
          <Ionicons name="medical-outline" size={24} color="#3B82F6" />
        </View>
        
        <View className="flex-1">
          <View className="flex-row justify-between items-center mb-1">
            <ThemedText weight="bold" className="text-gray-800">
              {item.medicine.name}
            </ThemedText>
            <TouchableOpacity 
              onPress={() => handleDeleteItem(item.id, item.medicine.name)}
              disabled={deletingItems.has(item.id)}
            >
              {deletingItems.has(item.id) ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              )}
            </TouchableOpacity>
          </View>
          <ThemedText weight="regular" className="mb-2 text-gray-600">
            {item.medicine.description}
          </ThemedText>
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center space-x-2">
              <View className="px-3 py-1 bg-blue-100 rounded-full">
                <ThemedText weight="medium" className="text-xs text-blue-600">
                  {item.medicine.type}
                </ThemedText>
              </View>
            </View>
            <View className="flex-row items-center space-x-4">
              <ThemedText weight="medium" className="text-sm text-gray-500">
                Qty: {item.quantity}
              </ThemedText>
            </View>
          </View>
          {!item.isAvailable && (
            <View className="p-2 mt-2 bg-red-50 rounded-lg">
              <ThemedText weight="medium" className="text-sm text-red-600">
                Out of stock (Available: {item.availableStock})
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasNextPage) {
      fetchCartItems(currentPage + 1, true, false);
    }
  }, [isLoadingMore, hasNextPage, currentPage]);

  const renderFooter = () => {
    if (!isLoadingMore || cartItems.length === 0) return null;
    
    return (
      <View className="items-center py-4">
        <ActivityIndicator size="small" color="#3B82F6" />
        <ThemedText weight="regular" className="mt-2 text-gray-500">
          Loading more items...
        </ThemedText>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View className="flex justify-center items-center py-8 h-full">
          <ActivityIndicator size="large" color="#f8f8ff" />
          <ThemedText weight="regular" className="mt-2 text-[#f8f8ff]">
            Loading cart items...
          </ThemedText>
        </View>
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
            onPress={() => fetchCartItems(1, false, false)}
          >
            <ThemedText weight="medium" className="text-white">
              Retry
            </ThemedText>
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <ViewLayout scrollEnabled={false}>
      <View className="flex-1">
        <View className="px-6 pt-12 pb-4">
          <View className="flex-row justify-between items-center">
            <View className='w-5 h-5'/>
            <ThemedText weight="bold" className="text-lg text-white">
              Shopping Cart
            </ThemedText>
            <View className="flex-row items-center space-x-3">
              {cartItems.length > 0 && (
                <TouchableOpacity onPress={handleClearCart}>
                  <Ionicons name="trash-outline" size={20} color="white" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => router.push('/authenticated')}>
                <Ionicons name="add" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Permission Status Message */}
        {!canRequestMedicine() && (
          <View className="px-6 pb-4">
            <View className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <View className="flex-row justify-center items-center">
                <Ionicons name="information-circle" size={16} color="#3B82F6" />
                <ThemedText weight="medium" className="ml-2 text-center text-blue-700">
                  {isPendingUser() 
                    ? 'Your account is pending approval. You can view your cart but cannot make requests until approved.'
                    : 'You do not have permission to make medicine requests at this time.'
                  }
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        <FlatList
          className="flex-1 px-6"
          data={cartItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCartItem}
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
            cartSummary ? (
              <View className="flex-col gap-3 mb-5">
                <View className="p-6 bg-white rounded-2xl shadow-lg">
                  <View className="mb-4">
                    <ThemedText weight="bold" className="mb-1 text-lg text-gray-800">
                      Cart Summary
                    </ThemedText>
                    <ThemedText weight="regular" className="text-sm text-gray-600">
                      Overview of your shopping cart
                    </ThemedText>
                  </View>
                  
                  <View className="p-4 mb-4 bg-blue-50 rounded-xl">
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center">
                        <View className="justify-center items-center mr-3 w-10 h-10 bg-blue-100 rounded-lg">
                          <Ionicons name="cart" size={20} color="#3B82F6" />
                        </View>
                        <View>
                          <ThemedText weight="bold" className="text-lg text-gray-800">
                            {cartSummary.totalItems}
                          </ThemedText>
                          <ThemedText weight="regular" className="text-sm text-gray-600">
                            Total Items
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  </View>
                  
                  <View className="flex-row space-x-3">
                    <View className="flex-1 p-4 bg-green-50 rounded-xl">
                      <View className="flex-row items-center mb-2">
                        <View className="justify-center items-center mr-2 w-8 h-8 bg-green-100 rounded-lg">
                          <Ionicons name="layers" size={16} color="#10B981" />
                        </View>
                        <ThemedText weight="bold" className="text-lg text-gray-800">
                          {cartSummary.totalQuantity}
                        </ThemedText>
                      </View>
                      <ThemedText weight="regular" className="text-xs text-gray-600">
                        Total Quantity
                      </ThemedText>
                    </View>
                    
                    <View className="flex-1 p-4 bg-purple-50 rounded-xl">
                      <View className="flex-row items-center mb-2">
                        <View className="justify-center items-center mr-2 w-8 h-8 bg-purple-100 rounded-lg">
                          <Ionicons name="checkmark-circle" size={16} color="#8B5CF6" />
                        </View>
                        <ThemedText weight="bold" className="text-lg text-gray-800">
                          {cartSummary.availableItems}
                        </ThemedText>
                      </View>
                      <ThemedText weight="regular" className="text-xs text-gray-600">
                        Available
                      </ThemedText>
                    </View>
                  </View>
                  
                  {cartSummary.outOfStockItems > 0 && (
                    <View className="p-3 mt-3 bg-red-50 rounded-xl">
                      <View className="flex-row items-center">
                        <View className="justify-center items-center mr-2 w-6 h-6 bg-red-100 rounded-lg">
                          <Ionicons name="alert-circle" size={14} color="#EF4444" />
                        </View>
                        <ThemedText weight="medium" className="text-sm text-red-600">
                          {cartSummary.outOfStockItems} items out of stock
                        </ThemedText>
                      </View>
                    </View>
                  )}
                </View>
                {/* Selection Controls */}
                {cartItems.length > 0 && (
                  <View className="">
                    <View className="flex-row justify-between items-center p-4 bg-white rounded-xl shadow-sm">
                      <TouchableOpacity 
                        onPress={handleSelectAll}
                        className="flex-row items-center"
                      >
                        <View className={`w-5 h-5 rounded-md border-2 items-center justify-center mr-2 ${
                          selectedItems.size === cartItems.length 
                            ? 'bg-blue-600 border-blue-600' 
                            : 'border-gray-300'
                        }`}>
                          {selectedItems.size === cartItems.length && (
                            <Ionicons name="checkmark" size={14} color="white" />
                          )}
                        </View>
                        <ThemedText weight="medium" className="text-gray-700">
                          {selectedItems.size === cartItems.length ? 'Deselect All' : 'Select All'}
                        </ThemedText>
                      </TouchableOpacity>
                      
                      {selectedItems.size > 0 && (
                        <ThemedText weight="medium" className="text-blue-600">
                          {getSelectedItemsCount()} selected
                        </ThemedText>
                      )}
                    </View>
                  </View>
                )}
              </View>
            ) : null
          )}
        />

        {/* Request Now Button */}
        {selectedItems.size > 0 && (
          <View className="px-6 py-4 bg-white border-t border-gray-200">
            <PermissionGate requireCanMakeRequests fallback={
              <View className="p-4 bg-gray-100 rounded-xl">
                <View className="flex-row justify-center items-center">
                  <Ionicons name="information-circle" size={20} color="#6B7280" />
                  <ThemedText weight="medium" className="ml-2 text-center text-gray-600">
                    {isPendingUser() 
                      ? 'Your account is pending approval. You can only view content at this time.'
                      : 'You do not have permission to make medicine requests.'
                    }
                  </ThemedText>
                </View>
              </View>
            }>
              <TouchableOpacity
                className="flex-row justify-center items-center py-4 bg-blue-600 rounded-xl"
                onPress={handleRequestSelected}
              >
                <Ionicons name="flash" size={20} color="white" />
                <ThemedText weight="semibold" className="ml-2 text-lg text-white">
                  Request Now ({getSelectedItemsCount()} items)
                </ThemedText>
              </TouchableOpacity>
            </PermissionGate>
          </View>
        )}

        {/* Reason Input Modal */}
        <Modal
          visible={isReasonModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsReasonModalVisible(false)}
        >
          <View className="flex-1 justify-center items-center px-6 bg-opacity-50 bg-black/40">
            <View className="p-6 w-full max-w-sm bg-white rounded-2xl shadow-xl">
              <View className="mb-4">
                <ThemedText weight="bold" className="mb-2 text-lg text-gray-800">
                  Medicine Request
                </ThemedText>
                <ThemedText weight="regular" className="text-sm text-gray-600">
                  Please provide a reason for requesting {getSelectedItemsCount()} medicine(s)
                </ThemedText>
              </View>
              
              <TextInput
                className="p-4 mb-4 w-full text-gray-800 rounded-xl border border-gray-300"
                placeholder="Enter reason for request..."
                value={reasonInput}
                onChangeText={setReasonInput}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              
              <View className="flex-col gap-3">
                <TouchableOpacity
                  className="px-4 py-4 rounded-xl border border-gray-300"
                  onPress={() => {
                    setIsReasonModalVisible(false);
                    setReasonInput('');
                  }}
                  disabled={isSubmittingRequest}
                >
                  <ThemedText weight="medium" className="text-center text-black">
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="px-4 py-4 bg-blue-600 rounded-xl"
                  onPress={handleSubmitRequest}
                  disabled={isSubmittingRequest}
                >
                  {isSubmittingRequest ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <ThemedText weight="semibold" className="text-center text-white">
                      Submit Request
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ViewLayout>
  );
}
