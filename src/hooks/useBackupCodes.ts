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

export interface BackupCode {
  id: string;
  user_id: string;
  code_hash: string;
  is_used: boolean;
  used_at?: any;
  created_at: any;
}

export const useBackupCodes = () => {
  const [user] = useAuthState(auth);
  const [backupCodes, setBackupCodes] = useState<BackupCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate new backup codes
  const generateBackupCodes = async (): Promise<string[]> => {
    if (!user) {
      setError('يجب تسجيل الدخول أولاً');
      return [];
    }

    try {
      setError(null);

      // Delete existing backup codes
      const batch = writeBatch(db);
      backupCodes.forEach((code) => {
        const codeRef = doc(db, 'backup_codes', code.id);
        batch.delete(codeRef);
      });
      await batch.commit();

      // Generate new codes
      const codes: string[] = [];
      const newBatch = writeBatch(db);

      for (let i = 0; i < 10; i++) {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        codes.push(code);

        const codeRef = doc(collection(db, 'backup_codes'));
        newBatch.set(codeRef, {
          user_id: user.uid,
          code_hash: code, // In production, this should be hashed
          is_used: false,
          created_at: serverTimestamp()
        });
      }

      await newBatch.commit();
      return codes;
    } catch (err) {
      console.error('Error generating backup codes:', err);
      setError('فشل في إنشاء الرموز الاحتياطية');
      return [];
    }
  };

  // Use backup code
  const useBackupCode = async (codeId: string): Promise<boolean> => {
    try {
      setError(null);

      const codeRef = doc(db, 'backup_codes', codeId);
      await updateDoc(codeRef, { 
        is_used: true,
        used_at: serverTimestamp()
      });

      return true;
    } catch (err) {
      console.error('Error using backup code:', err);
      setError('فشل في استخدام الرمز الاحتياطي');
      return false;
    }
  };

  // Listen to backup codes changes in real-time
  useEffect(() => {
    if (!user) {
      setBackupCodes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'backup_codes'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const codesData: BackupCode[] = [];
        querySnapshot.forEach((doc) => {
          codesData.push({
            id: doc.id,
            ...doc.data()
          } as BackupCode);
        });
        setBackupCodes(codesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching backup codes:', error);
        setError('فشل في تحميل الرموز الاحتياطية');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return {
    backupCodes,
    loading,
    error,
    generateBackupCodes,
    useBackupCode
  };
};