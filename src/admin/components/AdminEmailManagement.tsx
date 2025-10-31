import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield
} from 'lucide-react';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase';
import { User } from 'firebase/auth';

interface AdminEmail {
  email: string;
  active: boolean;
  added_date: any;
  added_by: string;
}

interface AdminEmailManagementProps {
  currentUser: User;
}

export function AdminEmailManagement({ currentUser }: AdminEmailManagementProps) {
  const [emails, setEmails] = useState<AdminEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'admin_allowed_emails'));
      const emailsList: AdminEmail[] = [];

      querySnapshot.forEach((doc) => {
        emailsList.push({
          email: doc.id,
          ...doc.data()
        } as AdminEmail);
      });

      setEmails(emailsList);
    } catch (err) {
      console.error('Error loading emails:', err);
      setError('فشل تحميل قائمة البريد الإلكتروني');
    } finally {
      setLoading(false);
    }
  };

  const addEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      setError('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const emailDocRef = doc(db, 'admin_allowed_emails', newEmail);

      await setDoc(emailDocRef, {
        active: true,
        added_date: serverTimestamp(),
        added_by: currentUser.email || currentUser.uid
      });

      setSuccess(`تمت إضافة ${newEmail} بنجاح`);
      setNewEmail('');
      await loadEmails();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error adding email:', err);
      setError('فشل إضافة البريد الإلكتروني: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const toggleEmailStatus = async (email: string, currentStatus: boolean) => {
    if (email === currentUser.email) {
      setError('لا يمكنك تعطيل بريدك الإلكتروني الخاص');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const emailDocRef = doc(db, 'admin_allowed_emails', email);
      await updateDoc(emailDocRef, {
        active: !currentStatus
      });

      setSuccess(`تم ${!currentStatus ? 'تفعيل' : 'تعطيل'} ${email} بنجاح`);
      await loadEmails();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error toggling email status:', err);
      setError('فشل تحديث حالة البريد الإلكتروني: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const removeEmail = async (email: string) => {
    if (email === currentUser.email) {
      setError('لا يمكنك حذف بريدك الإلكتروني الخاص');
      return;
    }

    if (!window.confirm(`هل أنت متأكد من حذف ${email} من قائمة المسؤولين؟`)) {
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const emailDocRef = doc(db, 'admin_allowed_emails', email);
      await deleteDoc(emailDocRef);

      setSuccess(`تم حذف ${email} بنجاح`);
      await loadEmails();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error removing email:', err);
      setError('فشل حذف البريد الإلكتروني: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-light-surface dark:bg-dark-surface rounded-2xl border border-light-border dark:border-dark-border shadow-lg overflow-hidden">
      <div className="p-6 border-b border-light-border dark:border-dark-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-lime-accent to-lime-600 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-dark-text" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-light-text dark:text-dark-text">
              إدارة البريد الإلكتروني للمسؤولين
            </h2>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              إضافة وإدارة المسؤولين المصرح لهم بالوصول للوحة التحكم
            </p>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-start gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addEmail()}
              placeholder="أدخل البريد الإلكتروني..."
              disabled={processing}
              className="w-full pr-11 pl-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent transition-all disabled:opacity-50"
            />
          </div>
          <button
            onClick={addEmail}
            disabled={processing || !newEmail}
            className="px-6 py-3 bg-gradient-to-r from-lime-accent to-lime-500 text-dark-text rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            إضافة
          </button>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-lime-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              جاري التحميل...
            </p>
          </div>
        ) : emails.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="w-16 h-16 text-light-text-secondary dark:text-dark-text-secondary mx-auto mb-4 opacity-50" />
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              لا توجد عناوين بريد إلكتروني مضافة بعد
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {emails.map((item) => (
              <motion.div
                key={item.email}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-light-base dark:bg-dark-base rounded-xl border border-light-border dark:border-dark-border"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    item.active
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    {item.active ? (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-light-text dark:text-dark-text">
                      {item.email}
                      {item.email === currentUser.email && (
                        <span className="mr-2 text-xs text-lime-600 dark:text-lime-400">
                          (أنت)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                      أضيف بواسطة: {item.added_by}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleEmailStatus(item.email, item.active)}
                    disabled={processing || item.email === currentUser.email}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      item.active
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                    }`}
                  >
                    {item.active ? 'تعطيل' : 'تفعيل'}
                  </button>
                  <button
                    onClick={() => removeEmail(item.email)}
                    disabled={processing || item.email === currentUser.email}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
