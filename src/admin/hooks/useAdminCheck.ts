import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

interface AdminCheckResult {
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAdminCheck(user: User | null): AdminCheckResult {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !user.email) {
      setIsAdmin(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    const email = user.email;
    const adminDocRef = doc(db, 'admin_allowed_emails', email);

    const unsubscribe = onSnapshot(
      adminDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setIsAdmin(data.active === true);
          setError(null);
        } else {
          setIsAdmin(false);
          setError('البريد الإلكتروني غير مسموح بالوصول لهذه اللوحة');
        }
        setIsLoading(false);
      },
      (err) => {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
        setError('فشل التحقق من صلاحيات الوصول');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { isAdmin, isLoading, error };
}

export async function checkAdminStatus(email: string): Promise<boolean> {
  try {
    const adminDocRef = doc(db, 'admin_allowed_emails', email);
    const docSnapshot = await getDoc(adminDocRef);

    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      return data.active === true;
    }

    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function logAdminAccess(
  email: string,
  action: 'login_success' | 'login_failed' | 'logout' | 'access_denied',
  details?: string
): Promise<void> {
  try {
    const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');

    const logData = {
      email,
      action,
      details: details || '',
      timestamp: serverTimestamp(),
      user_agent: navigator.userAgent,
    };

    await addDoc(collection(db, 'admin_access_audit_log'), logData);
  } catch (error) {
    console.error('Error logging admin access:', error);
  }
}
