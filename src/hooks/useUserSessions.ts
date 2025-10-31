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
  writeBatch
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';

export interface UserSession {
  id: string;
  user_id: string;
  device_info: string;
  location?: string;
  ip_address?: string;
  user_agent?: string;
  is_current: boolean;
  last_activity: any;
  created_at: any;
  expires_at: any;
}

export interface CreateSessionData {
  device_info: string;
  location?: string;
  ip_address?: string;
  user_agent?: string;
  is_current?: boolean;
}

export const useUserSessions = () => {
  const [user] = useAuthState(auth);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create new session
  const createSession = async (sessionData: CreateSessionData): Promise<UserSession | null> => {
    if (!user) {
      setError('يجب تسجيل الدخول أولاً');
      return null;
    }

    try {
      setError(null);

      const newSessionData = {
        user_id: user.uid,
        ...sessionData,
        last_activity: serverTimestamp(),
        created_at: serverTimestamp(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      };

      const docRef = await addDoc(collection(db, 'user_sessions'), newSessionData);
      
      const createdSession: UserSession = {
        id: docRef.id,
        ...newSessionData,
        last_activity: new Date(),
        created_at: new Date(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      return createdSession;
    } catch (err) {
      console.error('Error creating session:', err);
      setError('فشل في إنشاء الجلسة');
      return null;
    }
  };

  // Terminate session
  const terminateSession = async (sessionId: string): Promise<boolean> => {
    try {
      setError(null);

      const sessionRef = doc(db, 'user_sessions', sessionId);
      await deleteDoc(sessionRef);

      return true;
    } catch (err) {
      console.error('Error terminating session:', err);
      setError('فشل في إنهاء الجلسة');
      return false;
    }
  };

  // Terminate all sessions except current
  const terminateAllSessions = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      setError(null);

      const batch = writeBatch(db);
      const otherSessions = sessions.filter(s => !s.is_current);

      otherSessions.forEach((session) => {
        const sessionRef = doc(db, 'user_sessions', session.id);
        batch.delete(sessionRef);
      });

      await batch.commit();
      return true;
    } catch (err) {
      console.error('Error terminating all sessions:', err);
      setError('فشل في إنهاء الجلسات');
      return false;
    }
  };

  // Listen to sessions changes in real-time
  useEffect(() => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'user_sessions'),
      where('user_id', '==', user.uid),
      orderBy('last_activity', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const sessionsData: UserSession[] = [];
        querySnapshot.forEach((doc) => {
          sessionsData.push({
            id: doc.id,
            ...doc.data()
          } as UserSession);
        });
        setSessions(sessionsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching sessions:', error);
        setError('فشل في تحميل الجلسات');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return {
    sessions,
    loading,
    error,
    createSession,
    terminateSession,
    terminateAllSessions
  };
};