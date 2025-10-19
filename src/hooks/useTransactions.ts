import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';

export interface Transaction {
  id: string;
  user_id: string;
  type: 'sent' | 'received' | 'deposit' | 'withdrawal';
  amount: number;
  currency: string;
  recipient?: string;
  sender?: string;
  location?: string;
  country_flag?: string;
  category?: string;
  description?: string;
  reference?: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: any;
  updated_at: any;
}

export interface CreateTransactionData {
  type: 'sent' | 'received' | 'deposit' | 'withdrawal';
  amount: number;
  currency: string;
  recipient?: string;
  sender?: string;
  location?: string;
  country_flag?: string;
  category?: string;
  description?: string;
  reference?: string;
  method?: string;
  receipt_url?: string;
}

export const useTransactions = (limitCount?: number) => {
  const [user] = useAuthState(auth);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create new transaction
  const createTransaction = async (transactionData: CreateTransactionData): Promise<Transaction | null> => {
    if (!user) {
      setError('يجب تسجيل الدخول أولاً');
      return null;
    }

    try {
      setError(null);

      // تنظيف البيانات من القيم غير المعرفة أو الفارغة
      const cleanedData = Object.fromEntries(
        Object.entries(transactionData).filter(([_, value]) => 
          value !== undefined && value !== null && value !== ''
        )
      );

      const newTransactionData = {
        user_id: user.uid,
        ...cleanedData,
        currency: 'EUR', // توحيد العملة
        status: (transactionData.type === 'deposit' ? 'pending' : 'completed') as const,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'transactions'), newTransactionData);
      
      const createdTransaction: Transaction = {
        id: docRef.id,
        ...newTransactionData,
        created_at: new Date(),
        updated_at: new Date()
      };

      return createdTransaction;
    } catch (err) {
      console.error('Error creating transaction:', err);
      setError('فشل في إنشاء المعاملة');
      return null;
    }
  };

  // Listen to transactions changes in real-time
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let q = query(
      collection(db, 'transactions'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );

    // Apply limit if specified
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const transactionsData: Transaction[] = [];
        querySnapshot.forEach((doc) => {
          transactionsData.push({
            id: doc.id,
            ...doc.data()
          } as Transaction);
        });
        setTransactions(transactionsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching transactions:', error);
        setError('فشل في تحميل المعاملات');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, limitCount]);

  return {
    transactions,
    loading,
    error,
    createTransaction
  };
};