import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
  addDoc
} from 'firebase/firestore';
import { db } from '../../firebase';

export interface AgentTransactionSubmission {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  agent_id: string;
  agent_name?: string;
  agent_phone?: string;
  transaction_type: 'deposit' | 'withdrawal';
  amount: number;
  currency: string;
  commission: number;
  reference_code: string;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  notes?: string;
  created_at: any;
  updated_at: any;
  completed_at?: any;
  reviewed_by?: string;
  rejection_reason?: string;
}

export const useAgentTransactionsAdmin = () => {
  const [submissions, setSubmissions] = useState<AgentTransactionSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'agent_transactions'),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      async (querySnapshot) => {
        const transactionsData: AgentTransactionSubmission[] = [];

        for (const docSnapshot of querySnapshot.docs) {
          const data = docSnapshot.data();

          // Fetch agent details
          let agentName = 'Unknown Agent';
          let agentPhone = '';
          if (data.agent_id) {
            try {
              const agentDoc = await getDoc(doc(db, 'agents', data.agent_id));
              if (agentDoc.exists()) {
                const agentData = agentDoc.data();
                agentName = agentData.name || agentName;
                agentPhone = agentData.phone || '';
              }
            } catch (err) {
              console.error('Error fetching agent:', err);
            }
          }

          // Fetch user details
          let userName = 'Unknown User';
          let userEmail = '';
          if (data.user_id) {
            try {
              const userDoc = await getDoc(doc(db, 'users', data.user_id));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                userName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userName;
                userEmail = userData.email || '';
              }
            } catch (err) {
              console.error('Error fetching user:', err);
            }
          }

          transactionsData.push({
            id: docSnapshot.id,
            user_name: userName,
            user_email: userEmail,
            agent_name: agentName,
            agent_phone: agentPhone,
            ...data
          } as AgentTransactionSubmission);
        }

        setSubmissions(transactionsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching agent transactions:', error);
        setError('فشل في تحميل معاملات الوكلاء');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateSubmissionStatus = async (
    submissionId: string,
    status: 'completed' | 'cancelled' | 'failed',
    reviewerEmail: string,
    rejectionReason?: string
  ): Promise<boolean> => {
    try {
      const transactionRef = doc(db, 'agent_transactions', submissionId);
      const updateData: any = {
        status,
        reviewed_by: reviewerEmail,
        updated_at: serverTimestamp()
      };

      if (status === 'completed') {
        updateData.completed_at = serverTimestamp();
      }

      if (rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      await updateDoc(transactionRef, updateData);

      const transaction = submissions.find(t => t.id === submissionId);

      // If approved, update user balance
      if (status === 'completed') {
        if (transaction) {
          const userAccountRef = doc(db, 'bank_accounts', transaction.user_id);
          const userAccountDoc = await getDoc(userAccountRef);

          if (userAccountDoc.exists()) {
            const currentBalance = userAccountDoc.data().balance || 0;
            let newBalance = currentBalance;

            if (transaction.transaction_type === 'deposit') {
              newBalance = currentBalance + transaction.amount;
            } else if (transaction.transaction_type === 'withdrawal') {
              newBalance = currentBalance - transaction.amount;
            }

            await updateDoc(userAccountRef, {
              balance: newBalance,
              updated_at: serverTimestamp()
            });
          }
        }

        // Send success notification
        if (transaction) {
          await addDoc(collection(db, 'notifications'), {
            user_id: transaction.user_id,
            title: 'تمت الموافقة على معاملة الوكيل',
            message: `تمت الموافقة على معاملتك بمبلغ ${transaction.amount} ${transaction.currency} (${transaction.reference_code})`,
            type: 'success',
            read: false,
            created_at: serverTimestamp()
          });
        }
      }

      // If cancelled or failed, send notification with reason
      if ((status === 'cancelled' || status === 'failed') && transaction) {
        const notificationMessage = rejectionReason
          ? `تم إلغاء معاملتك (${transaction.reference_code}). السبب: ${rejectionReason}`
          : `تم إلغاء معاملتك بمبلغ ${transaction.amount} ${transaction.currency} (${transaction.reference_code})`;

        await addDoc(collection(db, 'notifications'), {
          user_id: transaction.user_id,
          title: 'تم إلغاء معاملة الوكيل',
          message: notificationMessage,
          type: 'error',
          read: false,
          created_at: serverTimestamp()
        });
      }

      return true;
    } catch (err) {
      console.error('Error updating transaction status:', err);
      return false;
    }
  };

  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    completed: submissions.filter(s => s.status === 'completed').length,
    cancelled: submissions.filter(s => s.status === 'cancelled').length,
    failed: submissions.filter(s => s.status === 'failed').length,
  };

  return {
    submissions,
    loading,
    error,
    stats,
    updateSubmissionStatus
  };
};
