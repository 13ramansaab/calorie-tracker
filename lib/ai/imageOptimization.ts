import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

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

    const imageDimensions = await getImageDimensions(imageUri);
    const { width, height } = imageDimensions;

    const maxDimension = Math.max(width, height);

    if (maxDimension <= MAX_IMAGE_EDGE && originalSize <= MAX_IMAGE_SIZE_BYTES * 0.8) {
      return {
        uri: imageUri,
        width,
        height,
        sizeBytes: originalSize,
        wasOptimized: false,
      };
    }

    const scaleFactor = Math.min(1, MAX_IMAGE_EDGE / maxDimension);
    const targetWidth = Math.round(width * scaleFactor);
    const targetHeight = Math.round(height * scaleFactor);

    const manipResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: targetWidth, height: targetHeight } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    const optimizedInfo = await FileSystem.getInfoAsync(manipResult.uri);
    const optimizedSize = optimizedInfo.size || 0;

    return {
      uri: manipResult.uri,
      width: targetWidth,
      height: targetHeight,
      sizeBytes: optimizedSize,
      wasOptimized: true,
      originalSize,
    };
  } catch (error) {
    console.error('Image optimization error:', error);
    throw error;
  }
}

async function getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image dimensions'));
    };
    img.src = uri;
  });
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
