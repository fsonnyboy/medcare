import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Image } from 'react-native';
import { ViewLayout } from '@/components/view-layout';
import ThemedText from '@/components/themed-text';
import CustomDatePicker from '@/components/custom-date-picker';
import { Ionicons } from '@expo/vector-icons';
import { useContextProvider } from '@/context/ctx';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { userData as userDataAtom } from '@/utils/atom';
import { UserProfile, UpdateProfileData } from '@/types/profile';
import { getUserData } from '@/queries/profile/user-data';
import { updateProfile, updatePassword } from '@/mutations/profile/update';
import { router } from 'expo-router';

export default function UpdateProfile() {
    const { axiosInstance, session } = useContextProvider();
    const storedUserData = useRecoilValue(userDataAtom);
    const setUserData = useSetRecoilState(userDataAtom);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    // Form state
    const [formData, setFormData] = useState<UpdateProfileData>({
        userId: 0,
        name: '',
        middleName: '',
        lastName: '',
        DateOfBirth: '',
        age: '',
        address: '',
        contactNumber: '',
        image: '',
    });

    // Validation state
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // Password form state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
    const [passwordTouched, setPasswordTouched] = useState<Record<string, boolean>>({});

    const fetchUserData = async () => {
        if (!axiosInstance || !session?.userId) {
            setError('No authentication available');
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            const data = await getUserData(axiosInstance, { 
                userId: parseInt(session.userId) 
            });
            setUserProfile(data.profile);
            
            // Prepopulate form with user data
            setFormData({
                userId: data.profile.id,
                name: data.profile.name || '',
                middleName: data.profile.middleName || '',
                lastName: data.profile.lastName || '',
                DateOfBirth: data.profile.DateOfBirth || '',
                age: data.profile.age ? data.profile.age.toString() : '',
                address: data.profile.address || '',
                contactNumber: data.profile.contactNumber || '',
                image: data.profile.image || '',
            });
        } catch (err: any) {
            console.error('Error fetching user data:', err);
            setError(err.message || 'Failed to fetch user data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [axiosInstance, session?.userId]);

    // Calculate age when date of birth changes
    useEffect(() => {
        if (formData.DateOfBirth) {
            const birthDate = new Date(formData.DateOfBirth);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            
            setFormData(prev => ({
                ...prev,
                age: age.toString()
            }));
        }
    }, [formData.DateOfBirth]);

    const validateField = (name: string, value: string) => {
        switch (name) {
            case 'name':
                if (!value.trim()) return 'Name is required';
                if (value.length > 100) return 'Name too long';
                break;
            case 'DateOfBirth':
                if (!value.trim()) return 'Date of birth is required';
                break;
            case 'contactNumber':
                if (value && !/^\+?[\d\s\-\(\)]+$/.test(value)) {
                    return 'Invalid phone number format';
                }
                break;
        }
        return '';
    };

    const handleInputChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Validate field
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
        
        // Mark field as touched
        setTouched(prev => ({ ...prev, [name]: true }));
    };

    const handleDateChange = (date: string) => {
        handleInputChange('DateOfBirth', date);
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        
        Object.keys(formData).forEach(key => {
            if (key !== 'userId' && key !== 'middleName' && key !== 'lastName' && 
                key !== 'age' && key !== 'address' && key !== 'contactNumber' && key !== 'image') {
                const error = validateField(key, formData[key as keyof UpdateProfileData] as string);
                if (error) {
                    newErrors[key] = error;
                }
            }
        });
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            Alert.alert('Validation Error', 'Please fix the errors in the form');
            return;
        }

        try {
            setIsUpdating(true);
            setError(null);
            
            const response = await updateProfile(axiosInstance, formData);
            
            // Update the user atom with the new profile data
            if (response.profile) {
                setUserData({
                    id: response.profile.id,
                    username: response.profile.username,
                    name: response.profile.name,
                    middleName: response.profile.middleName || '',
                    lastName: response.profile.lastName,
                    image: response.profile.image || '',
                    DateOfBirth: response.profile.DateOfBirth || '',
                    age: response.profile.age || 0,
                    address: response.profile.address || '',
                    contactNumber: response.profile.contactNumber || '',
                    status: response.profile.status,
                    createdAt: response.profile.createdAt,
                    updatedAt: response.profile.updatedAt,
                });
                console.log('User atom updated with new profile data');
            }
            
            // Show success message briefly
            setShowSuccessMessage(true);
            setTimeout(() => setShowSuccessMessage(false), 3000);
            
            Alert.alert(
                'Success',
                'Profile updated successfully',
                [
                    {
                        text: 'OK',
                        onPress: () => router.back()
                    }
                ]
            );
        } catch (err: any) {
            console.error('Error updating profile:', err);
            setError(err.message || 'Failed to update profile');
            Alert.alert('Error', err.message || 'Failed to update profile');
        } finally {
            setIsUpdating(false);
        }
    };

    const validatePasswordField = (name: string, value: string) => {
        switch (name) {
            case 'currentPassword':
                if (!value.trim()) return 'Current password is required';
                break;
            case 'newPassword':
                if (!value.trim()) return 'New password is required';
                if (value.length < 6) return 'Password must be at least 6 characters';
                break;
            case 'confirmPassword':
                if (!value.trim()) return 'Please confirm your password';
                if (value !== passwordData.newPassword) return 'Passwords do not match';
                break;
        }
        return '';
    };

    const handlePasswordChange = (name: string, value: string) => {
        setPasswordData(prev => ({ ...prev, [name]: value }));
        
        // Validate field
        const error = validatePasswordField(name, value);
        setPasswordErrors(prev => ({ ...prev, [name]: error }));
        
        // Mark field as touched
        setPasswordTouched(prev => ({ ...prev, [name]: true }));
    };

    const validatePasswordForm = () => {
        const newErrors: Record<string, string> = {};
        
        Object.keys(passwordData).forEach(key => {
            const error = validatePasswordField(key, passwordData[key as keyof typeof passwordData]);
            if (error) {
                newErrors[key] = error;
            }
        });
        
        setPasswordErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePasswordSubmit = async () => {
        if (!validatePasswordForm()) {
            Alert.alert('Validation Error', 'Please fix the errors in the password form');
            return;
        }

        try {
            setIsUpdatingPassword(true);
            setError(null);
            
            await updatePassword(axiosInstance, {
                userId: formData.userId,
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
                confirmPassword: passwordData.confirmPassword,
            });
            
            // Clear password form
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
            setPasswordErrors({});
            setPasswordTouched({});
            
            Alert.alert(
                'Success',
                'Password updated successfully',
                [{ text: 'OK' }]
            );
        } catch (err: any) {
            console.error('Error updating password:', err);
            setError(err.message || 'Failed to update password');
            Alert.alert('Error', err.message || 'Failed to update password');
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const renderInput = (
        name: string,
        label: string,
        placeholder: string,
        icon: string,
        keyboardType: 'default' | 'email-address' | 'numeric' | 'phone-pad' = 'default',
        multiline: boolean = false
    ) => {
        const value = formData[name as keyof UpdateProfileData] as string;
        const error = errors[name];
        const isTouched = touched[name];

        return (
            <View className="mb-4">
                <ThemedText weight="medium" className="mb-2 text-gray-700">
                    {label}
                </ThemedText>
                <View className={`flex-row items-center px-4 py-3 bg-gray-50 rounded-xl border ${
                    error && isTouched ? 'border-red-500' : 'border-gray-200'
                }`}>
                    <Ionicons name={icon as any} size={20} color="#6B7280" />
                    <TextInput
                        className="flex-1 ml-3 text-gray-800"
                        placeholder={placeholder}
                        placeholderTextColor="#9CA3AF"
                        value={value}
                        onChangeText={(text) => handleInputChange(name, text)}
                        onBlur={() => setTouched(prev => ({ ...prev, [name]: true }))}
                        keyboardType={keyboardType}
                        multiline={multiline}
                        numberOfLines={multiline ? 3 : 1}
                        textAlignVertical={multiline ? 'top' : 'center'}
                    />
                </View>
                {error && isTouched && (
                    <ThemedText weight="regular" className="mt-1 text-sm text-red-500">
                        {error}
                    </ThemedText>
                )}
            </View>
        );
    };

    if (isLoading) {
        return (
            <ViewLayout scrollEnabled={false}>
                <View className="flex-1 justify-center items-center h-full">
                    <ActivityIndicator size="large" color="#f8f8ff" />
                    <ThemedText weight="medium" className="mt-4 text-[#f8f8ff]">
                        Loading profile...
                    </ThemedText>
                </View>
            </ViewLayout>
        );
    }

    if (error) {
        return (
            <ViewLayout>
                <View className="flex-1 justify-center items-center px-6">
                    <Ionicons name="alert-circle" size={60} color="#EF4444" />
                    <ThemedText weight="medium" className="mt-4 text-center text-red-600">
                        {error}
                    </ThemedText>
                    <TouchableOpacity 
                        className="px-6 py-3 mt-6 bg-red-100 rounded-xl"
                        onPress={fetchUserData}
                    >
                        <ThemedText weight="medium" className="text-red-600">
                            Retry
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </ViewLayout>
        );
    }

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
                            Update Profile
                        </ThemedText>
                        <View className="w-6" />
                    </View>
                </View>

                <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                    {/* Success Message */}
                    {showSuccessMessage && (
                        <View className="p-4 mt-4 mb-2 bg-green-50 rounded-xl border border-green-200">
                            <View className="flex-row items-center">
                                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                <ThemedText weight="medium" className="ml-2 text-green-700">
                                    Profile updated successfully! User data has been refreshed.
                                </ThemedText>
                            </View>
                        </View>
                    )}
                    
                    {/* Profile Image Section */}
                    <View className="bg-[#E7F3FE] rounded-xl p-6 mt-6 mb-6 shadow-sm">
                        <View className="items-center">
                            <View className="justify-center items-center mb-4 w-24 h-24 bg-blue-100 rounded-full">
                                {userProfile?.image ? (
                                    <Image 
                                        source={{ uri: userProfile.image }} 
                                        className="w-24 h-24 rounded-full"
                                    />
                                ) : (
                                    <Ionicons name="person" size={48} color="#3B82F6" />
                                )}
                            </View>
                            <TouchableOpacity className="px-4 py-2 bg-blue-100 rounded-xl">
                                <ThemedText weight="medium" className="text-blue-600">
                                    Change Photo
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Form */}
                    <View className="p-6 mb-6 bg-white rounded-xl shadow-sm">
                        <View className="flex-row justify-between items-center mb-4">
                            <ThemedText weight="bold" className="text-lg text-gray-800">
                                Personal Information
                            </ThemedText>
                            <TouchableOpacity
                                className={`p-2 rounded-full ${isUpdating ? 'bg-gray-300' : 'bg-blue-500'}`}
                                onPress={handleSubmit}
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Ionicons name="checkmark" size={20} color="white" />
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Name */}
                        {renderInput('name', 'First Name', 'Enter your first name', 'person-outline')}

                        {/* Middle Name */}
                        {renderInput('middleName', 'Middle Name (Optional)', 'Enter your middle name', 'person-outline')}

                        {/* Last Name */}
                        {renderInput('lastName', 'Last Name (Optional)', 'Enter your last name', 'person-outline')}

                        {/* Date of Birth */}
                        <View className="mb-4">
                            <ThemedText weight="medium" className="mb-2 text-gray-700">
                                Date of Birth
                            </ThemedText>
                            <CustomDatePicker
                                value={formData.DateOfBirth}
                                onDateChange={handleDateChange}
                                placeholder="Select your date of birth"
                                error={errors.DateOfBirth}
                                touched={touched.DateOfBirth}
                                maximumDate={new Date()}
                            />
                        </View>

                        {/* Age (Auto-calculated) */}
                        <View className="mb-4">
                            <ThemedText weight="medium" className="mb-2 text-gray-700">
                                Age
                            </ThemedText>
                            <View className="flex-row items-center px-4 py-3 bg-gray-100 rounded-xl border border-gray-200">
                                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                                <TextInput
                                    className="flex-1 ml-3 text-gray-600"
                                    value={formData.age}
                                    editable={false}
                                    placeholder="Auto-calculated"
                                    placeholderTextColor="#9CA3AF"
                                />
                                <Ionicons name="calculator-outline" size={20} color="#6B7280" />
                            </View>
                        </View>

                        {/* Contact Number */}
                        {renderInput('contactNumber', 'Contact Number (Optional)', 'Enter your phone number', 'call-outline', 'phone-pad')}

                        {/* Address */}
                        <View className="mb-4">
                            <ThemedText weight="medium" className="mb-2 text-gray-700">
                                Address (Optional)
                            </ThemedText>
                            <View className={`flex-row items-start px-4 py-3 bg-gray-50 rounded-xl border ${
                                errors.address && touched.address ? 'border-red-500' : 'border-gray-200'
                            }`}>
                                <Ionicons name="location-outline" size={20} color="#6B7280" style={{ marginTop: 2 }} />
                                <TextInput
                                    className="flex-1 ml-3 text-gray-800"
                                    placeholder="Enter your address"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.address}
                                    onChangeText={(text) => handleInputChange('address', text)}
                                    onBlur={() => setTouched(prev => ({ ...prev, address: true }))}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />
                            </View>
                                                 </View>
                     </View>

                     {/* Password Update Card */}
                     <View className="p-6 mb-6 bg-white rounded-xl shadow-sm">
                         <View className="flex-row justify-between items-center mb-4">
                             <ThemedText weight="bold" className="text-lg text-gray-800">
                                 Change Password
                             </ThemedText>
                             <TouchableOpacity
                                 className={`p-2 rounded-full ${isUpdatingPassword ? 'bg-gray-300' : 'bg-green-500'}`}
                                 onPress={handlePasswordSubmit}
                                 disabled={isUpdatingPassword}
                             >
                                 {isUpdatingPassword ? (
                                     <ActivityIndicator size="small" color="white" />
                                 ) : (
                                     <Ionicons name="checkmark" size={20} color="white" />
                                 )}
                             </TouchableOpacity>
                         </View>

                         {/* Current Password */}
                         <View className="mb-4">
                             <ThemedText weight="medium" className="mb-2 text-gray-700">
                                 Current Password
                             </ThemedText>
                             <View className={`flex-row items-center px-4 py-3 bg-gray-50 rounded-xl border ${
                                 passwordErrors.currentPassword && passwordTouched.currentPassword ? 'border-red-500' : 'border-gray-200'
                             }`}>
                                 <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                                 <TextInput
                                     className="flex-1 ml-3 text-gray-800"
                                     placeholder="Enter your current password"
                                     placeholderTextColor="#9CA3AF"
                                     value={passwordData.currentPassword}
                                     onChangeText={(text) => handlePasswordChange('currentPassword', text)}
                                     onBlur={() => setPasswordTouched(prev => ({ ...prev, currentPassword: true }))}
                                     secureTextEntry
                                 />
                             </View>
                             {passwordErrors.currentPassword && passwordTouched.currentPassword && (
                                 <ThemedText weight="regular" className="mt-1 text-sm text-red-500">
                                     {passwordErrors.currentPassword}
                                 </ThemedText>
                             )}
                         </View>

                         {/* New Password */}
                         <View className="mb-4">
                             <ThemedText weight="medium" className="mb-2 text-gray-700">
                                 New Password
                             </ThemedText>
                             <View className={`flex-row items-center px-4 py-3 bg-gray-50 rounded-xl border ${
                                 passwordErrors.newPassword && passwordTouched.newPassword ? 'border-red-500' : 'border-gray-200'
                             }`}>
                                 <Ionicons name="lock-open-outline" size={20} color="#6B7280" />
                                 <TextInput
                                     className="flex-1 ml-3 text-gray-800"
                                     placeholder="Enter your new password"
                                     placeholderTextColor="#9CA3AF"
                                     value={passwordData.newPassword}
                                     onChangeText={(text) => handlePasswordChange('newPassword', text)}
                                     onBlur={() => setPasswordTouched(prev => ({ ...prev, newPassword: true }))}
                                     secureTextEntry
                                 />
                             </View>
                             {passwordErrors.newPassword && passwordTouched.newPassword && (
                                 <ThemedText weight="regular" className="mt-1 text-sm text-red-500">
                                     {passwordErrors.newPassword}
                                 </ThemedText>
                             )}
                         </View>

                         {/* Confirm Password */}
                         <View className="mb-4">
                             <ThemedText weight="medium" className="mb-2 text-gray-700">
                                 Confirm New Password
                             </ThemedText>
                             <View className={`flex-row items-center px-4 py-3 bg-gray-50 rounded-xl border ${
                                 passwordErrors.confirmPassword && passwordTouched.confirmPassword ? 'border-red-500' : 'border-gray-200'
                             }`}>
                                 <Ionicons name="shield-checkmark-outline" size={20} color="#6B7280" />
                                 <TextInput
                                     className="flex-1 ml-3 text-gray-800"
                                     placeholder="Confirm your new password"
                                     placeholderTextColor="#9CA3AF"
                                     value={passwordData.confirmPassword}
                                     onChangeText={(text) => handlePasswordChange('confirmPassword', text)}
                                     onBlur={() => setPasswordTouched(prev => ({ ...prev, confirmPassword: true }))}
                                     secureTextEntry
                                 />
                             </View>
                             {passwordErrors.confirmPassword && passwordTouched.confirmPassword && (
                                 <ThemedText weight="regular" className="mt-1 text-sm text-red-500">
                                     {passwordErrors.confirmPassword}
                                 </ThemedText>
                             )}
                         </View>
                     </View>
                 </ScrollView>
            </View>
        </ViewLayout>
    );
} 