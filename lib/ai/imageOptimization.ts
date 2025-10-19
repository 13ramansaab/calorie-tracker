import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

export const MAX_IMAGE_EDGE = 1280;
export const MAX_IMAGE_SIZE_MB = 10;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

export interface ImageOptimizationResult {
  uri: string;
  width: number;
  height: number;
  sizeBytes: number;
  wasOptimized: boolean;
  originalSize?: number;
}

export async function optimizeImageForAnalysis(
  imageUri: string
): Promise<ImageOptimizationResult> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(imageUri);

    if (!fileInfo.exists) {
      throw new Error('Image file does not exist');
    }

    const originalSize = fileInfo.size || 0;

    if (originalSize > MAX_IMAGE_SIZE_BYTES) {
      throw new Error(
        `Image too large (${(originalSize / 1024 / 1024).toFixed(1)}MB). Maximum size is ${MAX_IMAGE_SIZE_MB}MB. Please compress or choose a different photo.`
      );
    }

    // If image is already small enough, return as-is
    if (originalSize <= MAX_IMAGE_SIZE_BYTES * 0.8) {
      return {
        uri: imageUri,
        width: 1920, // Default dimensions
        height: 1080,
        sizeBytes: originalSize,
        wasOptimized: false,
      };
    }

    // Optimize the image
    const manipResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: MAX_IMAGE_EDGE, height: MAX_IMAGE_EDGE } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    const optimizedInfo = await FileSystem.getInfoAsync(manipResult.uri);
    const optimizedSize = optimizedInfo.size || 0;

    return {
      uri: manipResult.uri,
      width: MAX_IMAGE_EDGE,
      height: MAX_IMAGE_EDGE,
      sizeBytes: optimizedSize,
      wasOptimized: true,
      originalSize,
    };
  } catch (error) {
    console.error('Image optimization error:', error);
    // Return the original image if optimization fails
    return {
      uri: imageUri,
      width: 1920,
      height: 1080,
      sizeBytes: 0,
      wasOptimized: false,
    };
  }
}

async function getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
  try {
    // For React Native, we'll use a default size and let ImageManipulator handle the actual dimensions
    // This is a fallback approach that works reliably across platforms
    return { width: 1920, height: 1080 }; // Default HD dimensions
  } catch (error) {
    console.warn('Could not get image dimensions, using defaults:', error);
    return { width: 1920, height: 1080 };
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export async function validateImageSize(imageUri: string): Promise<{
  isValid: boolean;
  sizeMB: number;
  error?: string;
}> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(imageUri);

    if (!fileInfo.exists) {
      return { isValid: false, sizeMB: 0, error: 'File does not exist' };
    }

    const sizeMB = (fileInfo.size || 0) / 1024 / 1024;

    if (sizeMB > MAX_IMAGE_SIZE_MB) {
      return {
        isValid: false,
        sizeMB,
        error: `Image is ${sizeMB.toFixed(1)}MB, maximum is ${MAX_IMAGE_SIZE_MB}MB`,
      };
    }

    return { isValid: true, sizeMB };
  } catch (error) {
    return {
      isValid: false,
      sizeMB: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
