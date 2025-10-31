import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Shield, CheckCircle, Clock } from 'lucide-react';

interface KYCBlockedOverlayProps {
  onVerify: () => void;
  feature?: string;
  status?: 'none' | 'pending' | 'under_review' | 'rejected';
}

export function KYCBlockedOverlay({ onVerify, feature = 'هذه الميزة', status = 'none' }: KYCBlockedOverlayProps) {
  const isUnderReview = status === 'pending' || status === 'under_review';
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 bg-light-surface/95 dark:bg-dark-surface/95 backdrop-blur-md rounded-2xl z-40 flex items-center justify-center p-6"
    >
      <div className="max-w-md text-center space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          className="w-16 h-16 bg-gradient-to-br from-lime-accent to-lime-600 rounded-full flex items-center justify-center mx-auto shadow-xl"
        >
          <Lock className="w-7 h-7 text-dark-text" />
        </motion.div>

        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-light-text dark:text-dark-text">
            {isUnderReview ? 'قيد المراجعة' : 'التحقق من الهوية مطلوب'}
          </h3>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            {isUnderReview
              ? `تم استلام طلبك بنجاح. فريقنا يقوم بمراجعة مستنداتك. سيتم فتح ${feature} فور الموافقة على طلبك.`
              : `للوصول إلى ${feature}، يجب عليك إكمال عملية التحقق من الهوية (KYC)`
            }
          </p>
        </div>

        <div className="bg-light-base dark:bg-dark-base rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3 text-right">
            <CheckCircle className="w-5 h-5 text-lime-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-light-text dark:text-dark-text text-sm">
                عملية سريعة وآمنة
              </p>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                تستغرق أقل من 5 دقائق
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-right">
            <Shield className="w-5 h-5 text-lime-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-light-text dark:text-dark-text text-sm">
                حماية معلوماتك
              </p>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                جميع بياناتك محمية ومشفرة
              </p>
            </div>
          </div>
        </div>

        {isUnderReview ? (
          <div className="w-full px-8 py-4 bg-blue-500/20 text-blue-400 border-2 border-blue-500/30 rounded-xl font-bold text-lg flex items-center justify-center gap-3 cursor-not-allowed">
            <Clock className="w-6 h-6 animate-pulse" />
            قيد المراجعة
          </div>
        ) : (
          <button
            onClick={onVerify}
            className="w-full px-8 py-4 bg-gradient-to-r from-lime-accent to-lime-500 text-dark-text rounded-xl font-bold text-lg hover:opacity-90 transition-all transform hover:scale-105 shadow-lg"
          >
            ابدأ التحقق الآن
          </button>
        )}

        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
          {isUnderReview
            ? 'سيتم إشعارك فور الانتهاء من المراجعة'
            : 'سيتم مراجعة طلبك خلال 24-48 ساعة'
          }
        </p>
      </div>
    </motion.div>
  );
}
