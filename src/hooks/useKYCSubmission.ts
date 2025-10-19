import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

export interface KYCSubmission {
  id: string;
  user_id: string;
  national_id_url: string | null;
  passport_url: string | null;
  selfie_url: string | null;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  submission_date: string;
  created_at: string;
  updated_at: string;
}

export function useKYCSubmission() {
  const [submission, setSubmission] = useState<KYCSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const submissionsRef = collection(db, 'kyc_submissions');
    const q = query(
      submissionsRef,
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setSubmission(null);
        setLoading(false);
        return;
      }

      const docData = snapshot.docs[0];
      const data = docData.data();

      setSubmission({
        id: docData.id,
        user_id: data.user_id,
        national_id_url: data.national_id_url || null,
        passport_url: data.passport_url || null,
        selfie_url: data.selfie_url || null,
        status: data.status,
        admin_notes: data.admin_notes || null,
        reviewed_by: data.reviewed_by || null,
        reviewed_at: data.reviewed_at?.toDate?.()?.toISOString() || null,
        rejection_reason: data.rejection_reason || null,
        submission_date: data.submission_date?.toDate?.()?.toISOString() || new Date().toISOString(),
        created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        updated_at: data.updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
      });
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error('Error fetching KYC submission:', err);
      setError('فشل في تحميل طلب التحقق');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createSubmission = async (
    nationalIdUrl: string,
    passportUrl: string,
    selfieUrl: string
  ) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('المستخدم غير مسجل الدخول');

      const submissionRef = doc(collection(db, 'kyc_submissions'));
      const submissionData = {
        user_id: user.uid,
        national_id_url: nationalIdUrl,
        passport_url: passportUrl,
        selfie_url: selfieUrl,
        status: 'pending' as const,
        admin_notes: null,
        reviewed_by: null,
        reviewed_at: null,
        rejection_reason: null,
        submission_date: serverTimestamp(),
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      await setDoc(submissionRef, submissionData);

      const auditRef = doc(collection(db, 'kyc_audit_log'));
      await setDoc(auditRef, {
        submission_id: submissionRef.id,
        admin_id: user.uid,
        action: 'submission_created',
        old_status: null,
        new_status: 'pending',
        notes: 'تم رفع مستندات KYC من قبل المستخدم',
        ip_address: null,
        created_at: serverTimestamp(),
      });

      const notificationRef = doc(collection(db, 'kyc_notifications'));
      await setDoc(notificationRef, {
        user_id: user.uid,
        submission_id: submissionRef.id,
        type: 'submission_received',
        title: 'تم استلام طلب التحقق',
        message: 'تم استلام طلب التحقق من الهوية الخاص بك. سنقوم بمراجعته خلال 24-48 ساعة.',
        is_read: false,
        created_at: serverTimestamp(),
      });

      return { id: submissionRef.id, ...submissionData };
    } catch (err) {
      console.error('Error creating KYC submission:', err);
      throw err;
    }
  };

  const updateSubmission = async (
    nationalIdUrl: string,
    passportUrl: string,
    selfieUrl: string
  ) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('المستخدم غير مسجل الدخول');
      if (!submission) throw new Error('لا يوجد طلب للتحديث');

      const submissionRef = doc(db, 'kyc_submissions', submission.id);

      await updateDoc(submissionRef, {
        national_id_url: nationalIdUrl,
        passport_url: passportUrl,
        selfie_url: selfieUrl,
        status: 'pending',
        submission_date: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      const auditRef = doc(collection(db, 'kyc_audit_log'));
      await setDoc(auditRef, {
        submission_id: submission.id,
        admin_id: user.uid,
        action: 'submission_updated',
        old_status: submission.status,
        new_status: 'pending',
        notes: 'تم تحديث مستندات KYC من قبل المستخدم',
        ip_address: null,
        created_at: serverTimestamp(),
      });

      return { ...submission, national_id_url: nationalIdUrl, passport_url: passportUrl, selfie_url: selfieUrl };
    } catch (err) {
      console.error('Error updating KYC submission:', err);
      throw err;
    }
  };

  const refresh = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const submissionsRef = collection(db, 'kyc_submissions');
      const q = query(
        submissionsRef,
        where('user_id', '==', user.uid),
        orderBy('created_at', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setSubmission(null);
        return;
      }

      const docData = snapshot.docs[0];
      const data = docData.data();

      setSubmission({
        id: docData.id,
        user_id: data.user_id,
        national_id_url: data.national_id_url || null,
        passport_url: data.passport_url || null,
        selfie_url: data.selfie_url || null,
        status: data.status,
        admin_notes: data.admin_notes || null,
        reviewed_by: data.reviewed_by || null,
        reviewed_at: data.reviewed_at?.toDate?.()?.toISOString() || null,
        rejection_reason: data.rejection_reason || null,
        submission_date: data.submission_date?.toDate?.()?.toISOString() || new Date().toISOString(),
        created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        updated_at: data.updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error refreshing KYC submission:', err);
    }
  };

  return {
    submission,
    loading,
    error,
    createSubmission,
    updateSubmission,
    refresh
  };
}
