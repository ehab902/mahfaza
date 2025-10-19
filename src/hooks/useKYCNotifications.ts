import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  collection,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';

export interface KYCNotification {
  id: string;
  user_id: string;
  submission_id: string;
  type: 'submission_received' | 'under_review' | 'approved' | 'rejected' | 'resubmission_required';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function useKYCNotifications() {
  const [notifications, setNotifications] = useState<KYCNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const notificationsRef = collection(db, 'kyc_notifications');
    const q = query(
      notificationsRef,
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsList: KYCNotification[] = [];

      snapshot.forEach((docData) => {
        const data = docData.data();
        notificationsList.push({
          id: docData.id,
          user_id: data.user_id,
          submission_id: data.submission_id,
          type: data.type,
          title: data.title,
          message: data.message,
          is_read: data.is_read || false,
          created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        });
      });

      setNotifications(notificationsList);
      setUnreadCount(notificationsList.filter((n) => !n.is_read).length);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'kyc_notifications', notificationId);
      await updateDoc(notificationRef, {
        is_read: true
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const batch = writeBatch(db);
      notifications.filter((n) => !n.is_read).forEach((notification) => {
        const notificationRef = doc(db, 'kyc_notifications', notification.id);
        batch.update(notificationRef, { is_read: true });
      });

      await batch.commit();

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const refresh = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const notificationsRef = collection(db, 'kyc_notifications');
      const q = query(
        notificationsRef,
        where('user_id', '==', user.uid),
        orderBy('created_at', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const notificationsList: KYCNotification[] = [];

      snapshot.forEach((docData) => {
        const data = docData.data();
        notificationsList.push({
          id: docData.id,
          user_id: data.user_id,
          submission_id: data.submission_id,
          type: data.type,
          title: data.title,
          message: data.message,
          is_read: data.is_read || false,
          created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        });
      });

      setNotifications(notificationsList);
      setUnreadCount(notificationsList.filter((n) => !n.is_read).length);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh
  };
}
