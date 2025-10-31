import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import {
  collection,
  query,
  getDocs,
  onSnapshot,
  where,
  orderBy
} from 'firebase/firestore';

export interface UnverifiedAccount {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  country?: string;
  city?: string;
  email_verified: boolean;
  phone_verified: boolean;
  created_at: string;
  updated_at: string;
  bank_account?: {
    account_number: string;
    iban: string;
    balance: number;
    currency: string;
    status: string;
  };
}

export function useUnverifiedAccounts() {
  const [accounts, setAccounts] = useState<UnverifiedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    emailVerified: 0,
    phoneVerified: 0,
    bothVerified: 0
  });

  useEffect(() => {
    const fetchUnverifiedAccounts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get all user profiles
        const profilesRef = collection(db, 'user_profiles');
        const profilesSnapshot = await getDocs(profilesRef);

        // Get all kyc_submissions to know which users have submitted
        const kycRef = collection(db, 'kyc_submissions');
        const kycSnapshot = await getDocs(kycRef);
        const usersWithKYC = new Set(kycSnapshot.docs.map(doc => doc.data().user_id));

        // Get all bank accounts
        const bankAccountsRef = collection(db, 'bank_accounts');
        const bankAccountsSnapshot = await getDocs(bankAccountsRef);
        const bankAccountsMap = new Map(
          bankAccountsSnapshot.docs.map(doc => [
            doc.data().user_id,
            {
              account_number: doc.data().account_number,
              iban: doc.data().iban,
              balance: doc.data().balance,
              currency: doc.data().currency,
              status: doc.data().status
            }
          ])
        );

        // Filter profiles that don't have KYC submissions
        const unverifiedList: UnverifiedAccount[] = [];
        profilesSnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          const userId = data.user_id;

          // Only include if they don't have a KYC submission
          if (!usersWithKYC.has(userId)) {
            unverifiedList.push({
              id: docSnapshot.id,
              user_id: userId,
              first_name: data.first_name || '',
              last_name: data.last_name || '',
              email: data.email || '',
              phone: data.phone || '',
              company: data.company || '',
              country: data.country || '',
              city: data.city || '',
              email_verified: data.email_verified || false,
              phone_verified: data.phone_verified || false,
              created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
              updated_at: data.updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
              bank_account: bankAccountsMap.get(userId)
            });
          }
        });

        // Sort by creation date (newest first)
        unverifiedList.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setAccounts(unverifiedList);

        // Calculate stats
        const emailVerifiedCount = unverifiedList.filter(a => a.email_verified).length;
        const phoneVerifiedCount = unverifiedList.filter(a => a.phone_verified).length;
        const bothVerifiedCount = unverifiedList.filter(a => a.email_verified && a.phone_verified).length;

        setStats({
          total: unverifiedList.length,
          emailVerified: emailVerifiedCount,
          phoneVerified: phoneVerifiedCount,
          bothVerified: bothVerifiedCount
        });
      } catch (err) {
        console.error('Error fetching unverified accounts:', err);
        setError('فشل في تحميل الحسابات غير المحققة');
      } finally {
        setLoading(false);
      }
    };

    fetchUnverifiedAccounts();

    // Set up real-time listener for changes
    const unsubscribers: Array<() => void> = [];

    const profilesRef = collection(db, 'user_profiles');
    const profilesUnsub = onSnapshot(profilesRef, () => {
      fetchUnverifiedAccounts();
    });
    unsubscribers.push(profilesUnsub);

    const kycRef = collection(db, 'kyc_submissions');
    const kycUnsub = onSnapshot(kycRef, () => {
      fetchUnverifiedAccounts();
    });
    unsubscribers.push(kycUnsub);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  const refresh = async () => {
    try {
      const profilesRef = collection(db, 'user_profiles');
      const profilesSnapshot = await getDocs(profilesRef);

      const kycRef = collection(db, 'kyc_submissions');
      const kycSnapshot = await getDocs(kycRef);
      const usersWithKYC = new Set(kycSnapshot.docs.map(doc => doc.data().user_id));

      const bankAccountsRef = collection(db, 'bank_accounts');
      const bankAccountsSnapshot = await getDocs(bankAccountsRef);
      const bankAccountsMap = new Map(
        bankAccountsSnapshot.docs.map(doc => [
          doc.data().user_id,
          {
            account_number: doc.data().account_number,
            iban: doc.data().iban,
            balance: doc.data().balance,
            currency: doc.data().currency,
            status: doc.data().status
          }
        ])
      );

      const unverifiedList: UnverifiedAccount[] = [];
      profilesSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const userId = data.user_id;

        if (!usersWithKYC.has(userId)) {
          unverifiedList.push({
            id: docSnapshot.id,
            user_id: userId,
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            email: data.email || '',
            phone: data.phone || '',
            company: data.company || '',
            country: data.country || '',
            city: data.city || '',
            email_verified: data.email_verified || false,
            phone_verified: data.phone_verified || false,
            created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
            updated_at: data.updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
            bank_account: bankAccountsMap.get(userId)
          });
        }
      });

      unverifiedList.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setAccounts(unverifiedList);

      const emailVerifiedCount = unverifiedList.filter(a => a.email_verified).length;
      const phoneVerifiedCount = unverifiedList.filter(a => a.phone_verified).length;
      const bothVerifiedCount = unverifiedList.filter(a => a.email_verified && a.phone_verified).length;

      setStats({
        total: unverifiedList.length,
        emailVerified: emailVerifiedCount,
        phoneVerified: phoneVerifiedCount,
        bothVerified: bothVerifiedCount
      });
    } catch (err) {
      console.error('Error refreshing unverified accounts:', err);
    }
  };

  return {
    accounts,
    loading,
    error,
    stats,
    refresh
  };
}
