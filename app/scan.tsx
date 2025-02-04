import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import ProcessingToast from '../components/ProcessingToast';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ScanPage() {
  const [image, setImage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  const saveToHistory = async (imageUri: string) => {
    try {
      const timestamp = Date.now();
      const scanId = timestamp.toString();
      
      const historyItem = {
        id: scanId,
        imageUri,
        timestamp,
        productInfo: {
          name: 'Processing...',
          brand: 'Processing...',
          type: 'Processing...'
        },
        harmfulIngredientsCount: 0,
        allergensCount: 0
      };

      const existingHistory = await AsyncStorage.getItem('scanHistory');
      const history = existingHistory ? JSON.parse(existingHistory) : [];

      const updatedHistory = [historyItem, ...history];

      await AsyncStorage.setItem('scanHistory', JSON.stringify(updatedHistory));

      return scanId;
    } catch (error) {
      console.error('Error saving to history:', error);
      throw error;
    }
  };

  const pickImage = async () => {
    try {
      setToastMessage('Opening gallery...');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        setToastMessage('Processing image...');
        
        const scanId = await saveToHistory(result.assets[0].uri);
        
        router.push({
          pathname: '/results/[id]',
          params: {
            imageUri: result.assets[0].uri,
            base64: result.assets[0].base64,
            id: scanId,
          },
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to pick image. Please try again.');
    } finally {
      setToastMessage('');
    }
  };

  const takePhoto = async () => {
    try {
      setToastMessage('Opening camera...');
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        alert('Sorry, we need camera permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        setToastMessage('Processing image...');
        
        const scanId = await saveToHistory(result.assets[0].uri);
        
        router.push({
          pathname: '/results/[id]',
          params: {
            imageUri: result.assets[0].uri,
            base64: result.assets[0].base64,
            id: scanId,
          },
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      alert('Failed to take photo. Please try again.');
    } finally {
      setToastMessage('');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Scan',
          headerLargeTitle: true,
        }}
      />
      <ProcessingToast 
        message={toastMessage} 
        isVisible={Boolean(toastMessage)}
      />
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-8 items-center">
            <View className="mb-4 rounded-full bg-blue-100 p-6">
              <MaterialIcons name="document-scanner" size={48} color="#2563eb" />
            </View>
            <Text className="text-center text-2xl font-bold text-gray-900">
              Scan Your Product
            </Text>
            <Text className="mt-2 text-center text-base text-gray-600">
              Take a clear photo of the product label or choose from your gallery
            </Text>
          </View>

          <View className="w-full gap-4">
            <TouchableOpacity
              className="flex-row items-center justify-center space-x-3 rounded-2xl bg-blue-600 px-6 py-4 shadow-lg shadow-blue-200"
              onPress={takePhoto}
            >
              <MaterialIcons name="camera-alt" size={24} color="white" />
              <Text className="ml-2 text-lg font-semibold text-white">Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-center space-x-3 rounded-2xl border-2 border-blue-200 bg-white px-6 py-4"
              onPress={pickImage}
            >
              <MaterialIcons name="photo-library" size={24} color="#2563eb" />
              <Text className="ml-2 text-lg font-semibold text-blue-600">
                Choose from Gallery
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="mt-8 text-center text-sm text-gray-500">
            For best results, ensure the ingredients list is clearly visible
          </Text>
        </View>
      </SafeAreaView>
    </>
  );
}
