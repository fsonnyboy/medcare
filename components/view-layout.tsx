import { ReactNode } from 'react';
import { Dimensions, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <View className="flex-1 bg-[#FDFDFD]">{children}</View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingBottom: isSmallScreen ? 100 : 80,
                }}
                className="bg-[#FDFDFD]"
                refreshControl={refreshControl}>
                {children}
            </ScrollView>
        </SafeAreaView>
    );
};
