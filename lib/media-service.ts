import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { supabase } from './supabase';

interface MediaUploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

interface UploadedMedia {
  url: string;
  type: 'image' | 'video';
  size: number;
  mimeType: string;
}

export const mediaService = {
  /**
   * Request camera roll permissions
   */
  async requestPermissions() {
    if (Platform.OS !== 'web') {
      const { status: mediaStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      const { status: cameraStatus } =
        await ImagePicker.requestCameraPermissionsAsync();

      if (
        mediaStatus !== 'granted' ||
        cameraStatus !== 'granted'
      ) {
        return {
          granted: false,
          reason: 'Camera or media library permission denied',
        };
      }
    }

    return { granted: true };
  },

  /**
   * Pick image from camera roll
   */
  async pickImage(): Promise<ImagePicker.ImagePickerAsset | null> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        return result.assets[0];
      }
      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      return null;
    }
  },

  /**
   * Take photo with camera
   */
  async takePhoto(): Promise<ImagePicker.ImagePickerAsset | null> {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        return result.assets[0];
      }
      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      return null;
    }
  },

  /**
   * Pick video from camera roll
   */
  async pickVideo(): Promise<ImagePicker.ImagePickerAsset | null> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Automatic,
      });

      if (!result.canceled && result.assets.length > 0) {
        return result.assets[0];
      }
      return null;
    } catch (error) {
      console.error('Error picking video:', error);
      return null;
    }
  },

  /**
   * Record video with camera
   */
  async recordVideo(): Promise<ImagePicker.ImagePickerAsset | null> {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Automatic,
      });

      if (!result.canceled && result.assets.length > 0) {
        return result.assets[0];
      }
      return null;
    } catch (error) {
      console.error('Error recording video:', error);
      return null;
    }
  },

  /**
   * Upload image to Supabase Storage
   * @param asset Image picker asset
   * @param bucketName Storage bucket name (default: 'media')
   * @param onProgress Progress callback
   * @returns Uploaded media info with public URL
   */
  async uploadImage(
    asset: ImagePicker.ImagePickerAsset,
    bucketName = 'media',
    onProgress?: (progress: MediaUploadProgress) => void
  ): Promise<UploadedMedia> {
    try {
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (asset.fileSize && asset.fileSize > maxSize) {
        throw new Error('Image size exceeds 10MB limit');
      }

      // Get file extension
      const ext = asset.uri.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const filePath = `images/${fileName}`;

      // Read file as blob
      let fileBlob: Blob;

      if (Platform.OS === 'web') {
        // Web: use fetch to get blob
        const response = await fetch(asset.uri);
        fileBlob = await response.blob();
      } else {
        // Mobile: read from file URI
        const response = await fetch(asset.uri);
        fileBlob = await response.blob();
      }

      // Upload with progress tracking
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, fileBlob, {
          contentType: asset.type || 'image/jpeg',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        type: 'image',
        size: fileBlob.size,
        mimeType: asset.type || 'image/jpeg',
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  /**
   * Upload video to Supabase Storage
   * @param asset Video picker asset
   * @param bucketName Storage bucket name (default: 'media')
   * @param onProgress Progress callback
   * @returns Uploaded media info with public URL
   */
  async uploadVideo(
    asset: ImagePicker.ImagePickerAsset,
    bucketName = 'media',
    onProgress?: (progress: MediaUploadProgress) => void
  ): Promise<UploadedMedia> {
    try {
      // Validate file size (max 500MB)
      const maxSize = 500 * 1024 * 1024;
      if (asset.fileSize && asset.fileSize > maxSize) {
        throw new Error('Video size exceeds 500MB limit');
      }

      // Get file extension
      const ext = asset.uri.split('.').pop() || 'mp4';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const filePath = `videos/${fileName}`;

      // Read file as blob
      let fileBlob: Blob;

      if (Platform.OS === 'web') {
        // Web: use fetch to get blob
        const response = await fetch(asset.uri);
        fileBlob = await response.blob();
      } else {
        // Mobile: read from file URI
        const response = await fetch(asset.uri);
        fileBlob = await response.blob();
      }

      // Upload
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, fileBlob, {
          contentType: asset.type || 'video/mp4',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        type: 'video',
        size: fileBlob.size,
        mimeType: asset.type || 'video/mp4',
      };
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  },

  /**
   * Delete media from storage
   */
  async deleteMedia(
    mediaUrl: string,
    bucketName = 'media'
  ): Promise<boolean> {
    try {
      // Extract file path from URL
      const urlParts = mediaUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const type = mediaUrl.includes('/images/') ? 'images' : 'videos';
      const filePath = `${type}/${fileName}`;

      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting media:', error);
      return false;
    }
  },

  /**
   * Get media from device storage
   * Useful for offline support or caching
   */
  async cacheMedia(
    mediaUrl: string,
    fileName: string
  ): Promise<string | null> {
    try {
      // This is a placeholder for future offline support
      // Would use expo-file-system to cache to device
      return mediaUrl;
    } catch (error) {
      console.error('Error caching media:', error);
      return null;
    }
  },

  /**
   * Validate media before upload
   */
  validateImage(asset: ImagePicker.ImagePickerAsset): {
    valid: boolean;
    error?: string;
  } {
    // Max 10MB for images
    const maxSize = 10 * 1024 * 1024;
    if (asset.fileSize && asset.fileSize > maxSize) {
      return {
        valid: false,
        error: 'Image must be smaller than 10MB',
      };
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(asset.type || '')) {
      return {
        valid: false,
        error: 'Image type must be JPEG, PNG, WebP, or GIF',
      };
    }

    return { valid: true };
  },

  validateVideo(asset: ImagePicker.ImagePickerAsset): {
    valid: boolean;
    error?: string;
  } {
    // Max 500MB for videos
    const maxSize = 500 * 1024 * 1024;
    if (asset.fileSize && asset.fileSize > maxSize) {
      return {
        valid: false,
        error: 'Video must be smaller than 500MB',
      };
    }

    // Validate type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    if (!validTypes.includes(asset.type || '')) {
      return {
        valid: false,
        error: 'Video type must be MP4, MOV, or AVI',
      };
    }

    return { valid: true };
  },
};

export type { UploadedMedia, MediaUploadProgress };
