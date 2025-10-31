import {
  collection,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { CreateTransactionData } from './useTransactions';

export const createRecipientTransaction = async (
  recipientUserId: string,
  transactionData: Omit<CreateTransactionData, 'type'> & { type: 'received' },
): Promise<boolean> => {
  try {
    const newTransactionData = {
      user_id: recipientUserId,
      ...transactionData,
      status: 'completed' as const,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    await addDoc(collection(db, 'transactions'), newTransactionData);
    return true;
  } catch (err) {
    console.error('Error creating recipient transaction:', err);
    return false;
  }
};

export const createRecipientNotification = async (
  recipientUserId: string,
  senderName: string,
  amount: number,
  currency: string,
  reference: string
): Promise<boolean> => {
  try {
    const notificationData = {
      user_id: recipientUserId,
      type: 'transaction' as const,
      title: 'Money Received',
      message: `You received ${amount} ${currency} from ${senderName}`,
      description: `Reference: ${reference}`,
      read: false,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    await addDoc(collection(db, 'notifications'), notificationData);
    return true;
  } catch (err) {
    console.error('Error creating recipient notification:', err);
    return false;
  }
};
