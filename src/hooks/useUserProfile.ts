import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc,
  doc,
  query, 
  where, 
  onSnapshot,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';

export interface UserProfile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  country?: string;
  language?: string;
  profile_image_url?: string;
  created_at: any;
  updated_at: any;
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  country?: string;
  language?: string;
  profile_image_url?: string;
}

export const useUserProfile = () => {
  const [user] = useAuthState(auth);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create or update profile
  const updateProfile = async (profileData: UpdateProfileData): Promise<boolean> => {
    if (!user) {
      setError('يجب تسجيل الدخول أولاً');
      return false;
    }

    try {
      setError(null);

      if (profile) {
        // تحديث الملف الشخصي الموجود
        const profileRef = doc(db, 'user_profiles', profile.id);
        await updateDoc(profileRef, {
          ...profileData,
          updated_at: serverTimestamp()
        });
      } else {
        // إنشاء ملف شخصي جديد
        await addDoc(collection(db, 'user_profiles'), {
          user_id: user.uid,
          ...profileData,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
      }

      return true;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('فشل في تحديث الملف الشخصي');
      return false;
    }
  };

  // Listen to profile changes in real-time
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'user_profiles'),
      where('user_id', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          setProfile({
            id: doc.id,
            ...doc.data()
          } as UserProfile);
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching profile:', error);
        setError('فشل في تحميل الملف الشخصي');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return {
    profile,
    loading,
    error,
    updateProfile
  };
};