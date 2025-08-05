import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, View, Text } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming,
  interpolate
} from 'react-native-reanimated';
import { useCallback, useEffect } from 'react';

const colors = {
  primary: {
    300: '#0D8AED',
  },
};

// Custom Tab Bar Component
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: '#EFFFFF',
      paddingBottom: 8,
      paddingTop: 8,
      height: 70,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
    }}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? options.title ?? route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <AnimatedTabItem
            key={route.key}
            label={label}
            icon={options.tabBarIcon}
            isFocused={isFocused}
            onPress={onPress}
            color={isFocused ? colors.primary[300] : '#9ca3af'}
          />
        );
      })}
    </View>
  );
};

// Animated Tab Item Component
const AnimatedTabItem = ({ 
  label, 
  icon, 
  isFocused, 
  onPress, 
  color 
}: { 
  label: string; 
  icon: any; 
  isFocused: boolean; 
  onPress: () => void; 
  color: string;
}) => {
  const iconScale = useSharedValue(1);
  const titleOpacity = useSharedValue(1);
  const titleScale = useSharedValue(1);
  const containerHeight = useSharedValue(1);

  useEffect(() => {
    if (isFocused) {
      iconScale.value = withSpring(1.6, { damping: 15, stiffness: 150 });
      titleOpacity.value = withTiming(0, { duration: 200 });
      titleScale.value = withSpring(0.8, { damping: 15, stiffness: 150 });
      containerHeight.value = withSpring(1.2, { damping: 15, stiffness: 150 });
    } else {
      iconScale.value = withSpring(1, { damping: 15, stiffness: 150 });
      titleOpacity.value = withTiming(1, { duration: 200 });
      titleScale.value = withSpring(1, { damping: 15, stiffness: 150 });
      containerHeight.value = withSpring(1, { damping: 15, stiffness: 150 });
    }
  }, [isFocused]);

  const iconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: iconScale.value }],
    };
  });

  const titleStyle = useAnimatedStyle(() => {
    return {
      opacity: titleOpacity.value,
      transform: [{ scale: titleScale.value }],
    };
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scaleY: containerHeight.value }],
    };
  });

  const handlePressIn = useCallback(() => {
    iconScale.value = withSpring(0.9, { damping: 15, stiffness: 150 });
  }, []);

  const handlePressOut = useCallback(() => {
    iconScale.value = withSpring(isFocused ? 1.6 : 1, { damping: 15, stiffness: 150 });
  }, [isFocused]);

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <Animated.View style={[{
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
      }, containerStyle]}>
        <Animated.View style={iconStyle}>
          {icon({ color, size: 28, focused: isFocused })}
        </Animated.View>
        <Animated.View style={titleStyle}>
          <Text style={{
            fontSize: 10,
            fontWeight: '500',
            color: color,
            textAlign: 'center',
          }}>
            {label}
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[300],
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#EFFFFF',
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
        tabBarItemStyle: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          gap: 10,
        },
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="shopping-cart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          )
        }}
      />
    </Tabs>
  );
} 