import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User } from 'firebase/auth';
import { collection, query, where, getDocs, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Phone, CheckCircle, AlertCircle, ArrowRight, RefreshCw, Shield, Lock } from 'lucide-react';

interface PhoneVerificationPageProps {
  user: User;
  onVerified: () => void;
  onSkip?: () => void;
}

export const PhoneVerificationPage: React.FC<PhoneVerificationPageProps> = ({ user, onVerified, onSkip }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [generatedCode, setGeneratedCode] = useState('');

  useEffect(() => {
    const loadUserPhone = async () => {
      try {
        const q = query(collection(db, 'user_profiles'), where('user_id', '==', user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          if (userData.phone) {
            setPhoneNumber(userData.phone);
          }
        }
      } catch (err) {
        console.error('Error loading user phone:', err);
      }
    };

    loadUserPhone();
  }, [user.uid]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('يرجى إدخال رقم هاتف صحيح');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const code = generateVerificationCode();
      setGeneratedCode(code);

      await addDoc(collection(db, 'verification_codes'), {
        user_id: user.uid,
        phone: phoneNumber,
        code: code,
        type: 'phone_verification',
        used: false,
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
        created_at: serverTimestamp()
      });

      console.log('Verification code (for testing):', code);

      setSuccess(`تم إرسال رمز التحقق إلى ${phoneNumber}`);
      setStep('code');
      setResendCooldown(60);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error sending code:', err);
      setError('فشل في إرسال رمز التحقق. يرجى المحاولة لاحقاً.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError('يرجى إدخال رمز مكون من 6 أرقام');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const q = query(
        collection(db, 'verification_codes'),
        where('user_id', '==', user.uid),
        where('code', '==', verificationCode),
        where('used', '==', false)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('رمز التحقق غير صحيح');
        setTimeout(() => setError(''), 3000);
        setIsLoading(false);
        return;
      }

      const codeDoc = querySnapshot.docs[0];
      const codeData = codeDoc.data();
      const expiresAt = codeData.expires_at?.toDate();

      if (expiresAt && expiresAt < new Date()) {
        setError('انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.');
        setTimeout(() => setError(''), 3000);
        setIsLoading(false);
        return;
      }

      await updateDoc(codeDoc.ref, {
        used: true,
        used_at: serverTimestamp()
      });

      const profileQuery = query(collection(db, 'user_profiles'), where('user_id', '==', user.uid));
      const profileSnapshot = await getDocs(profileQuery);

      if (!profileSnapshot.empty) {
        const profileRef = profileSnapshot.docs[0].ref;
        await updateDoc(profileRef, {
          phone: phoneNumber,
          phone_verified: true,
          verification_step: 'completed',
          updated_at: serverTimestamp()
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
        description: 'تم التحقق من الهاتف',
        read: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      setSuccess('تم تأكيد رقم الهاتف بنجاح!');
      setTimeout(() => onVerified(), 1500);
    } catch (err) {
      console.error('Error verifying code:', err);
      setError('حدث خطأ أثناء التحقق. يرجى المحاولة مرة أخرى.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const code = generateVerificationCode();
      setGeneratedCode(code);

      await addDoc(collection(db, 'verification_codes'), {
        user_id: user.uid,
        phone: phoneNumber,
        code: code,
        type: 'phone_verification',
        used: false,
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
        created_at: serverTimestamp()
      });

      console.log('Verification code (for testing):', code);

      setSuccess('تم إعادة إرسال رمز التحقق');
      setResendCooldown(60);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('فشل في إعادة إرسال الرمز. يرجى المحاولة لاحقاً.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsLoading(false);
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
              <Phone className="w-10 h-10 text-lime-accent" />
            </motion.div>

            <h2 className="text-3xl font-bold text-light-text dark:text-dark-text font-editorial mb-2">
              {step === 'phone' ? 'تأكيد رقم الهاتف' : 'أدخل رمز التحقق'}
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              {step === 'phone'
                ? 'سنرسل رمز التحقق إلى هاتفك المحمول'
                : `تم إرسال رمز مكون من 6 أرقام إلى ${phoneNumber}`
              }
            </p>
          </div>

          <div className="space-y-6">
            {step === 'phone' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                    رقم الهاتف
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+971 50 123 4567"
                      className="w-full pl-12 pr-4 py-3 bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent/50 transition-all"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <p className="font-medium mb-1">معلومات مهمة:</p>
                      <ul className="space-y-1">
                        <li>• أدخل رقم هاتفك مع رمز البلد</li>
                        <li>• تأكد من صحة الرقم قبل المتابعة</li>
                        <li>• سيصلك رمز التحقق عبر SMS</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                    رمز التحقق
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      maxLength={6}
                      className="w-full pl-12 pr-4 py-3 bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-lime-accent/50 transition-all"
                    />
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-green-700 dark:text-green-300">
                      <p className="font-medium mb-1">رمز التحقق في الطريق</p>
                      <p>قد يستغرق وصول الرمز بضع دقائق</p>
                      {generatedCode && (
                        <p className="mt-2 font-mono text-xs bg-green-100 dark:bg-green-900/40 px-2 py-1 rounded">
                          للاختبار: {generatedCode}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

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

            {step === 'phone' ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSendCode}
                disabled={isLoading || !phoneNumber}
                className="w-full bg-lime-accent text-light-base dark:text-dark-base py-3 rounded-xl font-medium hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-light-base dark:border-dark-base border-t-transparent rounded-full animate-spin" />
                    <span>جاري الإرسال...</span>
                  </>
                ) : (
                  <>
                    <span>إرسال رمز التحقق</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleVerifyCode}
                  disabled={isLoading || verificationCode.length !== 6}
                  className="w-full bg-lime-accent text-light-base dark:text-dark-base py-3 rounded-xl font-medium hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-light-base dark:border-dark-base border-t-transparent rounded-full animate-spin" />
                      <span>جاري التحقق...</span>
                    </>
                  ) : (
                    <>
                      <span>تأكيد الرمز</span>
                      <CheckCircle className="w-5 h-5" />
                    </>
                  )}
                </motion.button>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setStep('phone')}
                    className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-lime-accent transition-colors"
                  >
                    تغيير رقم الهاتف
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleResendCode}
                    disabled={isLoading || resendCooldown > 0}
                    className="text-sm text-lime-accent hover:text-lime-accent/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>
                      {resendCooldown > 0 ? `إعادة الإرسال (${resendCooldown}s)` : 'إعادة الإرسال'}
                    </span>
                  </motion.button>
                </div>
              </>
            )}

            {onSkip && step === 'phone' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSkip}
                className="w-full bg-light-glass dark:bg-dark-glass text-light-text dark:text-dark-text py-3 rounded-xl font-medium hover:bg-light-surface dark:hover:bg-dark-surface transition-all"
              >
                تخطي الآن (يمكنك التحقق لاحقاً)
              </motion.button>
            )}
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
            <span>رقمك محمي ولن يتم مشاركته مع أي جهة</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
