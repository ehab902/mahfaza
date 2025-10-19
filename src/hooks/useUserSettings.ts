import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc,
  doc,
  query, 
  where, 
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';

export interface UserSettings {
  id: string;
  user_id: string;
  // إعدادات الإشعارات
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  login_alerts: boolean;
  // إعدادات الأمان
  two_factor_enabled: boolean;
  device_tracking: boolean;
  session_timeout: number;
  // إعدادات عامة
  theme: 'light' | 'dark' | 'system';
  created_at: any;
  updated_at: any;
}

export interface UpdateSettingsData {
  email_notifications?: boolean;
  sms_notifications?: boolean;
  push_notifications?: boolean;
  login_alerts?: boolean;
  two_factor_enabled?: boolean;
  device_tracking?: boolean;
  session_timeout?: number;
  theme?: 'light' | 'dark' | 'system';
}

export const useUserSettings = () => {
  const [user] = useAuthState(auth);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create or update settings
  const updateSettings = async (settingsData: UpdateSettingsData): Promise<boolean> => {
    if (!user) {
      setError('يجب تسجيل الدخول أولاً');
      return false;
    }

    try {
      setError(null);

      if (settings) {
        // Update existing settings
        const settingsRef = doc(db, 'user_settings', settings.id);
        await updateDoc(settingsRef, {
          ...settingsData,
          updated_at: serverTimestamp()
        });
      } else {
        // Create new settings with defaults
        const newSettingsData = {
          user_id: user.uid,
          email_notifications: true,
          sms_notifications: true,
          push_notifications: false,
          login_alerts: false,
          two_factor_enabled: false,
          device_tracking: true,
          session_timeout: 30,
          theme: 'system' as const,
          ...settingsData,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        };

        await addDoc(collection(db, 'user_settings'), newSettingsData);
      }

      return true;
    } catch (err) {
      console.error('Error updating settings:', err);
      setError('فشل في تحديث الإعدادات');
      return false;
    }
  };

  // Listen to settings changes in real-time
  useEffect(() => {
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'user_settings'),
      where('user_id', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          setSettings({
            id: doc.id,
            ...doc.data()
          } as UserSettings);
        } else {
          setSettings(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching settings:', error);
        setError('فشل في تحميل الإعدادات');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return {
    settings,
    loading,
    error,
    updateSettings
  };
};