import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { ViewLayout } from '@/components/view-layout';
import ThemedText from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import CustomDatePicker from '@/components/custom-date-picker';
import { configureGoogleSignIn } from '@/utils/googleAuth';
import { useContextProvider } from '@/context/ctx';

import { signup, validateSignupData } from '@/mutations/auth/signup';
import { SignupData } from '@/types/auth';

// Validation schema for signup
const SignUpSchema = Yup.object().shape({
    username: Yup.string()
        .required('Username is required')
        .min(3, 'Username must be at least 3 characters')
        .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    name: Yup.string()
        .required('Name is required')
        .min(2, 'Name must be at least 2 characters')
        .matches(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
    DateOfBirth: Yup.string()
        .required('Date of birth is required'),
    password: Yup.string()
        .required('Password is required')
        .min(6, 'Password must be at least 6 characters'),
    confirmPassword: Yup.string()
        .required('Please confirm your password')
        .oneOf([Yup.ref('password')], 'Passwords must match'),
    agreeToTerms: Yup.boolean()
        .oneOf([true], 'You must agree to the terms and conditions'),
});

export default function SignUp() {
    const { googleSignup } = useContextProvider();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const formikRef = useRef<any>(null);

    // Configure Google Sign-In on component mount
    useEffect(() => {
        configureGoogleSignIn();
    }, []);

    const handleSignUp = async (values: any) => {
        setIsLoading(true);
        
        try {
            // Prepare signup data
            const signupData: SignupData = {
                username: values.username,
                password: values.password,
                name: values.name,
                DateOfBirth: values.DateOfBirth,
                // Optional fields
                middleName: values.middleName || undefined,
                lastName: values.lastName || undefined,
                age: values.age || undefined,
                address: values.address || undefined,
                contactNumber: values.contactNumber || undefined,
            };

            // Validate data before sending to API
            const validation = validateSignupData(signupData);
            if (!validation.isValid) {
                Alert.alert('Validation Error', validation.errors.join('\n'));
                return;
            }

            // Call signup mutation
            await signup(signupData);
            router.push('/');
            
        } catch (error: any) {
            console.error('Signup error:', error);
            
            let errorMessage = 'Registration failed. Please try again.';
            
            if (error.message.includes('Username already exists')) {
                errorMessage = 'Username is already taken. Please choose a different username.';
            } else if (error.message.includes('Validation failed')) {
                errorMessage = 'Please check your input data and try again.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            Alert.alert('Registration Failed', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        try {
            const result = await googleSignup();
            if (result?.status === 'error') {
                Alert.alert('Error', result.message || 'Google signup failed');
            } else if (result?.status === 'success') {
                if (result.message) {
                    Alert.alert('Success', result.message);
                }
                router.push('/');
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred during Google signup');
        }
    };

    return (
        <ViewLayout scrollEnabled={false}>
            <View className="flex-1 pt-5">
                <ScrollView 
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                    className="px-6"
                >

                    {/* Main Card */}
                    <View className="p-8 mb-6 bg-[#E7F3FE] rounded-3xl shadow-lg">
                        {/* Header Section - Outside the card */}
                        <View className="items-center pt-8 pb-8">
                            <ThemedText weight="bold" className="mb-2 text-2xl text-gray-800">
                                Create Account
                            </ThemedText>
                            <ThemedText weight="regular" className="text-lg text-center text-gray-500">
                                Join us and get started today
                            </ThemedText>
                        </View>

                        <Formik
                            innerRef={formikRef}
                            initialValues={{
                                username: '',
                                name: '',
                                DateOfBirth: '',
                                password: '',
                                confirmPassword: '',
                                agreeToTerms: false,
                            }}
                            validationSchema={SignUpSchema}
                            onSubmit={handleSignUp}
                        >
                            {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
                                <>
                                    <View className="space-y-4">
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
                                                />
                                            </View>
                                            {errors.username && touched.username && (
                                                <ThemedText weight="regular" className="mt-1 text-sm text-red-500">
                                                    {errors.username}
                                                </ThemedText>
                                            )}
                                        </View>

                                        {/* Name Field */}
                                        <View>
                                            <ThemedText weight="medium" className="mb-2 text-gray-700">
                                                Full Name
                                            </ThemedText>
                                            <View className={`flex-row items-center px-4 py-3 bg-gray-50 rounded-xl border ${
                                                errors.name && touched.name ? 'border-red-500' : 'border-gray-200'
                                            }`}>
                                                <Ionicons name="person-outline" size={20} color="#6B7280" />
                                                <TextInput
                                                    className="flex-1 ml-3 text-gray-800"
                                                    placeholder="Enter your full name"
                                                    placeholderTextColor="#9CA3AF"
                                                    value={values.name}
                                                    onChangeText={handleChange('name')}
                                                    onBlur={handleBlur('name')}
                                                    autoCapitalize="words"
                                                />
                                            </View>
                                            {errors.name && touched.name && (
                                                <ThemedText weight="regular" className="mt-1 text-sm text-red-500">
                                                    {errors.name}
                                                </ThemedText>
                                            )}
                                        </View>

                                        {/* Date of Birth Field */}
                                        <View>
                                            <ThemedText weight="medium" className="mb-2 text-gray-700">
                                                Date of Birth
                                            </ThemedText>
                                            <CustomDatePicker
                                                value={values.DateOfBirth}
                                                onDateChange={(date) => setFieldValue('DateOfBirth', date)}
                                                placeholder="Select your date of birth"
                                                error={errors.DateOfBirth}
                                                touched={touched.DateOfBirth}
                                                maximumDate={new Date()}
                                                minimumDate={new Date(1900, 0, 1)}
                                            />
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
                                                    placeholder="Create password"
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

                                        {/* Confirm Password Field */}
                                        <View>
                                            <ThemedText weight="medium" className="mb-2 text-gray-700">
                                                Confirm Password
                                            </ThemedText>
                                            <View className={`flex-row items-center px-4 py-3 bg-gray-50 rounded-xl border ${
                                                errors.confirmPassword && touched.confirmPassword ? 'border-red-500' : 'border-gray-200'
                                            }`}>
                                                <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                                                <TextInput
                                                    className="flex-1 ml-3 text-gray-800"
                                                    placeholder="Confirm password"
                                                    placeholderTextColor="#9CA3AF"
                                                    value={values.confirmPassword}
                                                    onChangeText={handleChange('confirmPassword')}
                                                    onBlur={handleBlur('confirmPassword')}
                                                    secureTextEntry={!showConfirmPassword}
                                                    autoCapitalize="none"
                                                />
                                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                                    <Ionicons 
                                                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                                                        size={20} 
                                                        color="#6B7280" 
                                                    />
                                                </TouchableOpacity>
                                            </View>
                                            {errors.confirmPassword && touched.confirmPassword && (
                                                <ThemedText weight="regular" className="mt-1 text-sm text-red-500">
                                                    {errors.confirmPassword}
                                                </ThemedText>
                                            )}
                                        </View>
                                    </View>

                                    {/* Terms and Conditions */}
                                    <View className="flex-row items-start mt-6">
                                        <TouchableOpacity 
                                            className="flex-row items-start"
                                            onPress={() => setFieldValue('agreeToTerms', !values.agreeToTerms)}
                                        >
                                            <View className={`w-5 h-5 rounded border-2 mr-2 mt-1 items-center justify-center ${
                                                values.agreeToTerms ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                                            }`}>
                                                {values.agreeToTerms && <Ionicons name="checkmark" size={12} color="white" />}
                                            </View>
                                            <ThemedText weight="regular" className="flex-1 text-sm text-gray-600">
                                                I agree to the{' '}
                                                <Text className="text-blue-500">Terms of Service</Text>
                                                {' '}and{' '}
                                                <Text className="text-blue-500">Privacy Policy</Text>
                                            </ThemedText>
                                        </TouchableOpacity>
                                    </View>
                                    {errors.agreeToTerms && touched.agreeToTerms && (
                                        <ThemedText weight="regular" className="mt-1 text-sm text-red-500">
                                            {errors.agreeToTerms}
                                        </ThemedText>
                                    )}

                                    {/* Create Account Button */}
                                    <TouchableOpacity
                                        className={`flex-row justify-center items-center py-4 mb-6 rounded-xl ${
                                            isLoading ? 'bg-gray-400' : 'bg-blue-500'
                                        }`}
                                        onPress={() => handleSubmit()}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <ActivityIndicator size="small" color="white" />
                                                <ThemedText weight="semibold" className="ml-2 text-lg text-white">
                                                    Creating Account...
                                                </ThemedText>
                                            </>
                                        ) : (
                                            <>
                                                <ThemedText weight="semibold" className="mr-2 text-lg text-white">
                                                    Create Account
                                                </ThemedText>
                                                <Ionicons name="arrow-forward" size={20} color="white" />
                                            </>
                                        )}
                                                        </TouchableOpacity>

                    {/* Divider */}
                    <View className="flex-row items-center my-6">
                        <View className="flex-1 h-px bg-gray-300" />
                        <ThemedText weight="medium" className="mx-4 text-gray-500">
                            Or continue with
                        </ThemedText>
                        <View className="flex-1 h-px bg-gray-300" />
                    </View>

                    {/* Google Sign Up Button */}
                    <TouchableOpacity
                        className="flex-row justify-center items-center py-3 mb-6 bg-white rounded-xl border border-gray-200"
                        onPress={handleGoogleSignUp}
                        disabled={isLoading}
                    >
                        <Text className="mr-2 text-lg font-bold text-red-500">G</Text>
                        <ThemedText weight="medium" className="text-gray-700">
                            Continue with Google
                        </ThemedText>
                    </TouchableOpacity>
                </>
            )}
        </Formik>
    </View>

    {/* Sign In Link */}
    <View className="flex-row justify-center mb-8">
                        <ThemedText weight="regular" className="text-gray-900">
                            Already have an account?{' '}
                        </ThemedText>
                        <TouchableOpacity onPress={() => router.back()}>
                            <ThemedText weight="bold" className="italic text-white">
                                Sign In
                            </ThemedText>
                        </TouchableOpacity>
                    </View>

                                         {/* Security Message */}
                     <View className="flex-row justify-center items-center mb-8">
                         <Ionicons name="shield-checkmark" size={16} color="#ffff" />
                         <ThemedText weight="regular" className="ml-2 text-sm text-white">
                             Your information is secure and encrypted
                         </ThemedText>
                     </View>
                 </ScrollView>
             </View>

         </ViewLayout>
     );
 } 