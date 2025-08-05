import React, { ReactNode } from 'react';
import { Dimensions, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
    children: ReactNode | undefined;
    scrollEnabled?: boolean;
    refreshControl?: React.ReactElement<any, any>;
}

const windowWidth = Dimensions.get('window').width;
const isSmallScreen = windowWidth < 380;

export const ViewLayout = ({ children, scrollEnabled = true, refreshControl }: Props) => {
    if (!scrollEnabled) {
        return (
            <LinearGradient
                colors={['#51cfdf', '#0959b2']}
                style={{ flex: 1 }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                    <View style={{ flex: 1, backgroundColor: 'transparent' }}>{children}</View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={['#51cfdf', '#0959b2']}
            style={{ flex: 1 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
        >
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingBottom: isSmallScreen ? 100 : 80,
                    }}
                    style={{ backgroundColor: 'transparent' }}
                    refreshControl={refreshControl}>
                    {children}
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};
