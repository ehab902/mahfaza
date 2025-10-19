import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';

export interface Recipient {
  id: string;
  user_id: string;
  name: string;
  type: 'individual' | 'business';
  country: string;
  email?: string;
  phone?: string;
  iban?: string;
  bank_name?: string;
  swift_code?: string;
  avatar_url?: string;
  flag?: string;
  last_used: any;
  created_at: any;
  updated_at: any;
}

export interface CreateRecipientData {
  name: string;
  type: 'individual' | 'business';
  country: string;
  email?: string;
  phone?: string;
  iban?: string;
  bank_name?: string;
  swift_code?: string;
  flag?: string;
}

export const useRecipients = () => {
  const [user] = useAuthState(auth);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const findUserAvatar = async (email?: string, phone?: string): Promise<string | null> => {
    try {
      if (!email && !phone) return null;

      let q;
      if (email) {
        q = query(collection(db, 'user_profiles'), where('user_id', '==', email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const profileData = querySnapshot.docs[0].data();
          if (profileData.profile_image_url) {
            return profileData.profile_image_url;
          }
        }
      }

      return null;
    } catch (err) {
      console.error('Error finding user avatar:', err);
      return null;
    }
  };

  // Create new recipient
  const createRecipient = async (recipientData: CreateRecipientData): Promise<Recipient | null> => {
    if (!user) {
      setError('يجب تسجيل الدخول أولاً');
      return null;
    }

    try {
      setError(null);

      const avatarUrl = await findUserAvatar(recipientData.email, recipientData.phone);

      const newRecipientData = {
        user_id: user.uid,
        ...recipientData,
        avatar_url: avatarUrl,
        last_used: serverTimestamp(),
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'recipients'), newRecipientData);

      const createdRecipient: Recipient = {
        id: docRef.id,
        ...newRecipientData,
        last_used: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      };

      return createdRecipient;
    } catch (err) {
      console.error('Error creating recipient:', err);
      setError('فشل في إضافة المستلم');
      return null;
    }
  };

  // Update recipient's last used timestamp
  const updateLastUsed = async (recipientId: string): Promise<boolean> => {
    try {
      setError(null);

      const recipientRef = doc(db, 'recipients', recipientId);
      await updateDoc(recipientRef, { 
        last_used: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      return true;
    } catch (err) {
      console.error('Error updating last used:', err);
      setError('فشل في تحديث آخر استخدام');
      return false;
    }
  };

  // Delete recipient
  const deleteRecipient = async (recipientId: string): Promise<boolean> => {
    try {
      setError(null);

      const recipientRef = doc(db, 'recipients', recipientId);
      await deleteDoc(recipientRef);

      return true;
    } catch (err) {
      console.error('Error deleting recipient:', err);
      setError('فشل في حذف المستلم');
      return false;
    }
  };

  // Listen to recipients changes in real-time
  useEffect(() => {
    if (!user) {
      setRecipients([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'recipients'),
      where('user_id', '==', user.uid),
      orderBy('last_used', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const recipientsData: Recipient[] = [];
        querySnapshot.forEach((doc) => {
          recipientsData.push({
            id: doc.id,
            ...doc.data()
          } as Recipient);
        });
        setRecipients(recipientsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching recipients:', error);
        setError('فشل في تحميل المستلمين');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return {
    recipients,
    loading,
    error,
    createRecipient,
    updateLastUsed,
    deleteRecipient
  };
};