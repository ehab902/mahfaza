import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, DollarSign, Calendar, User, Hash, CreditCard, AlertCircle, FileImage } from 'lucide-react';
import { TopUpSubmission } from '../hooks/useTopUpSubmissions';

interface TopUpReviewModalProps {
  submission: TopUpSubmission | null;
  onClose: () => void;
  onApprove: (submissionId: string) => Promise<void>;
  onReject: (submissionId: string, reason: string) => Promise<void>;
}

export function TopUpReviewModal({ submission, onClose, onApprove, onReject }: TopUpReviewModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!submission) return null;

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onApprove(submission.id);
      onClose();
    } catch (error) {
      console.error('Error approving submission:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('يرجى إدخال سبب الرفض');
      return;
    }

    setIsProcessing(true);
    try {
      await onReject(submission.id, rejectionReason);
      onClose();
    } catch (error) {
      console.error('Error rejecting submission:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'western-union':
        return 'ويسترن يونيون';
      case 'bank-transfer':
        return 'تحويل بنكي';
      case 'agents':
        return 'شبكة الوكلاء';
      default:
        return method;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-light-surface dark:bg-dark-surface rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-light-border dark:border-dark-border"
        >
          <div className="sticky top-0 bg-light-surface dark:bg-dark-surface border-b border-light-border dark:border-dark-border p-6 flex items-center justify-between z-10">
            <h2 className="text-2xl font-bold text-light-text dark:text-dark-text">
              مراجعة طلب التعبئة
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-light-base dark:hover:bg-dark-base rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-light-base dark:bg-dark-base rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-lime-accent" />
                <div className="flex-1">
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">المبلغ</p>
                  <p className="text-xl font-bold text-light-text dark:text-dark-text">
                    {submission.amount.toLocaleString()} {submission.currency}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">طريقة التعبئة</p>
                  <p className="font-medium text-light-text dark:text-dark-text">
                    {getMethodLabel(submission.method)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Hash className="w-5 h-5 text-purple-500" />
                <div className="flex-1">
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">الرقم المرجعي</p>
                  <p className="font-mono text-sm text-light-text dark:text-dark-text">
                    {submission.reference}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-cyan-500" />
                <div className="flex-1">
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">معرف المستخدم</p>
                  <p className="font-mono text-xs text-light-text dark:text-dark-text break-all">
                    {submission.userId}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-orange-500" />
                <div className="flex-1">
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">تاريخ الطلب</p>
                  <p className="text-sm text-light-text dark:text-dark-text">
                    {submission.createdAt.toDate().toLocaleString('ar-SA')}
                  </p>
                </div>
              </div>

              {submission.description && (
                <div className="pt-3 border-t border-light-border dark:border-dark-border">
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">الوصف</p>
                  <p className="text-sm text-light-text dark:text-dark-text">
                    {submission.description}
                  </p>
                </div>
              )}
            </div>

            {submission.receiptUrl && (
              <div className="bg-light-base dark:bg-dark-base rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileImage className="w-5 h-5 text-lime-accent" />
                  <p className="font-medium text-light-text dark:text-dark-text">صورة الإيصال</p>
                </div>
                <div className="relative rounded-lg overflow-hidden border border-light-border dark:border-dark-border">
                  <img
                    src={submission.receiptUrl}
                    alt="إيصال التحويل"
                    className="w-full h-auto max-h-96 object-contain bg-white"
                  />
                </div>
                <a
                  href={submission.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-3 text-sm text-lime-accent hover:underline"
                >
                  فتح الصورة في نافذة جديدة
                </a>
              </div>
            )}

            {submission.status === 'rejected' && submission.rejectionReason && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-100 mb-1">سبب الرفض:</p>
                    <p className="text-sm text-red-800 dark:text-red-200">{submission.rejectionReason}</p>
                  </div>
                </div>
              </div>
            )}

            {submission.status === 'pending' && (
              <>
                {!showRejectForm ? (
                  <div className="flex gap-3">
                    <button
                      onClick={handleApprove}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl font-medium transition-colors"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {isProcessing ? 'جاري الموافقة...' : 'الموافقة وإضافة المبلغ'}
                    </button>
                    <button
                      onClick={() => setShowRejectForm(true)}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-xl font-medium transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                      رفض الطلب
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-light-text dark:text-dark-text">
                      سبب الرفض
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      placeholder="اكتب سبب رفض هذا الطلب..."
                      className="w-full px-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={handleReject}
                        disabled={isProcessing || !rejectionReason.trim()}
                        className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-xl font-medium transition-colors"
                      >
                        {isProcessing ? 'جاري الرفض...' : 'تأكيد الرفض'}
                      </button>
                      <button
                        onClick={() => {
                          setShowRejectForm(false);
                          setRejectionReason('');
                        }}
                        disabled={isProcessing}
                        className="flex-1 px-6 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border text-light-text dark:text-dark-text rounded-xl font-medium transition-colors hover:bg-light-border dark:hover:bg-dark-border"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {submission.status === 'approved' && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <p className="font-medium text-green-900 dark:text-green-100">
                  تمت الموافقة على هذا الطلب
                </p>
                {submission.reviewedAt && (
                  <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                    بتاريخ: {submission.reviewedAt.toDate().toLocaleString('ar-SA')}
                  </p>
                )}
              </div>
            )}

            {submission.status === 'rejected' && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
                <XCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-2" />
                <p className="font-medium text-red-900 dark:text-red-100">
                  تم رفض هذا الطلب
                </p>
                {submission.reviewedAt && (
                  <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                    بتاريخ: {submission.reviewedAt.toDate().toLocaleString('ar-SA')}
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
