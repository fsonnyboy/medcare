import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { ViewLayout } from '@/components/view-layout';
import ThemedText from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useContextProvider } from '@/context/ctx';
import { submitConcern, validateConcernData } from '@/mutations/concern/submit';
import { ConcernData } from '@/types/concern';

// Validation schema for concern feedback
const ConcernSchema = Yup.object().shape({
  subject: Yup.string()
    .required('Subject is required')
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must be less than 200 characters'),
  description: Yup.string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
});

export default function ConcernFeedback() {
  const { axiosInstance, session } = useContextProvider();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitConcern = async (values: ConcernData) => {
    if (!axiosInstance || !session?.userId) {
      Alert.alert('Error', 'Authentication required to submit concern');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Validate data before sending to API
      const validation = validateConcernData(values);
      if (!validation.isValid) {
        Alert.alert('Validation Error', validation.errors.join('\n'));
        return;
      }

      // Call submit concern mutation
      const response = await submitConcern(axiosInstance, values, session.userId);
      
      Alert.alert(
        'Concern Submitted Successfully!',
        'Your concern has been submitted to our admin team. We will review it and get back to you soon.',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
      
    } catch (error: any) {
      console.error('Concern submission error:', error);
      Alert.alert(
        'Submission Failed',
        error.message || 'Failed to submit concern. Please try again later.'
      );
    } finally {
      setIsSubmitting(false);
    }
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
              Report Concern
            </ThemedText>
            <View style={{ width: 40 }} />
          </View>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Info Card */}
          <View className="bg-[#E7F3FE] rounded-xl p-6 mb-6 shadow-sm">
            <View className="items-center mb-4">
              <View className="justify-center items-center mb-3 w-16 h-16 bg-blue-100 rounded-full">
                <Ionicons name="chatbubble-outline" size={32} color="#3B82F6" />
              </View>
              <ThemedText weight="bold" className="mb-2 text-lg text-gray-800">
                Report Your Concern
              </ThemedText>
              <ThemedText weight="regular" className="text-center text-gray-600">
                Help us improve by sharing your feedback, reporting issues, or raising concerns. Our admin team will review and respond to your message.
              </ThemedText>
            </View>
          </View>

          {/* Form */}
          <View className="p-6 mb-6 bg-white rounded-xl shadow-sm">
            <Formik
              initialValues={{
                subject: '',
                description: '',
              }}
              validationSchema={ConcernSchema}
              onSubmit={handleSubmitConcern}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <>
                  <View className="space-y-6">
                    {/* Subject Field */}
                    <View>
                      <ThemedText weight="medium" className="mb-2 text-gray-700">
                        Subject *
                      </ThemedText>
                      <TextInput
                        className="p-4 text-gray-800 bg-gray-50 rounded-xl border border-gray-200"
                        placeholder="Brief description of your concern"
                        placeholderTextColor="#9CA3AF"
                        value={values.subject}
                        onChangeText={handleChange('subject')}
                        onBlur={handleBlur('subject')}
                        maxLength={200}
                        editable={!isSubmitting}
                      />
                      {touched.subject && errors.subject && (
                        <ThemedText weight="regular" className="mt-1 text-sm text-red-500">
                          {errors.subject}
                        </ThemedText>
                      )}
                      <ThemedText weight="regular" className="mt-1 text-xs text-gray-500">
                        {values.subject.length}/200 characters
                      </ThemedText>
                    </View>

                    {/* Description Field */}
                    <View>
                      <ThemedText weight="medium" className="mb-2 text-gray-700">
                        Description *
                      </ThemedText>
                      <TextInput
                        className="p-4 text-gray-800 bg-gray-50 rounded-xl border border-gray-200"
                        placeholder="Please provide detailed information about your concern..."
                        placeholderTextColor="#9CA3AF"
                        value={values.description}
                        onChangeText={handleChange('description')}
                        onBlur={handleBlur('description')}
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                        maxLength={1000}
                        editable={!isSubmitting}
                      />
                      {touched.description && errors.description && (
                        <ThemedText weight="regular" className="mt-1 text-sm text-red-500">
                          {errors.description}
                        </ThemedText>
                      )}
                      <ThemedText weight="regular" className="mt-1 text-xs text-gray-500">
                        {values.description.length}/1000 characters
                      </ThemedText>
                    </View>
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    className={`p-4 mt-6 rounded-xl ${
                      isSubmitting ? 'bg-gray-300' : 'bg-blue-600'
                    }`}
                    onPress={() => handleSubmit()}
                    disabled={isSubmitting}
                  >
                    <View className="flex-row justify-center items-center">
                      {isSubmitting ? (
                        <>
                          <ActivityIndicator size="small" color="white" />
                          <ThemedText weight="medium" className="ml-2 text-white">
                            Submitting...
                          </ThemedText>
                        </>
                      ) : (
                        <>
                          <Ionicons name="send" size={20} color="white" />
                          <ThemedText weight="medium" className="ml-2 text-white">
                            Submit Concern
                          </ThemedText>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                </>
              )}
            </Formik>
          </View>

          {/* Help Text */}
          <View className="bg-[#F0F9FF] rounded-xl p-4 mb-6">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <View className="flex-1 ml-3">
                <ThemedText weight="medium" className="mb-1 text-blue-800">
                  What happens next?
                </ThemedText>
                <ThemedText weight="regular" className="text-sm text-blue-700">
                  • Your concern will be reviewed by our admin team{'\n'}
                  • You'll receive a response within 24-48 hours{'\n'}
                  • We may contact you for additional information if needed
                </ThemedText>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </ViewLayout>
  );
}
