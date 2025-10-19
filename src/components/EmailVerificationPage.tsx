import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { sendEmailVerification, User } from 'firebase/auth';
import { collection, query, where, getDocs, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Mail, CheckCircle, AlertCircle, ArrowRight, RefreshCw, Shield } from 'lucide-react';

interface EmailVerificationPageProps {
  user: User;
  onVerified: () => void;
}

export const EmailVerificationPage: React.FC<EmailVerificationPageProps> = ({ user, onVerified }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const notificationSentRef = useRef(false);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    const checkEmailVerified = async () => {
      try {
        await user.reload();
        if (user.emailVerified && !notificationSentRef.current) {
          notificationSentRef.current = true;
          try {
            const q = query(collection(db, 'user_profiles'), where('user_id', '==', user.uid));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              const docRef = querySnapshot.docs[0].ref;
              await updateDoc(docRef, {
                email_verified: true,
                verification_step: 'completed',
                updated_at: new Date()
              });
            }

            const accountQuery = query(collection(db, 'bank_accounts'), where('user_id', '==', user.uid));
            const accountSnapshot = await getDocs(accountQuery);

            if (!accountSnapshot.empty) {
              const accountRef = accountSnapshot.docs[0].ref;
              await updateDoc(accountRef, {
                status: 'Active',
                updated_at: serverTimestamp()
              });
            }

            await addDoc(collection(db, 'notifications'), {
              user_id: user.uid,
              type: 'success',
              title: 'تم تفعيل حسابك بنجاح!',
              message: 'يمكنك الآن استخدام جميع خدمات TradeHub المصرفية.',
              description: 'تم التحقق من البريد الإلكتروني',
              read: false,
              created_at: serverTimestamp(),
              updated_at: serverTimestamp()
            });
          } catch (err) {
            console.error('Error updating profile:', err);
          }
          onVerified();
        }
      } catch (err) {
        console.error('Error reloading user:', err);
      }
    };

    const interval = setInterval(checkEmailVerified, 3000);
    return () => clearInterval(interval);
  }, [user, onVerified]);

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await sendEmailVerification(user, {
        url: window.location.origin,
        handleCodeInApp: false
      });
      setSuccess('تم إعادة إرسال رابط التحقق بنجاح!');
      setResendCooldown(60);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      let errorMessage = 'فشل في إرسال البريد. يرجى المحاولة لاحقاً.';

      if (err.code === 'auth/too-many-requests') {
        errorMessage = 'تم إرسال عدد كبير من الطلبات. يرجى المحاولة بعد قليل.';
      }

      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsChecking(true);
    setError('');
    setSuccess('');

    try {
      await user.reload();

      if (user.emailVerified) {
        if (!notificationSentRef.current) {
          notificationSentRef.current = true;
          try {
            const q = query(collection(db, 'user_profiles'), where('user_id', '==', user.uid));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              const docRef = querySnapshot.docs[0].ref;
              await updateDoc(docRef, {
                email_verified: true,
                verification_step: 'completed',
                updated_at: new Date()
              });
            }

            const accountQuery = query(collection(db, 'bank_accounts'), where('user_id', '==', user.uid));
            const accountSnapshot = await getDocs(accountQuery);

            if (!accountSnapshot.empty) {
              const accountRef = accountSnapshot.docs[0].ref;
              await updateDoc(accountRef, {
                status: 'Active',
                updated_at: serverTimestamp()
              });
            }

            await addDoc(collection(db, 'notifications'), {
              user_id: user.uid,
              type: 'success',
              title: 'تم تفعيل حسابك بنجاح!',
              message: 'يمكنك الآن استخدام جميع خدمات TradeHub المصرفية.',
              description: 'تم التحقق من البريد الإلكتروني',
              read: false,
              created_at: serverTimestamp(),
              updated_at: serverTimestamp()
            });
          } catch (err) {
            console.error('Error updating profile:', err);
          }
        }

        setSuccess('تم تأكيد البريد الإلكتروني بنجاح!');
        setTimeout(() => onVerified(), 1500);
      } else {
        setError('لم يتم تأكيد البريد الإلكتروني بعد. يرجى التحقق من بريدك.');
        setTimeout(() => setError(''), 5000);
      }
    } catch (err) {
      setError('حدث خطأ أثناء التحقق. يرجى المحاولة مرة أخرى.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-base via-light-surface to-light-glass dark:from-dark-base dark:via-dark-surface dark:to-dark-glass flex items-center justify-center p-4 transition-colors duration-300">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-lime-accent/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-lime-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-light-surface/80 dark:bg-dark-surface/80 backdrop-blur-glass border border-light-border dark:border-dark-border rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 mx-auto mb-6 bg-lime-accent/20 rounded-full flex items-center justify-center"
            >
              <Mail className="w-10 h-10 text-lime-accent" />
            </motion.div>

            <h2 className="text-3xl font-bold text-light-text dark:text-dark-text font-editorial mb-2">
              تأكيد البريد الإلكتروني
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              تم إرسال رابط التحقق إلى بريدك الإلكتروني
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-2">يرجى اتباع الخطوات التالية:</p>
                  <ul className="space-y-1">
                    <li>• افتح بريدك الإلكتروني: <span className="font-medium">{user.email}</span></li>
                    <li>• ابحث عن رسالة من TradeHub Bank</li>
                    <li>• انقر على رابط التأكيد في الرسالة</li>
                    <li>• عد إلى هذه الصفحة واضغط على "تحقق الآن"</li>
                  </ul>
                </div>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center space-x-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="text-sm text-red-400">{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center space-x-3"
              >
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-sm text-green-400">{success}</span>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCheckVerification}
              disabled={isChecking}
              className="w-full bg-lime-accent text-light-base dark:text-dark-base py-3 rounded-xl font-medium hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isChecking ? (
                <>
                  <div className="w-5 h-5 border-2 border-light-base dark:border-dark-base border-t-transparent rounded-full animate-spin" />
                  <span>جاري التحقق...</span>
                </>
              ) : (
                <>
                  <span>تحقق الآن</span>
                  <CheckCircle className="w-5 h-5" />
                </>
              )}
            </motion.button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-light-border dark:border-dark-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-light-surface dark:bg-dark-surface text-light-text-secondary dark:text-dark-text-secondary">
                  لم تستلم البريد؟
                </span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleResendEmail}
              disabled={isLoading || resendCooldown > 0}
              className="w-full bg-light-glass dark:bg-dark-glass text-light-text dark:text-dark-text py-3 rounded-xl font-medium hover:bg-light-surface dark:hover:bg-dark-surface transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-light-text dark:border-dark-text border-t-transparent rounded-full animate-spin" />
                  <span>جاري الإرسال...</span>
                </>
              ) : resendCooldown > 0 ? (
                <span>إعادة الإرسال بعد {resendCooldown} ثانية</span>
              ) : (
                <>
                  <span>إعادة إرسال البريد</span>
                  <RefreshCw className="w-5 h-5" />
                </>
              )}
            </motion.button>

            <div className="text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">
              <p>تحقق من مجلد الرسائل غير المرغوب فيها (Spam)</p>
              <p className="mt-1">إذا واجهتك مشكلة، تواصل مع الدعم الفني</p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <div className="flex items-center justify-center space-x-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
            <Shield className="w-4 h-4 text-lime-accent" />
            <span>بياناتك محمية بتشفير عالي المستوى</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
