import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { ViewLayout } from '@/components/view-layout';
import ThemedText from '@/components/themed-text';
import { useContextProvider } from '@/context/ctx';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Formik } from 'formik';
import * as Yup from 'yup';

// Validation schema for signin
const SignInSchema = Yup.object().shape({
    username: Yup.string()
        .required('Username is required')
        .min(3, 'Username must be at least 3 characters'),
    password: Yup.string()
        .required('Password is required')
        .min(6, 'Password must be at least 6 characters'),
});

export default function Index() {
    const { login, isLoading } = useContextProvider();
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const handleSignIn = async (values: { username: string; password: string }) => {
        try {
            const result = await login({ username: values.username, password: values.password });
            if (result?.status === 'error') {
                Alert.alert('Error', result.message || 'Login failed');
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred');
        }
    };

    const handleGoogleSignIn = () => {
        Alert.alert('Info', 'Google sign-in functionality would be implemented here');
    };

    const handleFacebookSignIn = () => {
        Alert.alert('Info', 'Facebook sign-in functionality would be implemented here');
    };

    const handleForgotPassword = () => {
        Alert.alert('Info', 'Forgot password functionality would be implemented here');
    };

    const handleSignUp = () => {
        router.push('/signup' as any);
    };

    return (
        <ViewLayout scrollEnabled={false}>
            <View className="flex-1 justify-center px-4">
                <ScrollView 
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Main Card */}
                    <View className="p-5 bg-[#E7F3FE] rounded-3xl shadow-lg">
                        {/* Header Section */}
                        <View className="items-center mb-8">
                            {/* Shield Icon */}
                            <View className="justify-center items-center mb-4 w-16 h-16 bg-blue-500 rounded-full">
                                <Ionicons name="shield-checkmark" size={32} color="white" />
                            </View>
                            
                            {/* Welcome Text */}
                            <ThemedText weight="bold" className="mb-2 text-2xl text-gray-800">
                                Welcome Back
                            </ThemedText>
                            <ThemedText weight="regular" className="text-center text-gray-500">
                                Sign in to your account to continue
                            </ThemedText>
                        </View>

                        <Formik
                            initialValues={{ username: '', password: '' }}
                            validationSchema={SignInSchema}
                            onSubmit={handleSignIn}
                        >
                            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                                <>
                                    {/* Input Fields */}
                                    <View className="mb-6 space-y-4">
                                        {/* Username Field */}
                                        <View>
                                            <ThemedText weight="medium" className="mb-2 text-gray-700">
                                                Username
                                            </ThemedText>
                                            <View className={`flex-row items-center px-4 py-3 bg-gray-50 rounded-xl border ${
                                                errors.username && touched.username ? 'border-red-500' : 'border-gray-200'
                                            }`}>
                                                <Ionicons name="person-outline" size={20} color="#6B7280" />
                                                <TextInput
                                                    className="flex-1 ml-3 text-gray-800"
                                                    placeholder="Enter your username"
                                                    placeholderTextColor="#9CA3AF"
                                                    value={values.username}
                                                    onChangeText={handleChange('username')}
                                                    onBlur={handleBlur('username')}
                                                    autoCapitalize="none"
                                                    autoCorrect={false}
                                                />
                                            </View>
                                            {errors.username && touched.username && (
                                                <ThemedText weight="regular" className="mt-1 text-sm text-red-500">
                                                    {errors.username}
                                                </ThemedText>
                                            )}
                                        </View>

                                        {/* Password Field */}
                                        <View>
                                            <ThemedText weight="medium" className="mb-2 text-gray-700">
                                                Password
                                            </ThemedText>
                                            <View className={`flex-row items-center px-4 py-3 bg-gray-50 rounded-xl border ${
                                                errors.password && touched.password ? 'border-red-500' : 'border-gray-200'
                                            }`}>
                                                <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                                                <TextInput
                                                    className="flex-1 ml-3 text-gray-800"
                                                    placeholder="Enter your password"
                                                    placeholderTextColor="#9CA3AF"
                                                    value={values.password}
                                                    onChangeText={handleChange('password')}
                                                    onBlur={handleBlur('password')}
                                                    secureTextEntry={!showPassword}
                                                    autoCapitalize="none"
                                                />
                                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                                    <Ionicons 
                                                        name={showPassword ? "eye-off-outline" : "eye-outline"} 
                                                        size={20} 
                                                        color="#6B7280" 
                                                    />
                                                </TouchableOpacity>
                                            </View>
                                            {errors.password && touched.password && (
                                                <ThemedText weight="regular" className="mt-1 text-sm text-red-500">
                                                    {errors.password}
                                                </ThemedText>
                                            )}
                                        </View>
                                    </View>

                                    {/* Remember Me and Forgot Password */}
                                    <View className="flex-row justify-between items-center mb-6">
                                        <TouchableOpacity 
                                            className="flex-row items-center"
                                            onPress={() => setRememberMe(!rememberMe)}
                                        >
                                            <View className={`w-5 h-5 rounded border-2 mr-2 items-center justify-center ${
                                                rememberMe ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                                            }`}>
                                                {rememberMe && <Ionicons name="checkmark" size={12} color="white" />}
                                            </View>
                                            <ThemedText weight="regular" className="text-gray-600">
                                                Remember me
                                            </ThemedText>
                                        </TouchableOpacity>
                                        
                                        <TouchableOpacity onPress={handleForgotPassword}>
                                            <ThemedText weight="medium" className="text-blue-500">
                                                Forgot password?
                                            </ThemedText>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Sign In Button */}
                                    <TouchableOpacity
                                        className={`bg-blue-500 rounded-xl py-4 flex-row items-center justify-center mb-6 ${
                                            isLoading ? 'opacity-50' : ''}`}
                                        onPress={() => handleSubmit()}
                                        disabled={isLoading}
                                    >
                                        <ThemedText weight="semibold" className="mr-2 text-lg text-white">
                                            {isLoading ? 'Signing In...' : 'Sign In'}
                                        </ThemedText>
                                        <Ionicons name="arrow-forward" size={20} color="white" />
                                    </TouchableOpacity>
                                </>
                            )}
                        </Formik>

                        {/* Divider */}
                        <View className="flex-row items-center mb-6">
                            <View className="flex-1 h-px bg-gray-300" />
                            <ThemedText weight="medium" className="mx-4 text-gray-500">
                                Or continue with
                            </ThemedText>
                            <View className="flex-1 h-px bg-gray-300" />
                        </View>

                        {/* Social Login Buttons */}
                        <View className="flex-row gap-2 mb-6 space-x-4">
                            <TouchableOpacity
                                className="flex-row flex-1 justify-center items-center py-3 bg-white rounded-xl border border-gray-200"
                                onPress={handleGoogleSignIn}
                            >
                                <Text className="mr-2 text-lg font-bold text-blue-500">G</Text>
                                <ThemedText weight="medium" className="text-gray-700">
                                    Google
                                </ThemedText>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                className="flex-row flex-1 justify-center items-center py-3 bg-white rounded-xl border border-gray-200"
                                onPress={handleFacebookSignIn}
                            >
                                <Text className="mr-2 text-lg font-bold text-blue-600">f</Text>
                                <ThemedText weight="medium" className="text-gray-700">
                                    Facebook
                                </ThemedText>
                            </TouchableOpacity>
                        </View>

                        {/* Sign Up Link */}
                        <View className="flex-row justify-center">
                            <ThemedText weight="regular" className="text-gray-600">
                                Don't have an account?{' '}
                            </ThemedText>
                            <TouchableOpacity onPress={handleSignUp}>
                                <ThemedText weight="medium" className="text-blue-500">
                                    Sign Up
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </ViewLayout>
    );
}
