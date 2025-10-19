import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, FileText, Camera, AlertTriangle, Loader } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { AdminKYCSubmission } from '../hooks/useKYCSubmissions';

interface KYCReviewModalProps {
  submissionId: string;
  onClose: () => void;
  onUpdate: (
    submissionId: string,
    status: 'pending' | 'under_review' | 'approved' | 'rejected',
    adminId: string,
    notes?: string,
    rejectionReason?: string
  ) => Promise<void>;
  adminId: string;
}

export function KYCReviewModal({ submissionId, onClose, onUpdate, adminId }: KYCReviewModalProps) {
  const [submission, setSubmission] = useState<AdminKYCSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    fetchSubmission();
  }, [submissionId]);

  const fetchSubmission = async () => {
    try {
      const submissionRef = doc(db, 'kyc_submissions', submissionId);
      const submissionDoc = await getDoc(submissionRef);

      if (!submissionDoc.exists()) {
        throw new Error('Submission not found');
      }

      const data = submissionDoc.data();

      // Parse national_id_url if it contains front|back format
      let nationalIdFront = null;
      let nationalIdBack = null;
      if (data.national_id_url && data.national_id_url.includes('|')) {
        const [front, back] = data.national_id_url.split('|');
        nationalIdFront = front;
        nationalIdBack = back;
      } else if (data.national_id_url) {
        nationalIdFront = data.national_id_url;
      }

      const submissionData: AdminKYCSubmission = {
        id: submissionDoc.id,
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
      };

      setSubmission(submissionData);
      setNotes(submissionData.admin_notes || '');
      setRejectionReason(submissionData.rejection_reason || '');
    } catch (error) {
      console.error('Error fetching submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setUpdating(true);
      await onUpdate(submissionId, 'approved', adminId, notes);
      onClose();
    } catch (error) {
      console.error('Error approving submission:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('يرجى كتابة سبب الرفض');
      return;
    }

    try {
      setUpdating(true);
      await onUpdate(submissionId, 'rejected', adminId, notes, rejectionReason);
      onClose();
    } catch (error) {
      console.error('Error rejecting submission:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkUnderReview = async () => {
    try {
      setUpdating(true);
      await onUpdate(submissionId, 'under_review', adminId, notes);
      await fetchSubmission();
    } catch (error) {
      console.error('Error updating submission:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-light-surface dark:bg-dark-surface rounded-3xl p-8">
          <div className="w-16 h-16 border-4 border-lime-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-light-surface dark:bg-dark-surface rounded-3xl shadow-2xl max-w-5xl w-full my-8"
      >
        <div className="sticky top-0 bg-light-surface dark:bg-dark-surface border-b border-light-border dark:border-dark-border p-6 rounded-t-3xl z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-light-text dark:text-dark-text mb-1">
                مراجعة طلب التحقق
              </h2>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary font-mono">
                {submission.id}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-light-base dark:hover:bg-dark-base rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-light-text-secondary dark:text-dark-text-secondary" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
          {/* Document Type Badge */}
          <div className="bg-lime-accent/10 border border-lime-accent/30 rounded-xl p-4">
            <p className="text-sm font-semibold text-lime-accent">
              نوع الوثيقة: {submission.national_id_url ? 'الهوية الوطنية' : submission.passport_url ? 'جواز السفر' : 'غير محدد'}
            </p>
          </div>

          {/* National ID Documents (if provided) */}
          {submission.national_id_url && (
            <>
              {submission.national_id_url.includes('|') ? (
                // Two sides (front and back)
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-light-text-secondary dark:text-dark-text-secondary mb-2">
                      <FileText className="w-4 h-4" />
                      <h3 className="font-semibold">الهوية الوطنية - الوجه الأمامي</h3>
                    </div>
                    <div className="relative group">
                      <img
                        src={submission.national_id_url.split('|')[0]}
                        alt="National ID Front"
                        className="w-full h-64 object-contain rounded-xl border-2 border-light-border dark:border-dark-border hover:border-lime-accent transition-colors cursor-pointer bg-light-base dark:bg-dark-base"
                        onClick={() => window.open(submission.national_id_url!.split('|')[0], '_blank')}
                        onError={(e) => {
                          console.error('Error loading national ID front image');
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EError%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-light-text-secondary dark:text-dark-text-secondary mb-2">
                      <FileText className="w-4 h-4" />
                      <h3 className="font-semibold">الهوية الوطنية - الوجه الخلفي</h3>
                    </div>
                    <div className="relative group">
                      <img
                        src={submission.national_id_url.split('|')[1]}
                        alt="National ID Back"
                        className="w-full h-64 object-contain rounded-xl border-2 border-light-border dark:border-dark-border hover:border-lime-accent transition-colors cursor-pointer bg-light-base dark:bg-dark-base"
                        onClick={() => window.open(submission.national_id_url!.split('|')[1], '_blank')}
                        onError={(e) => {
                          console.error('Error loading national ID back image');
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EError%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl pointer-events-none" />
                    </div>
                  </div>
                </div>
              ) : (
                // Single image (old format)
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-light-text-secondary dark:text-dark-text-secondary mb-2">
                    <FileText className="w-4 h-4" />
                    <h3 className="font-semibold">الهوية الوطنية</h3>
                  </div>
                  <div className="relative group">
                    <img
                      src={submission.national_id_url}
                      alt="National ID"
                      className="w-full h-64 object-contain rounded-xl border-2 border-light-border dark:border-dark-border hover:border-lime-accent transition-colors cursor-pointer bg-light-base dark:bg-dark-base"
                      onClick={() => window.open(submission.national_id_url!, '_blank')}
                      onError={(e) => {
                        console.error('Error loading national ID image');
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EError%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl pointer-events-none" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Passport Document (if provided) */}
          {submission.passport_url && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-light-text-secondary dark:text-dark-text-secondary mb-2">
                <FileText className="w-4 h-4" />
                <h3 className="font-semibold">جواز السفر</h3>
              </div>
              <div className="relative group">
                <img
                  src={submission.passport_url}
                  alt="Passport"
                  className="w-full h-64 object-contain rounded-xl border-2 border-light-border dark:border-dark-border hover:border-lime-accent transition-colors cursor-pointer bg-light-base dark:bg-dark-base"
                  onClick={() => window.open(submission.passport_url!, '_blank')}
                  onError={(e) => {
                    console.error('Error loading passport image');
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EError%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl pointer-events-none" />
              </div>
            </div>
          )}

          {/* Selfie (always required) */}
          {submission.selfie_url && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-light-text-secondary dark:text-dark-text-secondary mb-2">
                <Camera className="w-4 h-4" />
                <h3 className="font-semibold">الصورة الشخصية</h3>
              </div>
              <div className="relative group">
                <img
                  src={submission.selfie_url}
                  alt="Selfie"
                  className="w-full h-64 object-contain rounded-xl border-2 border-light-border dark:border-dark-border hover:border-lime-accent transition-colors cursor-pointer bg-light-base dark:bg-dark-base"
                  onClick={() => window.open(submission.selfie_url!, '_blank')}
                  onError={(e) => {
                    console.error('Error loading selfie image');
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EError%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl pointer-events-none" />
              </div>
            </div>
          )}

          <div className="bg-light-base dark:bg-dark-base rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">معرف المستخدم</p>
                <p className="text-sm font-mono text-light-text dark:text-dark-text">{submission.user_id}</p>
              </div>
              <div>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">تاريخ التقديم</p>
                <p className="text-sm text-light-text dark:text-dark-text">
                  {new Date(submission.submission_date).toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">الحالة الحالية</p>
                <p className="text-sm font-semibold text-light-text dark:text-dark-text">{submission.status}</p>
              </div>
              {submission.reviewed_by && (
                <div>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">راجعه</p>
                  <p className="text-sm font-mono text-light-text dark:text-dark-text">
                    {submission.reviewed_by.substring(0, 12)}...
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-light-text dark:text-dark-text">
              ملاحظات المراجعة
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent resize-none"
              placeholder="أضف ملاحظاتك هنا..."
            />
          </div>

          <AnimatePresence>
            {selectedAction === 'reject' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <label className="block text-sm font-semibold text-red-600 dark:text-red-400">
                  سبب الرفض *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  placeholder="اشرح السبب بالتفصيل حتى يتمكن المستخدم من تصحيح الأخطاء..."
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="sticky bottom-0 bg-light-surface dark:bg-dark-surface border-t border-light-border dark:border-dark-border p-6 rounded-b-3xl">
          <div className="flex flex-wrap gap-3">
            {submission.status === 'pending' && (
              <button
                onClick={handleMarkUnderReview}
                disabled={updating}
                className="flex-1 sm:flex-none px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updating ? <Loader className="w-5 h-5 animate-spin" /> : <AlertTriangle className="w-5 h-5" />}
                وضع قيد المراجعة
              </button>
            )}

            {submission.status !== 'approved' && (
              <button
                onClick={() => {
                  if (selectedAction === 'approve') {
                    handleApprove();
                  } else {
                    setSelectedAction('approve');
                  }
                }}
                disabled={updating}
                className="flex-1 sm:flex-none px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updating && selectedAction === 'approve' ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                {selectedAction === 'approve' ? 'تأكيد الموافقة' : 'الموافقة'}
              </button>
            )}

            {submission.status !== 'rejected' && (
              <button
                onClick={() => {
                  if (selectedAction === 'reject') {
                    handleReject();
                  } else {
                    setSelectedAction('reject');
                  }
                }}
                disabled={updating}
                className="flex-1 sm:flex-none px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updating && selectedAction === 'reject' ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                {selectedAction === 'reject' ? 'تأكيد الرفض' : 'رفض'}
              </button>
            )}

            <button
              onClick={onClose}
              disabled={updating}
              className="flex-1 sm:flex-none px-6 py-3 bg-light-base dark:bg-dark-base text-light-text dark:text-dark-text rounded-xl font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              إغلاق
            </button>
          </div>

          {selectedAction && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-center mt-4"
            >
              {selectedAction === 'approve'
                ? 'انقر مرة أخرى للتأكيد'
                : 'يرجى كتابة سبب الرفض ثم النقر مرة أخرى للتأكيد'}
            </motion.p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
