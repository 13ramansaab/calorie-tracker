import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Camera, Image as ImageIcon, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { AIAnalysisSheet } from '@/components/AIAnalysisSheet';
import { ContextAssistBox } from '@/components/ContextAssistBox';
import { runPhotoAnalysis } from '@/lib/ai/analysisOrchestrator';

export default function LogTab() {
  const { user, profile } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [userNote, setUserNote] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [showAnalysisSheet, setShowAnalysisSheet] = useState(false);
  const [mealType, setMealType] = useState('lunch');
  const cameraRef = useRef<CameraView>(null);

  const requestCameraPermission = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to use this feature');
      return;
    }

    const { status } = await requestPermission();
    if (status === 'granted') {
      setCameraActive(true);
    } else {
      Alert.alert(
        'Permission Required',
        'Camera permission is needed to take photos of your meals'
      );
    }
  };

  const pickImage = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to use this feature');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Photo library permission is needed to select images'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCapturedImage(result.assets[0].uri);
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });

        if (photo) {
          setCapturedImage(photo.uri);
          setCameraActive(false);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to capture photo');
      }
    }
  };

  const handleAnalyzePhoto = async () => {
    if (!capturedImage || !user) return;

    setAnalyzing(true);

    try {
      const result = await runPhotoAnalysis({
        photoUri: capturedImage,
        userNote: userNote.trim() || undefined,
        mealType,
        userId: user.id,
        userRegion: profile?.region,
        dietaryPrefs: profile?.dietary_preferences,
      });

      if (result.warnings.length > 0) {
        Alert.alert('Note', result.warnings.join('\n'));
      }

      setAnalysisId(result.analysisId);
      setShowAnalysisSheet(true);
    } catch (error) {
      console.error('Analysis failed:', error);
      Alert.alert(
        'Analysis Failed',
        'Unable to analyze your meal. Would you like to log it manually?',
        [
          { text: 'Try Again', style: 'cancel' },
          {
            text: 'Log Manually',
            onPress: () => {
              handleRetake();
              Alert.alert('Coming Soon', 'Manual food search will be available soon');
            },
          },
        ]
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setUserNote('');
    setAnalysisId(null);
    setShowAnalysisSheet(false);
    if (Platform.OS !== 'web') {
      setCameraActive(true);
    }
  };

  const handleSaveFromAnalysis = () => {
    setCapturedImage(null);
    setUserNote('');
    setAnalysisId(null);
    setShowAnalysisSheet(false);
    Alert.alert('Success', 'Meal logged successfully!');
  };

  const getCurrentMealType = (): string => {
    const hour = new Date().getHours();
    if (hour < 11) return 'breakfast';
    if (hour < 15) return 'lunch';
    if (hour < 18) return 'snack';
    return 'dinner';
  };

  if (capturedImage) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleRetake}>
            <X size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Photo</Text>
          <View style={styles.closeButton} />
        </View>

        <ScrollView style={styles.reviewScroll} contentContainerStyle={styles.reviewContent}>
          <View style={styles.previewContainer}>
            <Image source={{ uri: capturedImage }} style={styles.preview} resizeMode="cover" />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Meal Type</Text>
            <View style={styles.mealTypeChips}>
              {['breakfast', 'lunch', 'snack', 'dinner'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.mealTypeChip,
                    mealType === type && styles.mealTypeChipActive,
                  ]}
                  onPress={() => setMealType(type)}
                >
                  <Text
                    style={[
                      styles.mealTypeChipText,
                      mealType === type && styles.mealTypeChipTextActive,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ContextAssistBox
              value={userNote}
              onChange={setUserNote}
              maxLength={140}
              placeholder="2 chapati + 1 bowl paneer bhurji"
            />
          </View>
        </ScrollView>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleRetake}
            disabled={analyzing}
          >
            <Text style={styles.secondaryButtonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, analyzing && styles.primaryButtonDisabled]}
            onPress={handleAnalyzePhoto}
            disabled={analyzing}
          >
            {analyzing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Analyze Meal</Text>
            )}
          </TouchableOpacity>
        </View>

        {analysisId && (
          <AIAnalysisSheet
            visible={showAnalysisSheet}
            photoUri={capturedImage}
            mealType={mealType}
            userNote={userNote}
            analysisId={analysisId}
            onClose={() => setShowAnalysisSheet(false)}
            onSave={handleSaveFromAnalysis}
          />
        )}
      </View>
    );
  }

  if (cameraActive && Platform.OS !== 'web') {
    if (!permission?.granted) {
      return (
        <View style={styles.container}>
          <View style={styles.center}>
            <Text style={styles.permissionText}>
              Camera permission is required
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={requestCameraPermission}
            >
              <Text style={styles.primaryButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
          <View style={styles.cameraHeader}>
            <TouchableOpacity
              style={styles.cameraCloseButton}
              onPress={() => setCameraActive(false)}
            >
              <X size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.cameraTitle}>Take a photo of your meal</Text>
            <View style={styles.cameraCloseButton} />
          </View>

          <View style={styles.cameraFooter}>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Log a Meal</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.iconContainer}>
            <Camera size={48} color="#10b981" />
          </View>
          <Text style={styles.heroTitle}>Snap and Track</Text>
          <Text style={styles.heroSubtitle}>
            Take a photo of your meal for instant AI-powered nutrition analysis
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {Platform.OS !== 'web' && (
            <TouchableOpacity
              style={styles.optionCard}
              onPress={requestCameraPermission}
            >
              <View style={styles.optionIconContainer}>
                <Camera size={32} color="#10b981" />
              </View>
              <Text style={styles.optionTitle}>Take Photo</Text>
              <Text style={styles.optionDescription}>
                Capture your meal with camera
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.optionCard} onPress={pickImage}>
            <View style={styles.optionIconContainer}>
              <ImageIcon size={32} color="#10b981" />
            </View>
            <Text style={styles.optionTitle}>Upload Photo</Text>
            <Text style={styles.optionDescription}>
              Choose from your photo library
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => Alert.alert('Coming Soon', 'Manual search will be implemented')}
        >
          <Text style={styles.manualButtonText}>Search Food Database</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  optionCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  optionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  manualButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  manualButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  camera: {
    flex: 1,
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  cameraCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  cameraFooter: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
  },
  reviewScroll: {
    flex: 1,
  },
  reviewContent: {
    paddingBottom: 24,
  },
  previewContainer: {
    height: 300,
    backgroundColor: '#000000',
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 24,
    marginTop: 16,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  formSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 20,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  mealTypeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealTypeChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  mealTypeChipActive: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  mealTypeChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  mealTypeChipTextActive: {
    color: '#10b981',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  permissionText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
});
