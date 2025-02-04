import { View, Text, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { MaterialIcons } from '@expo/vector-icons';

interface ProcessingToastProps {
  message: string;
  isVisible: boolean;
}

export default function ProcessingToast({ message, isVisible }: ProcessingToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    } else {
      Animated.spring(translateY, {
        toValue: -100,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    }
  }, [isVisible]);

  return (
    <Animated.View
      className="absolute left-4 right-4 top-2 z-50 overflow-hidden rounded-xl bg-blue-600 shadow-lg"
      style={{
        transform: [{ translateY }],
      }}
    >
      <View className="flex-row items-center justify-between p-4">
        <View className="flex-row items-center space-x-3">
          <MaterialIcons name="sync" size={24} color="white" className="animate-spin" />
          <Text className="text-base font-medium text-white">{message}</Text>
        </View>
      </View>
    </Animated.View>
  );
} 