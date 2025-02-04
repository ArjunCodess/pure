import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ScanResult {
  id: string;
  timestamp: number;
  imageUri: string;
  productInfo?: {
    name: string;
    brand: string;
    type: string;
  };
  harmfulIngredientsCount: number;
  allergensCount: number;
  analysisTimestamp?: number;
  analysis?: {
    productInfo: {
      type: string;
      name: string;
      brand: string;
    };
    harmfulIngredients: Array<{
      name: string;
      concern: string;
      riskLevel: 'high' | 'medium' | 'low';
    }>;
    ingredients: Array<{
      name: string;
      purpose: string;
      description: string;
      safetyInfo: string;
    }>;
    allergens: string[];
    dietary: {
      isVegan: boolean;
      isVegetarian: boolean;
      restrictions: string[];
    };
    environmentalImpact: {
      rating: 'high' | 'medium' | 'low';
      details: string;
    };
  };
}

export default function HistoryPage() {
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadScanHistory = useCallback(async () => {
    try {
      const history = await AsyncStorage.getItem('scanHistory');
      if (history) {
        const parsedHistory = JSON.parse(history);
        parsedHistory.sort((a: ScanResult, b: ScanResult) => b.timestamp - a.timestamp);
        setScanResults(parsedHistory);
      }
    } catch (err) {
      console.error('Failed to load scan history:', err);
      setError('Failed to load scan history');
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadScanHistory();
    setRefreshing(false);
  }, [loadScanHistory]);

  useEffect(() => {
    loadScanHistory();
  }, [loadScanHistory]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCardPress = (result: ScanResult) => {
    if (!result.analysis) {
      alert('Analysis is still in progress. Please try again later.');
      return;
    }

    router.push({
      pathname: '/results/[id]',
      params: {
        id: result.id,
        imageUri: result.imageUri,
        fromHistory: 'true',
      }
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Scan History',
          headerLargeTitle: true,
        }}
      />
      <SafeAreaView className="flex-1 bg-gray-50">
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {error ? (
            <View className="p-4">
              <View className="rounded-lg bg-red-50 p-4">
                <Text className="text-red-800">{error}</Text>
              </View>
            </View>
          ) : scanResults.length === 0 ? (
            <View className="flex-1 items-center justify-center p-8">
              <View className="mb-4 rounded-full bg-blue-100 p-4">
                <MaterialIcons name="history" size={40} color="#2563eb" />
              </View>
              <Text className="mb-2 text-center text-xl font-semibold text-gray-900">
                No Scan History
              </Text>
              <Text className="mb-6 text-center text-base text-gray-600">
                Start scanning products to build your history
              </Text>
              <TouchableOpacity
                className="flex-row items-center space-x-2 rounded-xl bg-blue-600 px-6 py-3"
                onPress={() => router.push('/scan')}
              >
                <MaterialIcons name="document-scanner" size={24} color="white" />
                <Text className="ml-2 font-semibold text-white">Scan a Product</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="p-4">
              {scanResults.map((result) => (
                <TouchableOpacity
                  key={result.id}
                  className="mb-4 overflow-hidden rounded-xl bg-white shadow"
                  onPress={() => handleCardPress(result)}
                >
                  <View className="border-b border-gray-100 p-4">
                    <Text className="mb-2 text-right text-sm font-medium text-blue-600">
                      {formatDate(result.timestamp)}
                    </Text>
                    
                    <View className="gap-2">
                      <Text className="flex-shrink text-lg font-semibold text-gray-900 flex-wrap">
                        {result.productInfo?.name || 'Processing...'}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        {result.productInfo?.brand || 'Analyzing product...'}
                      </Text>
                    </View>
                  </View>
                  
                  <View className="flex-row divide-x divide-gray-100">
                    <View className="flex-1 p-3">
                      <View className="flex-row items-center justify-center space-x-2">
                        <MaterialIcons 
                          name="warning" 
                          size={20} 
                          color={result.analysis ? '#f59e0b' : '#9CA3AF'} 
                        />
                        <Text className="text-sm font-medium text-gray-600">
                          {result.analysis ? `${result.harmfulIngredientsCount} Harmful` : 'Analyzing...'}
                        </Text>
                      </View>
                    </View>
                    
                    <View className="flex-1 p-3">
                      <View className="flex-row items-center justify-center space-x-2">
                        <MaterialIcons 
                          name="error-outline" 
                          size={20} 
                          color={result.analysis ? '#ef4444' : '#9CA3AF'} 
                        />
                        <Text className="text-sm font-medium text-gray-600">
                          {result.analysis ? `${result.allergensCount} Allergens` : 'Analyzing...'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
