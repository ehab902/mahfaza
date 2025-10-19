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

export interface BankAccount {
  id: string;
  user_id: string;
  account_number: string;
  iban: string;
  swift_code: string;
  bank_name: string;
  account_type: string;
  balance: number;
  currency: string;
  status: 'Active' | 'Inactive' | 'Suspended' | 'Closed';
  created_at: any;
  updated_at: any;
}

export interface UpdateBalanceData {
  amount: number;
  type: 'credit' | 'debit';
  description?: string;
}

export const useBankAccount = () => {
  const [user] = useAuthState(auth);
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update account balance
  const updateBalance = async (balanceData: UpdateBalanceData): Promise<boolean> => {
    if (!user || !account) {
      setError('يجب تسجيل الدخول أولاً');
      return false;
    }

    try {
      setError(null);

      const newBalance = balanceData.type === 'credit'
        ? account.balance + balanceData.amount
        : account.balance - balanceData.amount;

      // التأكد من عدم السماح برصيد سالب
      if (newBalance < 0) {
        setError('الرصيد غير كافي');
        return false;
      }

      const accountRef = doc(db, 'bank_accounts', account.id);
      await updateDoc(accountRef, {
        balance: newBalance,
        updated_at: serverTimestamp()
      });

      return true;
    } catch (err) {
      console.error('Error updating balance:', err);
      setError('فشل في تحديث الرصيد');
      return false;
    }
  };

  // Find account by IBAN
  const findAccountByIban = async (iban: string): Promise<BankAccount | null> => {
    try {
      const q = query(
        collection(db, 'bank_accounts'),
        where('iban', '==', iban)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const accountData = querySnapshot.docs[0].data();
        return {
          id: querySnapshot.docs[0].id,
          ...accountData
        } as BankAccount;
      }

      return null;
    } catch (err) {
      console.error('Error finding account by IBAN:', err);
      return null;
    }
  };

  // Get user ID by IBAN
  const getUserIdByIban = async (iban: string): Promise<string | null> => {
    try {
      const account = await findAccountByIban(iban);
      return account ? account.user_id : null;
    } catch (err) {
      console.error('Error getting user ID by IBAN:', err);
      return null;
    }
  };

  // Update recipient account balance
  const updateRecipientBalance = async (iban: string, amount: number, description: string): Promise<boolean> => {
    try {
      const recipientAccount = await findAccountByIban(iban);

      if (!recipientAccount) {
        console.error('Recipient account not found');
        return false;
      }

      const newBalance = recipientAccount.balance + amount;

      const accountRef = doc(db, 'bank_accounts', recipientAccount.id);
      await updateDoc(accountRef, {
        balance: newBalance,
        updated_at: serverTimestamp()
      });

      return true;
    } catch (err) {
      console.error('Error updating recipient balance:', err);
      return false;
    }
  };

  // Listen to account changes in real-time
  useEffect(() => {
    if (!user) {
      setAccount(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'bank_accounts'),
      where('user_id', '==', user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const accountData = querySnapshot.docs[0].data();
        setAccount({
          id: querySnapshot.docs[0].id,
          ...accountData
        } as BankAccount);
      } else {
        setAccount(null);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching bank account:', error);
      setError('فشل في تحميل بيانات الحساب');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return {
    account,
    loading,
    error,
    updateBalance,
    findAccountByIban,
    getUserIdByIban,
    updateRecipientBalance
  };
};