import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Camera, Image as ImageIcon, Video, X } from 'lucide-react-native';
import { mediaService } from '@/lib/media-service';

interface MediaPickerProps {
  onMediaSelected: (mediaUrl: string, type: 'image' | 'video') => void;
  onError: (error: string) => void;
  mediaTypes?: ('image' | 'video')[];
  label?: string;
}

export const MediaPicker: React.FC<MediaPickerProps> = ({
  onMediaSelected,
  onError,
  mediaTypes = ['image', 'video'],
  label = 'Add Media',
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

  const handlePermissions = async () => {
    const result = await mediaService.requestPermissions();
    if (!result.granted) {
      onError('Camera and media permissions are required');
      return false;
    }
    return true;
  };

  const handlePickImage = async () => {
    try {
      setUploading(true);
      const hasPermission = await handlePermissions();
      if (!hasPermission) return;

      const asset = await mediaService.pickImage();
      if (!asset) {
        setUploading(false);
        return;
      }

      const validation = mediaService.validateImage(asset);
      if (!validation.valid) {
        onError(validation.error || 'Invalid image');
        setUploading(false);
        return;
      }

      const uploaded = await mediaService.uploadImage(asset);
      setPreview({ url: uploaded.url, type: 'image' });
      onMediaSelected(uploaded.url, 'image');
      setModalVisible(false);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      setUploading(true);
      const hasPermission = await handlePermissions();
      if (!hasPermission) return;

      const asset = await mediaService.takePhoto();
      if (!asset) {
        setUploading(false);
        return;
      }

      const validation = mediaService.validateImage(asset);
      if (!validation.valid) {
        onError(validation.error || 'Invalid image');
        setUploading(false);
        return;
      }

      const uploaded = await mediaService.uploadImage(asset);
      setPreview({ url: uploaded.url, type: 'image' });
      onMediaSelected(uploaded.url, 'image');
      setModalVisible(false);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to capture photo');
    } finally {
      setUploading(false);
    }
  };

  const handlePickVideo = async () => {
    try {
      setUploading(true);
      const hasPermission = await handlePermissions();
      if (!hasPermission) return;

      const asset = await mediaService.pickVideo();
      if (!asset) {
        setUploading(false);
        return;
      }

      const validation = mediaService.validateVideo(asset);
      if (!validation.valid) {
        onError(validation.error || 'Invalid video');
        setUploading(false);
        return;
      }

      const uploaded = await mediaService.uploadVideo(asset);
      setPreview({ url: uploaded.url, type: 'video' });
      onMediaSelected(uploaded.url, 'video');
      setModalVisible(false);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  const handleRecordVideo = async () => {
    try {
      setUploading(true);
      const hasPermission = await handlePermissions();
      if (!hasPermission) return;

      const asset = await mediaService.recordVideo();
      if (!asset) {
        setUploading(false);
        return;
      }

      const validation = mediaService.validateVideo(asset);
      if (!validation.valid) {
        onError(validation.error || 'Invalid video');
        setUploading(false);
        return;
      }

      const uploaded = await mediaService.uploadVideo(asset);
      setPreview({ url: uploaded.url, type: 'video' });
      onMediaSelected(uploaded.url, 'video');
      setModalVisible(false);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to record video');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.mainButton}
        onPress={() => setModalVisible(true)}
        disabled={uploading}
      >
        <ImageIcon size={20} color="#fff" />
        <Text style={styles.mainButtonText}>{label}</Text>
      </TouchableOpacity>

      {preview && (
        <View style={styles.previewContainer}>
          {preview.type === 'image' ? (
            <Image
              source={{ uri: preview.url }}
              style={styles.preview}
            />
          ) : (
            <View style={styles.videoPreview}>
              <Video size={48} color="#fff" />
              <Text style={styles.videoLabel}>Video Added</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => {
              setPreview(null);
              onMediaSelected('', preview.type);
            }}
          >
            <X size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Media</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                disabled={uploading}
              >
                <X size={24} color="#1a1a1a" />
              </TouchableOpacity>
            </View>

            {uploading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#15803d" />
                <Text style={styles.loadingText}>Uploading...</Text>
              </View>
            )}

            {!uploading && (
              <View style={styles.optionsContainer}>
                {mediaTypes.includes('image') && (
                  <>
                    <TouchableOpacity
                      style={styles.option}
                      onPress={handlePickImage}
                    >
                      <ImageIcon size={32} color="#15803d" />
                      <Text style={styles.optionText}>Choose Photo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.option}
                      onPress={handleTakePhoto}
                    >
                      <Camera size={32} color="#15803d" />
                      <Text style={styles.optionText}>Take Photo</Text>
                    </TouchableOpacity>
                  </>
                )}

                {mediaTypes.includes('video') && (
                  <>
                    <TouchableOpacity
                      style={styles.option}
                      onPress={handlePickVideo}
                    >
                      <Video size={32} color="#15803d" />
                      <Text style={styles.optionText}>Choose Video</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.option}
                      onPress={handleRecordVideo}
                    >
                      <Video size={32} color="#ea580c" />
                      <Text style={styles.optionText}>Record Video</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {mediaTypes.includes('image') && mediaTypes.includes('video')
                  ? 'Images up to 10MB, Videos up to 500MB'
                  : mediaTypes.includes('image')
                    ? 'Images up to 10MB'
                    : 'Videos up to 500MB'}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15803d',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  mainButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  previewContainer: {
    marginTop: 12,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  videoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#ea580c',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  videoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 16,
  },
  option: {
    width: '45%',
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  footer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default MediaPicker;
