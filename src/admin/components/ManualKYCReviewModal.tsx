import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Check,
  AlertTriangle,
  FileText,
  Loader,
  XCircle
} from 'lucide-react';
import { db } from '../../firebase';
import {
  collection,
  doc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { UnverifiedAccount } from '../hooks/useUnverifiedAccounts';

interface ManualKYCReviewModalProps {
  account: UnverifiedAccount;
  onClose: () => void;
  onSuccess: () => void;
  adminId: string;
  adminEmail: string;
}

export function ManualKYCReviewModal({
  account,
  onClose,
  onSuccess,
  adminId,
  adminEmail
}: ManualKYCReviewModalProps) {
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState('whatsapp');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleApprove = async () => {
    try {
      setError(null);
      setProcessing(true);

      const auditRef = doc(collection(db, 'kyc_audit_log'));
      await setDoc(auditRef, {
        user_id: account.user_id,
        admin_id: adminId,
        admin_email: adminEmail,
        action: 'manual_verification_approved',
        old_status: null,
        new_status: 'verified',
        notes: `تم قبول التحقق يدوياً من المصدر: ${source}. ${notes}`,
        ip_address: null,
        created_at: serverTimestamp()
      });

      const notificationRef = doc(collection(db, 'kyc_notifications'));
      await setDoc(notificationRef, {
        user_id: account.user_id,
        type: 'approved',
        title: 'تم قبول التحقق من الهوية',
        message: 'تم قبول طلب التحقق من الهوية بنجاح. يمكنك الآن الوصول إلى جميع المميزات.',
        is_read: false,
        created_at: serverTimestamp()
      });

      setSuccess('تم قبول الحساب بنجاح');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error approving manual verification:', err);
      setError('فشل في قبول الحساب. يرجى المحاولة مرة أخرى.');
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    try {
      setError(null);
      if (!notes.trim()) {
        setError('يجب إدخال سبب الرفض في الملاحظات');
        return;
      }
      setProcessing(true);

      const auditRef = doc(collection(db, 'kyc_audit_log'));
      await setDoc(auditRef, {
        user_id: account.user_id,
        admin_id: adminId,
        admin_email: adminEmail,
        action: 'manual_verification_rejected',
        old_status: null,
        new_status: 'rejected',
        notes: `تم رفض التحقق يدوياً من المصدر: ${source}. السبب: ${notes}`,
        ip_address: null,
        created_at: serverTimestamp()
      });

      const notificationRef = doc(collection(db, 'kyc_notifications'));
      await setDoc(notificationRef, {
        user_id: account.user_id,
        type: 'rejected',
        title: 'تم رفض طلب التحقق من الهوية',
        message: `تم رفض طلب التحقق من الهوية. السبب: ${notes}`,
        is_read: false,
        created_at: serverTimestamp()
      });

      setSuccess('تم رفض الحساب');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error rejecting manual verification:', err);
      setError('فشل في رفض الحساب. يرجى المحاولة مرة أخرى.');
      setProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-light-surface dark:bg-dark-surface rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-light-border dark:border-dark-border"
        onClick={(e) => e.stopPropagation()}
      >
        {success ? (
          <div className="flex items-center justify-center min-h-screen p-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-light-text dark:text-dark-text mb-2">
                تم بنجاح
              </h3>
              <p className="text-light-text-secondary dark:text-dark-text-secondary">
                {success}
              </p>
            </motion.div>
          </div>
        ) : (
          <>
            <div className="sticky top-0 z-10 bg-light-surface dark:bg-dark-surface border-b border-light-border dark:border-dark-border p-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-light-text dark:text-dark-text">
                  التحقق اليدوي من الهوية
                </h3>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
                  {account.first_name} {account.last_name}
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={processing}
                className="p-2 hover:bg-light-base dark:hover:bg-dark-base rounded-full transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6 text-light-text dark:text-dark-text" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3"
                >
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </motion.div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex gap-3">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                      معلومات المستخدم
                    </h4>
                    <div className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-200">
                      <p>البريد الإلكتروني: {account.email}</p>
                      {account.phone && <p>الهاتف: {account.phone}</p>}
                      {account.country && <p>الدولة: {account.country}</p>}
                      <p>تاريخ التسجيل: {new Date(account.created_at).toLocaleDateString('ar-SA')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-light-text dark:text-dark-text mb-3">
                  مصدر التحقق
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  disabled={processing}
                  className="w-full px-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent appearance-none cursor-pointer disabled:opacity-50"
                >
                  <option value="whatsapp">واتساب</option>
                  <option value="email">بريد إلكتروني</option>
                  <option value="phone">هاتف</option>
                  <option value="in_person">حضوري</option>
                  <option value="other">أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-light-text dark:text-dark-text mb-3">
                  ملاحظات
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أضف ملاحظاتك حول هذا التحقق..."
                  rows={4}
                  disabled={processing}
                  className="w-full px-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent resize-none disabled:opacity-50"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-light-border dark:border-dark-border">
                <button
                  onClick={onClose}
                  disabled={processing}
                  className="flex-1 px-6 py-3 bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border text-light-text dark:text-dark-text rounded-xl font-medium hover:bg-light-border dark:hover:bg-dark-border transition-colors disabled:opacity-50"
                >
                  إغلاق
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      جاري المعالجة...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      رفض
                    </>
                  )}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-lime-accent to-lime-500 text-dark-text rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      جاري المعالجة...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      قبول
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
