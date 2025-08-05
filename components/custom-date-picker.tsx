import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from './themed-text';

interface CustomDatePickerProps {
    value: string;
    onDateChange: (date: string) => void;
    placeholder?: string;
    error?: string;
    touched?: boolean;
    disabled?: boolean;
    maximumDate?: Date;
    minimumDate?: Date;
}

export default function CustomDatePicker({
    value,
    onDateChange,
    placeholder = 'Select date',
    error,
    touched,
    disabled = false,
    maximumDate = new Date(),
    minimumDate = new Date(1900, 0, 1)
}: CustomDatePickerProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(
        value ? new Date(value) : null
    );

    const showPicker = () => {
        if (!disabled) {
            setIsVisible(true);
        }
    };

    const hidePicker = () => {
        setIsVisible(false);
    };

    const handleConfirm = () => {
        if (selectedDate) {
            const formattedDate = selectedDate.toISOString().split('T')[0];
            onDateChange(formattedDate);
        }
        hidePicker();
    };

    const formatDateForDisplay = (dateString: string) => {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    };

    const getCurrentYear = () => new Date().getFullYear();
    const getCurrentMonth = () => new Date().getMonth();
    const getCurrentDay = () => new Date().getDate();

    const generateYears = () => {
        const currentYear = getCurrentYear();
        const minYear = minimumDate.getFullYear();
        const maxYear = maximumDate.getFullYear();
        const years = [];
        
        for (let year = maxYear; year >= minYear; year--) {
            years.push(year);
        }
        return years;
    };

    const generateMonths = () => {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months;
    };

    const generateDays = (year: number, month: number) => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }
        return days;
    };

    const [selectedYear, setSelectedYear] = useState(
        selectedDate ? selectedDate.getFullYear() : getCurrentYear()
    );
    const [selectedMonth, setSelectedMonth] = useState(
        selectedDate ? selectedDate.getMonth() : getCurrentMonth()
    );
    const [selectedDay, setSelectedDay] = useState(
        selectedDate ? selectedDate.getDate() : getCurrentDay()
    );

    const years = generateYears();
    const months = generateMonths();
    const days = generateDays(selectedYear, selectedMonth);

    const handleYearChange = (year: number) => {
        setSelectedYear(year);
        const newDate = new Date(year, selectedMonth, selectedDay);
        if (newDate >= minimumDate && newDate <= maximumDate) {
            setSelectedDate(newDate);
        }
    };

    const handleMonthChange = (month: number) => {
        setSelectedMonth(month);
        const newDate = new Date(selectedYear, month, selectedDay);
        if (newDate >= minimumDate && newDate <= maximumDate) {
            setSelectedDate(newDate);
        }
    };

    const handleDayChange = (day: number) => {
        setSelectedDay(day);
        const newDate = new Date(selectedYear, selectedMonth, day);
        if (newDate >= minimumDate && newDate <= maximumDate) {
            setSelectedDate(newDate);
        }
    };

    return (
        <>
            <TouchableOpacity 
                className={`flex-row items-center px-4 py-3 bg-gray-50 rounded-xl border ${
                    error && touched ? 'border-red-500' : 'border-gray-200'
                } ${disabled ? 'opacity-50' : ''}`}
                onPress={showPicker}
                disabled={disabled}
            >
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <Text className={`flex-1 ml-3 ${
                    value ? 'text-gray-800' : 'text-gray-400'
                }`}>
                    {value ? formatDateForDisplay(value) : placeholder}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#6B7280" />
            </TouchableOpacity>

            {error && touched && (
                <ThemedText weight="regular" className="mt-1 text-sm text-red-500">
                    {error}
                </ThemedText>
            )}

            <Modal
                visible={isVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={hidePicker}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl p-6 max-h-[70%]">
                        {/* Header */}
                        <View className="flex-row justify-between items-center mb-6">
                            <ThemedText weight="bold" className="text-xl text-gray-800">
                                Select Date
                            </ThemedText>
                            <TouchableOpacity onPress={hidePicker}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {/* Date Selection */}
                        <View className="flex-row mb-6 space-x-4">
                            {/* Month */}
                            <View className="flex-1">
                                <ThemedText weight="medium" className="mb-2 text-gray-700">
                                    Month
                                </ThemedText>
                                <ScrollView 
                                    className="h-32"
                                    showsVerticalScrollIndicator={false}
                                >
                                    {months.map((month, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            className={`py-2 px-3 rounded-lg mb-1 ${
                                                selectedMonth === index ? 'bg-blue-100' : 'bg-gray-50'
                                            }`}
                                            onPress={() => handleMonthChange(index)}
                                        >
                                            <Text className={`text-center ${
                                                selectedMonth === index ? 'text-blue-600 font-medium' : 'text-gray-700'
                                            }`}>
                                                {month}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Day */}
                            <View className="flex-1">
                                <ThemedText weight="medium" className="mb-2 text-gray-700">
                                    Day
                                </ThemedText>
                                <ScrollView 
                                    className="h-32"
                                    showsVerticalScrollIndicator={false}
                                >
                                    {days.map((day) => (
                                        <TouchableOpacity
                                            key={day}
                                            className={`py-2 px-3 rounded-lg mb-1 ${
                                                selectedDay === day ? 'bg-blue-100' : 'bg-gray-50'
                                            }`}
                                            onPress={() => handleDayChange(day)}
                                        >
                                            <Text className={`text-center ${
                                                selectedDay === day ? 'text-blue-600 font-medium' : 'text-gray-700'
                                            }`}>
                                                {day}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Year */}
                            <View className="flex-1">
                                <ThemedText weight="medium" className="mb-2 text-gray-700">
                                    Year
                                </ThemedText>
                                <ScrollView 
                                    className="h-32"
                                    showsVerticalScrollIndicator={false}
                                >
                                    {years.map((year) => (
                                        <TouchableOpacity
                                            key={year}
                                            className={`py-2 px-3 rounded-lg mb-1 ${
                                                selectedYear === year ? 'bg-blue-100' : 'bg-gray-50'
                                            }`}
                                            onPress={() => handleYearChange(year)}
                                        >
                                            <Text className={`text-center ${
                                                selectedYear === year ? 'text-blue-600 font-medium' : 'text-gray-700'
                                            }`}>
                                                {year}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>

                        {/* Selected Date Preview */}
                        {selectedDate && (
                            <View className="p-4 mb-6 bg-blue-50 rounded-xl">
                                <ThemedText weight="medium" className="text-center text-blue-800">
                                    Selected: {formatDateForDisplay(selectedDate.toISOString().split('T')[0])}
                                </ThemedText>
                            </View>
                        )}

                        {/* Action Buttons */}
                        <View className="flex-row space-x-3">
                            <TouchableOpacity
                                className="flex-1 px-4 py-3 bg-gray-200 rounded-xl"
                                onPress={hidePicker}
                            >
                                <ThemedText weight="medium" className="text-center text-gray-700">
                                    Cancel
                                </ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 px-4 py-3 bg-blue-500 rounded-xl"
                                onPress={handleConfirm}
                            >
                                <ThemedText weight="medium" className="text-center text-white">
                                    Confirm
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
} 