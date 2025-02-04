import { Stack, Link } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

export default function HomePage() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'PURE',
          headerLargeTitle: true,
        }}
      />
      <SafeAreaView className="flex-1 bg-white">
        <View className="bg-gradient-to-b from-blue-50 to-white px-6 pb-12 pt-8">
          <View className="mb-8 items-center">
            <Text className="text-4xl font-bold tracking-tight text-blue-950">PURE</Text>
            <Text className="text-lg font-medium tracking-tight text-blue-600">
              Product Understanding
            </Text>
            <Text className="text-lg font-medium tracking-tight text-blue-600">
              & Review Engine
            </Text>
          </View>

          <View className="mb-8 items-center">
            <View className="h-56 w-56 items-center justify-center rounded-full bg-blue-100">
              <MaterialIcons name="analytics" size={120} color="#2563eb" />
            </View>
          </View>

          <Text className="mb-4 text-center text-2xl font-bold tracking-tight text-gray-800">
            What's in This Product?
          </Text>

          <Text className="mb-8 text-center text-base leading-relaxed text-gray-600">
            Instantly scan and analyze ingredients in your food and personal care products. Make
            informed decisions about what you consume and use.
          </Text>

          <View className="flex-col items-center justify-center gap-y-4">
            <Link href="/scan" asChild>
              <TouchableOpacity className="w-full flex-row items-center justify-center space-x-2 rounded-2xl bg-blue-600 px-6 py-4 shadow-lg shadow-blue-200">
                <MaterialIcons name="document-scanner" size={24} color="white" />
                <Text className="ml-2 text-lg font-semibold text-white">Start Scanning</Text>
              </TouchableOpacity>
            </Link>

            <Link href="/history" asChild>
              <TouchableOpacity className="w-full flex-row items-center justify-center space-x-2 rounded-2xl border-2 border-blue-200 bg-white px-6 py-4">
                <MaterialIcons name="history" size={24} color="#2563eb" />
                <Text className="ml-2 text-lg font-semibold text-blue-600">View History</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}
