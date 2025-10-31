import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc,
  doc,
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';

export interface Notification {
  id: string;
  user_id: string;
  type: 'success' | 'warning' | 'info' | 'transaction' | 'topup_approved' | 'topup_rejected' | 'kyc_approved' | 'kyc_rejected';
  title: string;
  message?: string;
  description?: string;
  time?: string;
  read: boolean;
  created_at: any;
  updated_at: any;
}

export interface CreateNotificationData {
  type: 'success' | 'warning' | 'info' | 'transaction' | 'topup_approved' | 'topup_rejected' | 'kyc_approved' | 'kyc_rejected';
  title: string;
  message?: string;
  description?: string;
}

export const useNotifications = () => {
  const [user] = useAuthState(auth);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create new notification
  const createNotification = async (notificationData: CreateNotificationData): Promise<Notification | null> => {
    if (!user) {
      setError('يجب تسجيل الدخول أولاً');
      return null;
    }

    try {
      setError(null);

      const newNotificationData = {
        user_id: user.uid,
        ...notificationData,
        read: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'notifications'), newNotificationData);
      
      const createdNotification: Notification = {
        id: docRef.id,
        ...newNotificationData,
        created_at: new Date(),
        updated_at: new Date()
      };

      return createdNotification;
    } catch (err) {
      console.error('Error creating notification:', err);
      setError('فشل في إنشاء الإشعار');
      return null;
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string): Promise<boolean> => {
    try {
      setError(null);

      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { 
        read: true,
        updated_at: serverTimestamp()
      });

      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('فشل في تحديث الإشعار');
      return false;
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      setError(null);
      setLoading(true);

      const batch = writeBatch(db);
      const unreadNotifications = notifications.filter(n => !n.read);

      unreadNotifications.forEach((notification) => {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.update(notificationRef, { 
          read: true,
          updated_at: serverTimestamp()
        });
      });

      await batch.commit();
      return true;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('فشل في تحديث الإشعارات');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Listen to notifications changes in real-time
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'notifications'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const notificationsData: Notification[] = [];
        querySnapshot.forEach((doc) => {
          notificationsData.push({
            id: doc.id,
            ...doc.data()
          } as Notification);
        });
        setNotifications(notificationsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching notifications:', error);
        setError('فشل في تحميل الإشعارات');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return {
    notifications,
    loading,
    error,
    createNotification,
    markAsRead,
    markAllAsRead
  };
};