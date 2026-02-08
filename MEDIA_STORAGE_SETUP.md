# Media Storage Setup Guide

## Overview

The app is now ready for image and video uploads. This guide explains how to configure Supabase Storage to enable media uploads.

## What's Implemented

✅ Media Service (`lib/media-service.ts`)
- Image picker from camera roll
- Camera capture
- Video picker from library
- Video recording
- File upload to Supabase Storage
- File validation (size, type)
- Error handling

✅ Media Picker Component (`components/MediaPicker.tsx`)
- Reusable UI component
- Shows upload options
- Progress tracking
- Preview display
- Error messages

✅ Dependency Added
- `expo-image-picker@~15.0.5` in package.json

## Setup Steps

### Step 1: Create Storage Bucket

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Storage** (in left sidebar)
4. Click **Create a new bucket**
5. Name it: `media`
6. Make it **Public** (toggle on)
7. Click **Create bucket**

### Step 2: Enable Storage Policies (Optional but Recommended)

In Supabase Dashboard → Storage → Policies:

**Policy 1: Allow Users to Upload**
```sql
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');
```

**Policy 2: Public Read Access**
```sql
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');
```

**Policy 3: Allow Users to Delete Own Files**
```sql
CREATE POLICY "Allow delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media' AND owner = auth.uid());
```

### Step 3: Install Dependencies

```bash
npm install
```

This installs `expo-image-picker` for media selection.

## How to Use in Your App

### In Post Creation Screen

```typescript
import MediaPicker from '@/components/MediaPicker';

export default function CreatePostScreen() {
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [error, setError] = useState<string>('');

  const handleMediaSelected = (url: string, type: 'image' | 'video') => {
    setMediaUrl(url);
    setMediaType(type);
  };

  return (
    <View>
      <MediaPicker
        onMediaSelected={handleMediaSelected}
        onError={setError}
        mediaTypes={['image', 'video']}
        label="Add Photo or Video"
      />

      {error && <Text style={{ color: 'red' }}>{error}</Text>}

      {mediaUrl && (
        <Text>Media URL: {mediaUrl}</Text>
      )}
    </View>
  );
}
```

### Direct Media Service Usage

```typescript
import { mediaService } from '@/lib/media-service';

// Pick an image
const asset = await mediaService.pickImage();
if (asset) {
  const validation = mediaService.validateImage(asset);
  if (validation.valid) {
    const uploaded = await mediaService.uploadImage(asset);
    console.log('Image uploaded:', uploaded.url);
  }
}

// Record a video
const videoAsset = await mediaService.recordVideo();
if (videoAsset) {
  const validation = mediaService.validateVideo(videoAsset);
  if (validation.valid) {
    const uploaded = await mediaService.uploadVideo(videoAsset);
    console.log('Video uploaded:', uploaded.url);
  }
}
```

## File Size Limits

- **Images**: 10 MB max
- **Videos**: 500 MB max

## Supported Formats

**Images**: JPEG, PNG, WebP, GIF
**Videos**: MP4, MOV, AVI

## Error Handling

The media service throws errors for:
- File size exceeded
- Invalid file type
- Missing permissions
- Upload failures

Always wrap calls in try-catch:

```typescript
try {
  const uploaded = await mediaService.uploadImage(asset);
  // Use uploaded.url
} catch (error) {
  console.error('Upload failed:', error);
  setError(error.message);
}
```

## Testing

### Test Locally

1. Run the app: `npm run dev`
2. Create a new post
3. Tap "Add Media" button
4. Choose "Take Photo" or "Choose Photo"
5. Select/capture an image
6. Image should upload and show preview
7. Complete post and save

### Test with Video

1. Same steps but choose "Record Video" or "Choose Video"
2. Record or select a video
3. Should show video preview
4. Complete post and save

## Troubleshooting

### "Permission denied" error
- Check device camera/photo permissions
- On iOS: Settings → App Permissions
- On Android: App Settings → Permissions

### Upload fails
- Check file size (under limits)
- Verify file format is supported
- Check internet connection
- Try with smaller file

### No bucket found
- Ensure `media` bucket is created
- Verify bucket is set to Public
- Wait a moment after creating bucket

### Images/videos not displaying
- Check URLs are correct
- Verify bucket is public
- Check storage policies allow read access
- Test URL directly in browser

## Integration Checklist

- [ ] Storage bucket `media` created in Supabase
- [ ] Bucket set to Public
- [ ] Storage policies configured (optional)
- [ ] `npm install` run locally
- [ ] MediaPicker component imported in screens
- [ ] Media URL stored in posts table
- [ ] Images/videos display in posts
- [ ] User can upload and see media

## Next Steps

After setup:

1. **Update Post Creation Screen** (`/app/(tabs)/social.tsx`)
   - Import MediaPicker component
   - Add media selection option
   - Store media URL when posting

2. **Update Story Creation** (`/app/(tabs)/social.tsx`)
   - Add media picker for stories
   - Require media for stories
   - Display in 24-hour feed

3. **Update Event Creation** (admin screens)
   - Add event image picker
   - Show image in event detail

4. **Update Announcement Creation** (admin screens)
   - Add announcement image picker
   - Display image in announcement list

5. **Update Chat Messages** (`/app/chat/[id].tsx`)
   - Add media attachment option
   - Display images/videos in chat

## Advanced Features (Future)

- Image compression before upload
- Video thumbnail generation
- Chunked upload for large files
- Background upload queue
- Offline media caching
- Media analytics (views, engagement)

## Security Notes

- All uploads go through Supabase
- User auth required for uploads
- Storage policies enforce access
- URLs are permanent (until deleted)
- Private data not exposed

## Support

For issues:
1. Check Supabase Storage logs
2. Verify bucket permissions
3. Test with browser directly
4. Check media-service.ts for errors
5. Review app console logs

---

**Status**: Ready to implement ✅
**Date**: 2026-02-08
