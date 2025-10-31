import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Clock } from 'lucide-react';

interface KYCVerificationBannerProps {
  onVerify: () => void;
  status?: 'none' | 'pending' | 'under_review' | 'rejected';
}

export function KYCVerificationBanner({ onVerify, status = 'none' }: KYCVerificationBannerProps) {
  const isUnderReview = status === 'pending' || status === 'under_review';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r ${
        isUnderReview
          ? 'from-blue-500 to-cyan-500'
          : 'from-amber-500 to-orange-500'
      } text-white rounded-2xl p-4 shadow-lg mb-6`}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
          <Shield className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {isUnderReview ? <Clock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            <h3 className="font-bold text-lg">
              {isUnderReview ? 'قيد المراجعة' : 'أكمل التحقق من الهوية'}
            </h3>
          </div>
          <p className="text-sm text-white/90">
            {isUnderReview
              ? 'تم استلام طلبك بنجاح. فريقنا يقوم بمراجعة مستنداتك وسيتم إشعارك بالنتيجة قريباً.'
              : 'للوصول الكامل لجميع الميزات والخدمات، يرجى إكمال عملية التحقق من الهوية (KYC)'
            }
          </p>
        </div>
        {isUnderReview ? (
          <div className="px-6 py-3 bg-white/20 text-white rounded-xl font-bold whitespace-nowrap cursor-not-allowed">
            قيد المراجعة
          </div>
        ) : (
          <button
            onClick={onVerify}
            className="px-6 py-3 bg-white text-orange-600 rounded-xl font-bold hover:bg-white/90 transition-all transform hover:scale-105 whitespace-nowrap"
          >
            تحقق الآن
          </button>
        )}
      </div>
    </motion.div>
  );
}
