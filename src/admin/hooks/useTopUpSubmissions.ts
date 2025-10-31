import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export interface TopUpSubmission {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  method: string;
  reference: string;
  status: 'pending' | 'approved' | 'rejected';
  recipient: string;
  description: string;
  receiptUrl?: string;
  createdAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  rejectionReason?: string;
}

interface TopUpStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export function useTopUpSubmissions() {
  const [submissions, setSubmissions] = useState<TopUpSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TopUpStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    const q = query(
      collection(db, 'transactions'),
      where('type', '==', 'deposit')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const topUps: TopUpSubmission[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        topUps.push({
          id: doc.id,
          userId: data.user_id,
          amount: data.amount,
          currency: data.currency,
          method: data.method || 'unknown',
          reference: data.reference,
          status: data.status || 'pending',
          recipient: data.recipient,
          description: data.description,
          receiptUrl: data.receipt_url,
          createdAt: data.created_at,
          reviewedAt: data.reviewed_at,
          reviewedBy: data.reviewed_by,
          rejectionReason: data.rejection_reason
        });
      });

      topUps.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

      const newStats: TopUpStats = {
        total: topUps.length,
        pending: topUps.filter(t => t.status === 'pending').length,
        approved: topUps.filter(t => t.status === 'approved').length,
        rejected: topUps.filter(t => t.status === 'rejected').length
      };

      setSubmissions(topUps);
      setStats(newStats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateSubmissionStatus = async (
    submissionId: string,
    newStatus: 'approved' | 'rejected',
    reviewerEmail: string,
    rejectionReason?: string
  ) => {
    try {
      const submissionRef = doc(db, 'transactions', submissionId);
      const updateData: any = {
        status: newStatus,
        reviewed_at: Timestamp.now(),
        reviewed_by: reviewerEmail
      };

      if (newStatus === 'rejected' && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      await updateDoc(submissionRef, updateData);

      const submission = submissions.find(s => s.id === submissionId);
      if (submission) {
        const notificationData: any = {
          user_id: submission.userId,
          type: newStatus === 'approved' ? 'topup_approved' : 'topup_rejected',
          title: newStatus === 'approved' ? 'تمت الموافقة على طلب التعبئة' : 'تم رفض طلب التعبئة',
          message: newStatus === 'approved'
            ? `تمت الموافقة على طلب تعبئة حسابك بمبلغ ${submission.amount} ${submission.currency}. تم إضافة المبلغ إلى رصيدك.`
            : `تم رفض طلب تعبئة حسابك بمبلغ ${submission.amount} ${submission.currency}. ${rejectionReason ? `السبب: ${rejectionReason}` : ''}`,
          read: false,
          created_at: Timestamp.now()
        };

        await addDoc(collection(db, 'notifications'), notificationData);

        if (newStatus === 'approved') {
          const accountQuery = query(
            collection(db, 'bank_accounts'),
            where('user_id', '==', submission.userId)
          );

          const accountSnapshot = await new Promise<any>((resolve) => {
            const unsubscribe = onSnapshot(accountQuery, (snapshot) => {
              unsubscribe();
              resolve(snapshot);
            });
          });

          if (!accountSnapshot.empty) {
            const accountDoc = accountSnapshot.docs[0];
            const currentBalance = accountDoc.data().balance || 0;
            const accountRef = doc(db, 'bank_accounts', accountDoc.id);

            await updateDoc(accountRef, {
              balance: currentBalance + submission.amount
            });
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating submission status:', error);
      return false;
    }
  };

  return {
    submissions,
    loading,
    stats,
    updateSubmissionStatus
  };
}
