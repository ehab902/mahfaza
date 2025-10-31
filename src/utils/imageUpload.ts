import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function compressImage(file: File, maxWidth: number = 200, maxHeight: number = 200, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('فشل ضغط الصورة'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('فشل تحميل الصورة'));
    };
    reader.onerror = () => reject(new Error('فشل قراءة الملف'));
  });
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 2 * 1024 * 1024;
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'نوع الملف غير مدعوم. يرجى رفع صورة بصيغة JPG، PNG أو WebP' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'حجم الصورة كبير جداً. الحد الأقصى 2 ميجابايت' };
  }

  return { valid: true };
}

export async function uploadAgentAvatar(file: File, agentCode: string): Promise<ImageUploadResult> {
  try {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const compressedFile = await compressImage(file);

    const timestamp = Date.now();
    const filename = `${agentCode}_${timestamp}.jpg`;
    const storageRef = ref(storage, `agent-avatars/${filename}`);

    await uploadBytes(storageRef, compressedFile);
    const url = await getDownloadURL(storageRef);

    return { success: true, url };
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return { success: false, error: 'فشل رفع الصورة. يرجى المحاولة مرة أخرى' };
  }
}

export async function deleteAgentAvatar(avatarUrl: string): Promise<boolean> {
  try {
    if (!avatarUrl || !avatarUrl.includes('agent-avatars')) {
      return true;
    }

    const decodedUrl = decodeURIComponent(avatarUrl);
    const pathMatch = decodedUrl.match(/agent-avatars%2F([^?]+)/);

    if (pathMatch && pathMatch[1]) {
      const filename = pathMatch[1];
      const storageRef = ref(storage, `agent-avatars/${filename}`);
      await deleteObject(storageRef);
      return true;
    }

    return true;
  } catch (error) {
    console.error('Error deleting avatar:', error);
    return false;
  }
}

export async function uploadUserAvatar(file: File, userId: string): Promise<ImageUploadResult> {
  try {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const compressedFile = await compressImage(file);

    const timestamp = Date.now();
    const filename = `${userId}_${timestamp}.jpg`;
    const storageRef = ref(storage, `avatars/${userId}/${filename}`);

    await uploadBytes(storageRef, compressedFile);
    const url = await getDownloadURL(storageRef);

    return { success: true, url };
  } catch (error) {
    console.error('Error uploading user avatar:', error);
    return { success: false, error: 'فشل رفع الصورة. يرجى المحاولة مرة أخرى' };
  }
}

export async function deleteUserAvatar(avatarUrl: string): Promise<boolean> {
  try {
    if (!avatarUrl || !avatarUrl.includes('avatars')) {
      return true;
    }

    const decodedUrl = decodeURIComponent(avatarUrl);
    const pathMatch = decodedUrl.match(/avatars%2F[^%]+%2F([^?]+)/);

    if (pathMatch && pathMatch[0]) {
      const path = pathMatch[0].replace(/%2F/g, '/');
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      return true;
    }

    return true;
  } catch (error) {
    console.error('Error deleting user avatar:', error);
    return false;
  }
}
