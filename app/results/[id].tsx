import { Stack, useLocalSearchParams } from 'expo-router';
import { View, Image, StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState, useRef } from 'react';
import Constants from 'expo-constants';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProcessingToast from '../../components/ProcessingToast';

interface ProductAnalysis {
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
}

export default function ResultsPage() {
  const { imageUri, base64, id, fromHistory } = useLocalSearchParams();
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [isProcessingText, setIsProcessingText] = useState(false);
  const [productAnalysis, setProductAnalysis] = useState<ProductAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const hasAttemptedUpload = useRef(false);
  const [imageKey, setImageKey] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  useEffect(() => {
    async function loadFromHistory() {
      if (fromHistory === 'true' && id) {
        try {
          const history = await AsyncStorage.getItem('scanHistory');
          if (history) {
            const historyData = JSON.parse(history);
            const result = historyData.find((item: any) => item.id === id);
            if (result?.analysis) {
              setProductAnalysis(result.analysis);
              if (result.imageUri) {
                setUploadedUrl(result.imageUri);
              }
            }
          }
        } catch (err) {
          console.error('Failed to load from history:', err);
          setError('Failed to load saved analysis');
        }
      }
    }

    loadFromHistory();
  }, [fromHistory, id]);

  useEffect(() => {
    async function uploadImage() {
      if (fromHistory === 'true' || hasAttemptedUpload.current || !imageUri || uploadedUrl) return;
      
      setIsUploading(true);
      setToastMessage('Uploading image...');
      setError(null);

      try {
        const manifestUrl = Constants.manifest2?.extra?.expoClient?.hostUri;
        if (!manifestUrl) {
          throw new Error('Development server URL not found');
        }

        const apiUrl = `http://${manifestUrl}/api/upload`;
        console.log('Uploading to:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ 
            imageUri: imageUri.toString(),
            base64: base64?.toString() 
          }),
        });

        const responseText = await response.text();
        console.log('Response text:', responseText);

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse JSON:', e);
          throw new Error('Invalid response from server');
        }

        if (data.secure_url || data.url) {
          const finalUrl = data.secure_url || data.url;
          console.log('Setting URL:', finalUrl);
          setUploadedUrl(finalUrl);
          setError(null);
          hasAttemptedUpload.current = true;
          
          setToastMessage('Extracting text from image...');
          await extractText(finalUrl);
        } else if (data.error) {
          throw new Error(data.error);
        } else {
          throw new Error('No URL received from server');
        }
      } catch (error: any) {
        console.error('Upload error details:', error);
        if (!uploadedUrl) {
          setError(error?.message || 'Failed to upload image');
          hasAttemptedUpload.current = false;
        }
      } finally {
        setIsUploading(false);
        setToastMessage('');
      }
    }

    if (fromHistory !== 'true') {
      uploadImage();
    }
  }, [imageUri, base64, fromHistory]);

  const reloadImage = () => {
    setImageKey(prev => prev + 1);
    setImageError(false);
  };

  const saveToHistory = async (analysis: ProductAnalysis) => {
    try {
      const existingHistory = await AsyncStorage.getItem('scanHistory');
      let history = existingHistory ? JSON.parse(existingHistory) : [];

      history = history.map((item: any) => {
        if (item.id === id) {
          return {
            ...item,
            productInfo: analysis.productInfo,
            harmfulIngredientsCount: analysis.harmfulIngredients.length,
            allergensCount: analysis.allergens.length,
            analysisTimestamp: Date.now(),
            analysis: analysis,
          };
        }
        return item;
      });

      await AsyncStorage.setItem('scanHistory', JSON.stringify(history));
    } catch (err) {
      console.error('Failed to save to history:', err);
    }
  };

  const analyzeProduct = async (text: string) => {
    try {
      setIsAnalyzing(true);
      setToastMessage('Analyzing ingredients...');
      setError(null);

      const manifestUrl = Constants.manifest2?.extra?.expoClient?.hostUri;
      if (!manifestUrl) {
        throw new Error('Development server URL not found');
      }

      const apiUrl = `http://${manifestUrl}/api/analyze-product`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ extractedText: text }),
      });

      const data = await response.json();

      if (data.success && data.analysis) {
        setProductAnalysis(data.analysis);
        await saveToHistory(data.analysis);
      } else {
        throw new Error(data.error || 'Failed to analyze product');
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze product');
    } finally {
      setIsAnalyzing(false);
      setToastMessage('');
    }
  };

  const extractText = async (imageUrl: string) => {
    try {
      setIsProcessingText(true);
      setError(null);

      const manifestUrl = Constants.manifest2?.extra?.expoClient?.hostUri;
      if (!manifestUrl) {
        throw new Error('Development server URL not found');
      }

      const apiUrl = `http://${manifestUrl}/api/extract-text`;
      console.log('Extracting text from:', imageUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      const data = await response.json();

      if (data.success && data.text) {
        console.log('Extracted text:', data.text);
        setExtractedText(data.text);
        await analyzeProduct(data.text);
      } else {
        throw new Error(data.error || 'No text found in image');
      }
    } catch (err) {
      console.error('Text extraction error:', err);
      setError('Failed to extract text from image');
    } finally {
      setIsProcessingText(false);
    }
  };

  const retryAnalysis = async () => {
    if (!extractedText) {
      setError('No text available to analyze');
      return;
    }
    await analyzeProduct(extractedText);
  };

  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return '#FF4444';
      case 'medium':
        return '#FFBB33';
      case 'low':
        return '#00C851';
      default:
        return '#666666';
    }
  };

  if (!imageUri) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.noImageText}>No image found</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Scan Results',
          headerLargeTitle: true
        }} 
      />
      <ProcessingToast 
        message={toastMessage} 
        isVisible={Boolean(toastMessage)}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <View style={styles.imageContainer}>
              <Image
                key={imageKey}
                source={{ uri: uploadedUrl || imageUri as string }}
                style={styles.image}
                onError={(e) => {
                  console.log('Image load error:', e.nativeEvent.error);
                  setImageError(true);
                }}
              />
              {imageError && (
                <TouchableOpacity style={styles.reloadButton} onPress={reloadImage}>
                  <MaterialIcons name="refresh" size={24} color="#fff" />
                  <Text style={styles.reloadText}>Reload Image</Text>
                </TouchableOpacity>
              )}
            </View>

            {(isUploading || isProcessingText || isAnalyzing) && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>
                  {isUploading ? 'Uploading image...' :
                   isProcessingText ? 'Extracting text...' :
                   'Analyzing product...'}
                </Text>
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <View style={styles.errorContent}>
                  <MaterialIcons name="error" size={24} color="#FF4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
                {error.includes('parse product analysis') && (
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={retryAnalysis}
                  >
                    <MaterialIcons name="refresh" size={20} color="#fff" />
                    <Text style={styles.retryText}>Retry Analysis</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {productAnalysis && (
              <View style={styles.analysisContainer}>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Product Information</Text>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{productAnalysis.productInfo.name}</Text>
                    <Text style={styles.productBrand}>{productAnalysis.productInfo.brand}</Text>
                    <Text style={styles.productType}>{productAnalysis.productInfo.type}</Text>
                  </View>
                </View>

                {productAnalysis.harmfulIngredients.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Harmful Ingredients</Text>
                    {productAnalysis.harmfulIngredients.map((ingredient, index) => (
                      <View key={index} style={styles.harmfulIngredient}>
                        <View style={styles.ingredientHeader}>
                          <Text style={styles.ingredientName}>{ingredient.name}</Text>
                          <View style={[styles.riskBadge, { backgroundColor: getRiskLevelColor(ingredient.riskLevel) }]}>
                            <Text style={styles.riskText}>{ingredient.riskLevel}</Text>
                          </View>
                        </View>
                        <Text style={styles.ingredientConcern}>{ingredient.concern}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Dietary Information</Text>
                  <View style={styles.dietaryInfo}>
                    <View style={styles.dietaryBadge}>
                      <MaterialIcons 
                        name={productAnalysis.dietary.isVegan ? 'check-circle' : 'cancel'} 
                        size={20} 
                        color={productAnalysis.dietary.isVegan ? '#00C851' : '#FF4444'} 
                      />
                      <Text style={styles.dietaryText}>Vegan</Text>
                    </View>
                    <View style={styles.dietaryBadge}>
                      <MaterialIcons 
                        name={productAnalysis.dietary.isVegetarian ? 'check-circle' : 'cancel'} 
                        size={20} 
                        color={productAnalysis.dietary.isVegetarian ? '#00C851' : '#FF4444'} 
                      />
                      <Text style={styles.dietaryText}>Vegetarian</Text>
                    </View>
                  </View>
                  {productAnalysis.dietary.restrictions.length > 0 && (
                    <View style={styles.restrictions}>
                      <Text style={styles.restrictionsTitle}>Restrictions:</Text>
                      {productAnalysis.dietary.restrictions.map((restriction, index) => (
                        <Text key={index} style={styles.restriction}>• {restriction}</Text>
                      ))}
                    </View>
                  )}
                </View>

                {productAnalysis.allergens.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Allergens</Text>
                    <View style={styles.allergensList}>
                      {productAnalysis.allergens.map((allergen, index) => (
                        <View key={index} style={styles.allergenBadge}>
                          <MaterialIcons name="warning" size={16} color="#FFBB33" />
                          <Text style={styles.allergenText}>{allergen}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Environmental Impact</Text>
                  <View style={[styles.impactBadge, { backgroundColor: getRiskLevelColor(productAnalysis.environmentalImpact.rating) }]}>
                    <Text style={styles.impactRating}>{productAnalysis.environmentalImpact.rating.toUpperCase()} IMPACT</Text>
                  </View>
                  <Text style={styles.impactDetails}>{productAnalysis.environmentalImpact.details}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Ingredients Analysis</Text>
                  {productAnalysis.ingredients.map((ingredient, index) => (
                    <View key={index} style={styles.ingredientDetail}>
                      <Text style={styles.ingredientName}>{ingredient.name}</Text>
                      <Text style={styles.ingredientPurpose}>{ingredient.purpose}</Text>
                      <Text style={styles.ingredientDescription}>{ingredient.description}</Text>
                      <Text style={styles.safetyInfo}>{ingredient.safetyInfo}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  reloadButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -80 }, { translateY: -25 }],
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  reloadText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4A5568',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#FFF5F5',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 15,
    flex: 1,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#3182CE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  retryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  analysisContainer: {
    gap: 24,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  productInfo: {
    gap: 12,
  },
  productName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A202C',
    letterSpacing: 0.5,
  },
  productBrand: {
    fontSize: 18,
    color: '#4A5568',
    letterSpacing: 0.3,
  },
  productType: {
    fontSize: 16,
    color: '#718096',
    letterSpacing: 0.3,
  },
  harmfulIngredient: {
    marginBottom: 20,
    backgroundColor: '#FAFAFA',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ingredientName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2D3748',
    flex: 1,
    marginRight: 12,
  },
  riskBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  riskText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ingredientConcern: {
    fontSize: 15,
    color: '#4A5568',
    lineHeight: 22,
  },
  dietaryInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  dietaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F7FAFC',
    padding: 12,
    borderRadius: 12,
    minWidth: 120,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  dietaryText: {
    fontSize: 15,
    color: '#2D3748',
    fontWeight: '500',
  },
  restrictions: {
    gap: 10,
    backgroundColor: '#F7FAFC',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  restrictionsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  restriction: {
    fontSize: 15,
    color: '#4A5568',
    lineHeight: 22,
  },
  allergensList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  allergenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFAF0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FEEBC8',
  },
  allergenText: {
    fontSize: 14,
    color: '#C05621',
    fontWeight: '500',
  },
  impactBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  impactRating: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  impactDetails: {
    fontSize: 15,
    color: '#4A5568',
    lineHeight: 24,
  },
  ingredientDetail: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  ingredientPurpose: {
    fontSize: 15,
    color: '#4A5568',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  ingredientDescription: {
    fontSize: 15,
    color: '#2D3748',
    lineHeight: 24,
  },
  safetyInfo: {
    fontSize: 15,
    color: '#4A5568',
    lineHeight: 24,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  noImageText: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  }
}); 