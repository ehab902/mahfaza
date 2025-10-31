import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, AlertTriangle, Upload } from 'lucide-react';
import { KYCSubmission } from '../hooks/useKYCSubmission';

interface KYCStatusProps {
  submission: KYCSubmission | null;
  onUpload?: () => void;
  compact?: boolean;
}

export function KYCStatus({ submission, onUpload, compact = false }: KYCStatusProps) {
  if (!submission) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30 rounded-2xl p-${
          compact ? '4' : '6'
        } backdrop-blur-sm`}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Upload className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-light-text dark:text-dark-text mb-2">
              التحقق من الهوية مطلوب
            </h3>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">
              للوصول الكامل لجميع ميزات المنصة، يرجى إكمال عملية التحقق من الهوية (KYC).
            </p>
            {onUpload && (
              <button
                onClick={onUpload}
                className="px-6 py-2.5 bg-lime-accent text-dark-text rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                ابدأ التحقق الآن
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  const statusConfig = {
    pending: {
      icon: Clock,
      title: 'قيد الانتظار',
      description: 'تم استلام طلبك بنجاح. سيتم مراجعته قريباً.',
      color: 'blue',
      bgGradient: 'from-blue-500/10 to-cyan-500/10',
      borderColor: 'border-blue-500/30',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    under_review: {
      icon: AlertTriangle,
      title: 'قيد المراجعة',
      description: 'فريقنا يقوم الآن بمراجعة مستنداتك.',
      color: 'amber',
      bgGradient: 'from-amber-500/10 to-yellow-500/10',
      borderColor: 'border-amber-500/30',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-600 dark:text-amber-400'
    },
    approved: {
      icon: CheckCircle,
      title: 'تم التحقق بنجاح',
      description: 'تم التحقق من هويتك بنجاح. يمكنك الآن الوصول لجميع الميزات.',
      color: 'green',
      bgGradient: 'from-green-500/10 to-emerald-500/10',
      borderColor: 'border-green-500/30',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    rejected: {
      icon: XCircle,
      title: 'تم الرفض',
      description: 'للأسف، لم يتم قبول المستندات المقدمة.',
      color: 'red',
      bgGradient: 'from-red-500/10 to-rose-500/10',
      borderColor: 'border-red-500/30',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-600 dark:text-red-400'
    }
  };

  const config = statusConfig[submission.status];
  const Icon = config.icon;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-gradient-to-br ${config.bgGradient} border ${config.borderColor} rounded-xl p-3 backdrop-blur-sm`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 ${config.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-4 h-4 ${config.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-light-text dark:text-dark-text truncate">
              {config.title}
            </p>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary truncate">
              {config.description}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${config.bgGradient} border-2 ${config.borderColor} rounded-2xl p-6 backdrop-blur-sm`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 ${config.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-7 h-7 ${config.iconColor}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-light-text dark:text-dark-text mb-2">
            {config.title}
          </h3>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">
            {config.description}
          </p>

          {submission.status === 'pending' && (
            <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4">
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                <strong>تاريخ التقديم:</strong>{' '}
                {new Date(submission.submission_date).toLocaleDateString('ar-SA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          )}

          {submission.status === 'under_review' && (
            <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4">
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                عادةً ما تستغرق عملية المراجعة 24-48 ساعة. سنرسل لك إشعاراً عند اكتمال المراجعة.
              </p>
            </div>
          )}

          {submission.status === 'approved' && (
            <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle className="w-5 h-5" />
                <p className="text-sm font-medium">
                  تم التحقق في:{' '}
                  {submission.reviewed_at &&
                    new Date(submission.reviewed_at).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                </p>
              </div>
            </div>
          )}

          {submission.status === 'rejected' && (
            <div className="space-y-3">
              <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-xl p-5">
                <div className="flex items-start gap-3 mb-3">
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-base font-bold text-red-800 dark:text-red-200 mb-2">
                      سبب الرفض:
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                      {submission.rejection_reason || 'لم يتم تقديم سبب محدد'}
                    </p>
                  </div>
                </div>
                {submission.admin_notes && (
                  <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
                    <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                      ملاحظات إضافية من فريق المراجعة:
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                      {submission.admin_notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>ماذا يجب أن أفعل؟</strong>
                  <br />
                  يرجى قراءة سبب الرفض بعناية وإعادة رفع المستندات بعد تصحيح الأخطاء.
                </p>
              </div>

              {onUpload && (
                <button
                  onClick={onUpload}
                  className="w-full px-6 py-3 bg-gradient-to-r from-lime-accent to-lime-500 text-dark-text rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  إعادة التقديم الآن
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
