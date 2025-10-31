import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  getDocs,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

export interface AdminKYCSubmission {
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

export function useKYCSubmissions() {
  const [submissions, setSubmissions] = useState<AdminKYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    under_review: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    const submissionsRef = collection(db, 'kyc_submissions');
    const q = query(submissionsRef, orderBy('submission_date', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const submissionsList: AdminKYCSubmission[] = [];

      snapshot.forEach((docData) => {
        const data = docData.data();
        submissionsList.push({
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
      });

      setSubmissions(submissionsList);

      const newStats = {
        total: submissionsList.length,
        pending: submissionsList.filter((s) => s.status === 'pending').length,
        under_review: submissionsList.filter((s) => s.status === 'under_review').length,
        approved: submissionsList.filter((s) => s.status === 'approved').length,
        rejected: submissionsList.filter((s) => s.status === 'rejected').length
      };
      setStats(newStats);
      setError(null);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching submissions:', err);
      setError('فشل في تحميل الطلبات');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateSubmissionStatus = async (
    submissionId: string,
    status: 'pending' | 'under_review' | 'approved' | 'rejected',
    adminId: string,
    notes?: string,
    rejectionReason?: string
  ) => {
    try {
      const oldSubmission = submissions.find((s) => s.id === submissionId);
      const submissionRef = doc(db, 'kyc_submissions', submissionId);

      await updateDoc(submissionRef, {
        status,
        reviewed_by: adminId,
        reviewed_at: serverTimestamp(),
        admin_notes: notes || null,
        rejection_reason: rejectionReason || null,
        updated_at: serverTimestamp(),
      });

      // Update bank account status to Active when KYC is approved
      if (status === 'approved' && oldSubmission?.user_id) {
        const bankAccountQuery = query(
          collection(db, 'bank_accounts'),
          where('user_id', '==', oldSubmission.user_id)
        );
        const bankAccountSnapshot = await getDocs(bankAccountQuery);

        if (!bankAccountSnapshot.empty) {
          const bankAccountRef = doc(db, 'bank_accounts', bankAccountSnapshot.docs[0].id);
          await updateDoc(bankAccountRef, {
            status: 'Active',
            updated_at: serverTimestamp(),
          });
        }
      }

      // Update bank account status to Suspended when KYC is rejected
      if (status === 'rejected' && oldSubmission?.user_id) {
        const bankAccountQuery = query(
          collection(db, 'bank_accounts'),
          where('user_id', '==', oldSubmission.user_id)
        );
        const bankAccountSnapshot = await getDocs(bankAccountQuery);

        if (!bankAccountSnapshot.empty) {
          const bankAccountRef = doc(db, 'bank_accounts', bankAccountSnapshot.docs[0].id);
          await updateDoc(bankAccountRef, {
            status: 'Suspended',
            updated_at: serverTimestamp(),
          });
        }
      }

      const auditRef = doc(collection(db, 'kyc_audit_log'));
      await setDoc(auditRef, {
        submission_id: submissionId,
        admin_id: adminId,
        action: 'status_change',
        old_status: oldSubmission?.status || null,
        new_status: status,
        notes: notes || null,
        ip_address: null,
        created_at: serverTimestamp(),
      });

      const submission = submissions.find((s) => s.id === submissionId);
      if (submission) {
        const notificationTypes: Record<string, { type: string; title: string; message: string }> = {
          under_review: {
            type: 'under_review',
            title: 'طلبك قيد المراجعة',
            message: 'فريقنا يقوم الآن بمراجعة مستنداتك. سنرسل لك إشعاراً عند اكتمال المراجعة.'
          },
          approved: {
            type: 'approved',
            title: 'تم الموافقة على طلبك',
            message: 'تم التحقق من هويتك بنجاح! يمكنك الآن الوصول لجميع ميزات المنصة.'
          },
          rejected: {
            type: 'rejected',
            title: 'تم رفض طلبك',
            message: rejectionReason || 'للأسف، لم يتم قبول المستندات المقدمة. يرجى مراجعة الملاحظات وإعادة التقديم.'
          }
        };

        if (notificationTypes[status]) {
          const notificationRef = doc(collection(db, 'kyc_notifications'));
          await setDoc(notificationRef, {
            user_id: submission.user_id,
            submission_id: submissionId,
            type: notificationTypes[status].type,
            title: notificationTypes[status].title,
            message: notificationTypes[status].message,
            is_read: false,
            created_at: serverTimestamp(),
          });
        }
      }
    } catch (err) {
      console.error('Error updating submission:', err);
      throw err;
    }
  };

  const refresh = async () => {
    try {
      const submissionsRef = collection(db, 'kyc_submissions');
      const q = query(submissionsRef, orderBy('submission_date', 'desc'));
      const snapshot = await getDocs(q);

      const submissionsList: AdminKYCSubmission[] = [];
      snapshot.forEach((docData) => {
        const data = docData.data();
        submissionsList.push({
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
      });

      setSubmissions(submissionsList);

      const newStats = {
        total: submissionsList.length,
        pending: submissionsList.filter((s) => s.status === 'pending').length,
        under_review: submissionsList.filter((s) => s.status === 'under_review').length,
        approved: submissionsList.filter((s) => s.status === 'approved').length,
        rejected: submissionsList.filter((s) => s.status === 'rejected').length
      };
      setStats(newStats);
    } catch (err) {
      console.error('Error refreshing submissions:', err);
    }
  };

  return {
    submissions,
    loading,
    error,
    stats,
    updateSubmissionStatus,
    refresh
  };
}
