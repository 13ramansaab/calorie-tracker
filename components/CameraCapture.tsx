import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Camera, FlipHorizontal, X, Check, ImageIcon, MessageSquare } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

interface CameraCaptureProps {
  onPhotoCapture: (uri: string, context?: CaptureContext) => void;
  onCancel: () => void;
}

interface CaptureContext {
  userNote?: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

const CONTEXT_EXAMPLES = [
  '2 chapatis with dal',
  '3 idlis with sambar',
  'Small bowl of rice',
  'Lunch thali',
  '1 dosa with chutney',
];

export function CameraCapture({ onPhotoCapture, onCancel }: CameraCaptureProps) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showContextInput, setShowContextInput] = useState(false);
  const [userNote, setUserNote] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Camera size={64} color="#9ca3af" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to analyze your meals
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (photo?.uri) {
        setCapturedPhoto(photo.uri);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGalleryPick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleConfirm = () => {
    if (capturedPhoto) {
      const context: CaptureContext = {
        userNote: userNote.trim() || undefined,
        mealType: selectedMealType,
      };
      onPhotoCapture(capturedPhoto, context);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const toggleFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  if (capturedPhoto) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.previewContainer} contentContainerStyle={styles.previewContent}>
          <Image source={{ uri: capturedPhoto }} style={styles.previewImage} />

          <View style={styles.contextSection}>
            <View style={styles.contextHeader}>
              <MessageSquare size={20} color="#10b981" />
              <Text style={styles.contextTitle}>Add Context (Optional)</Text>
            </View>
            <Text style={styles.contextHint}>Help us identify portions & items more accurately</Text>

            <View style={styles.mealTypeSelector}>
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.mealTypeChip,
                    selectedMealType === type && styles.mealTypeChipActive,
                  ]}
                  onPress={() => setSelectedMealType(type)}
                >
                  <Text
                    style={[
                      styles.mealTypeText,
                      selectedMealType === type && styles.mealTypeTextActive,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.contextInput}
              placeholder="e.g., 2 chapatis with dal, 3 idlis"
              placeholderTextColor="#9ca3af"
              value={userNote}
              onChangeText={setUserNote}
              multiline
              numberOfLines={2}
              maxLength={150}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.examplesScroll}>
              {CONTEXT_EXAMPLES.map((example, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.exampleChip}
                  onPress={() => setUserNote(example)}
                >
                  <Text style={styles.exampleText}>{example}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </ScrollView>

        <View style={styles.previewControls}>
          <TouchableOpacity style={styles.previewButton} onPress={handleRetake}>
            <X size={24} color="#ffffff" />
            <Text style={styles.previewButtonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.previewButton, styles.confirmButton]}
            onPress={handleConfirm}
          >
            <Check size={24} color="#ffffff" />
            <Text style={styles.previewButtonText}>Analyze</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
            <X size={28} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View style={styles.overlay}>
          <View style={styles.frameGuide} />
          <Text style={styles.guideText}>Position food in frame</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.galleryButton} onPress={handleGalleryPick}>
            <ImageIcon size={28} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}
            disabled={isProcessing}
          >
            <View style={styles.captureButtonInner}>
              {isProcessing && <ActivityIndicator size="large" color="#10b981" />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.flipButton} onPress={toggleFacing}>
            <FlipHorizontal size={28} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 8,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  camera: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  frameGuide: {
    width: 300,
    height: 300,
    borderWidth: 3,
    borderColor: '#10b981',
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  guideText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  galleryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  previewContent: {
    paddingBottom: 140,
  },
  previewImage: {
    width: '100%',
    height: 400,
    resizeMode: 'cover',
  },
  contextSection: {
    padding: 20,
    gap: 12,
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contextTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  contextHint: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  mealTypeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
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
  mealTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  mealTypeTextActive: {
    color: '#059669',
  },
  contextInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1f2937',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  examplesScroll: {
    marginTop: 4,
  },
  exampleChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  exampleText: {
    fontSize: 13,
    color: '#6b7280',
  },
  previewControls: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 40,
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  confirmButton: {
    backgroundColor: '#10b981',
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
