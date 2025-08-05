import React, { useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, ActivityIndicator, RefreshControl, FlatList, Alert } from 'react-native';
import { ViewLayout } from '@/components/view-layout';
import ThemedText from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useContextProvider } from '@/context/ctx';
import { getCartItems } from '@/queries/cart/getCartItems';
import { deleteCartItem } from '@/mutations/cart/deleteCartItem';
import { CartItemWithAvailability, CartSummary, GetCartItemsResponse } from '@/types/cart';

export default function CartScreen() {
  const { axiosInstance, session } = useContextProvider();
  const [cartItems, setCartItems] = useState<CartItemWithAvailability[]>([]);
  const [cartSummary, setCartSummary] = useState<CartSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [deletingItems, setDeletingItems] = useState<Set<number>>(new Set());

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

  const renderCartItem = ({ item }: { item: CartItemWithAvailability }) => (
    <View className={`p-4 mb-3 bg-white rounded-xl shadow-sm ${deletingItems.has(item.id) ? 'opacity-50' : ''}`}>
      <View className="flex-row items-center">
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
              <View className="mb-6">
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
              </View>
            ) : null
          )}
        />
      </View>
    </ViewLayout>
  );
}
