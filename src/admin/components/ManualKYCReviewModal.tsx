import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Upload,
  Check,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Loader
} from 'lucide-react';
import { db, storage } from '../../firebase';
import {
  collection,
  doc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UnverifiedAccount } from '../hooks/useUnverifiedAccounts';

interface ManualKYCReviewModalProps {
  account: UnverifiedAccount;
  onClose: () => void;
  onSuccess: () => void;
  adminId: string;
  adminEmail: string;
}

interface DocumentPreview {
  type: 'national_id' | 'passport' | 'selfie';
  file: File | null;
  preview: string | null;
}

export function ManualKYCReviewModal({
  account,
  onClose,
  onSuccess,
  adminId,
  adminEmail
}: ManualKYCReviewModalProps) {
  const [documents, setDocuments] = useState<Record<string, DocumentPreview>>({
    national_id: { type: 'national_id', file: null, preview: null },
    passport: { type: 'passport', file: null, preview: null },
    selfie: { type: 'selfie', file: null, preview: null }
  });

  const [notes, setNotes] = useState('');
  const [source, setSource] = useState('whatsapp');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fileInputRefs = {
    national_id: useRef<HTMLInputElement>(null),
    passport: useRef<HTMLInputElement>(null),
    selfie: useRef<HTMLInputElement>(null)
  };

  const handleFileSelect = (type: 'national_id' | 'passport' | 'selfie', file: File): void => {
    if (!file.type.startsWith('image/')) {
      setError('يجب اختيار ملف صورة');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('حجم الملف لا يجب أن يتجاوز 5 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setDocuments(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          file,
          preview: e.target?.result as string
        }
      }));
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  const uploadDocument = async (
    type: 'national_id' | 'passport' | 'selfie',
    file: File
  ): Promise<string | null> => {
    try {
      const fileName = `kyc-documents/${account.user_id}/${type}-${Date.now()}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (err) {
      console.error(`Error uploading ${type}:`, err);
      throw err;
    }
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      setUploading(true);

      // Upload documents to Firebase Storage (if any are selected)
      const uploadedUrls: Record<string, string | null> = {
        national_id_url: null,
        passport_url: null,
        selfie_url: null
      };

      for (const [key, doc] of Object.entries(documents)) {
        if (doc.file) {
          const url = await uploadDocument(key as 'national_id' | 'passport' | 'selfie', doc.file);
          uploadedUrls[`${key}_url`] = url;
        }
      }

      // Create KYC submission
      const submissionRef = doc(collection(db, 'kyc_submissions'));
      await setDoc(submissionRef, {
        user_id: account.user_id,
        national_id_url: uploadedUrls.national_id_url,
        passport_url: uploadedUrls.passport_url,
        selfie_url: uploadedUrls.selfie_url,
        status: 'under_review',
        admin_notes: notes || null,
        reviewed_by: adminId,
        reviewed_at: serverTimestamp(),
        rejection_reason: null,
        submission_date: serverTimestamp(),
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        manual_submission: true,
        submission_source: source,
        submitted_by_admin: adminEmail
      });

      // Create audit log entry
      const auditRef = doc(collection(db, 'kyc_audit_log'));
      await setDoc(auditRef, {
        submission_id: submissionRef.id,
        admin_id: adminId,
        admin_email: adminEmail,
        action: 'manual_submission_created',
        old_status: null,
        new_status: 'under_review',
        notes: `تم إنشاء طلب KYC يدوياً من المصدر: ${source}. ${notes}`,
        ip_address: null,
        created_at: serverTimestamp()
      });

      // Create notification for user
      const notificationRef = doc(collection(db, 'kyc_notifications'));
      await setDoc(notificationRef, {
        user_id: account.user_id,
        submission_id: submissionRef.id,
        type: 'under_review',
        title: 'تم استلام طلب التحقق',
        message: 'تم استلام مستنداتك قيد المراجعة. سنرسل لك إشعاراً عند اكتمال المراجعة.',
        is_read: false,
        created_at: serverTimestamp()
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error creating manual KYC submission:', err);
      setError('فشل في إنشاء طلب التحقق. يرجى المحاولة مرة أخرى.');
      setUploading(false);
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
                تم إنشاء طلب التحقق بنجاح
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
                className="p-2 hover:bg-light-base dark:hover:bg-dark-base rounded-full transition-colors"
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
                  مصدر المستندات
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent appearance-none cursor-pointer"
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
                  المستندات المطلوبة
                </label>
                <div className="space-y-4">
                  {Object.entries(documents).map(([key, doc]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                          {key === 'national_id' && 'الهوية الوطنية (اختياري)'}
                          {key === 'passport' && 'جواز السفر (اختياري)'}
                          {key === 'selfie' && 'صورة شخصية (اختياري)'}
                        </label>
                        {doc.file && (
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            تم الرفع
                          </span>
                        )}
                      </div>

                      <input
                        ref={fileInputRefs[key as keyof typeof fileInputRefs]}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(key as 'national_id' | 'passport' | 'selfie', file);
                        }}
                        className="hidden"
                      />

                      {doc.preview ? (
                        <div className="relative group">
                          <img
                            src={doc.preview}
                            alt={key}
                            className="w-full h-48 object-cover rounded-xl border border-light-border dark:border-dark-border"
                          />
                          <button
                            onClick={() =>
                              fileInputRefs[key as keyof typeof fileInputRefs]?.current?.click()
                            }
                            className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <Upload className="w-6 h-6 text-white" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            fileInputRefs[key as keyof typeof fileInputRefs]?.current?.click()
                          }
                          className="w-full border-2 border-dashed border-light-border dark:border-dark-border rounded-xl p-6 hover:border-lime-accent transition-colors flex flex-col items-center justify-center gap-2 hover:bg-light-base dark:hover:bg-dark-base"
                        >
                          <ImageIcon className="w-8 h-8 text-light-text-secondary dark:text-dark-text-secondary" />
                          <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                            اضغط لاختيار صورة
                          </span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-light-text dark:text-dark-text mb-3">
                  ملاحظات إضافية
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أضف أي ملاحظات حول المستندات أو عملية التحقق..."
                  rows={4}
                  className="w-full px-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-light-border dark:border-dark-border">
                <button
                  onClick={onClose}
                  disabled={uploading}
                  className="flex-1 px-6 py-3 bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border text-light-text dark:text-dark-text rounded-xl font-medium hover:bg-light-border dark:hover:bg-dark-border transition-colors disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={uploading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-lime-accent to-lime-500 text-dark-text rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      جاري الرفع...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      إنشاء طلب التحقق
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
