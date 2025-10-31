import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, AuthError } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Mail, Lock, User, Eye, EyeOff, Building2, Phone, MapPin, CheckCircle, AlertCircle, ArrowRight, Shield, Globe, Zap } from 'lucide-react';

interface AuthPageProps {}

interface LoginForm {
  email: string;
  password: string;
}

interface SignupForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  country: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

interface FormErrors {
  [key: string]: string;
}

export const AuthPage: React.FC<AuthPageProps> = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: '',
    password: ''
  });

  const [signupForm, setSignupForm] = useState<SignupForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    country: 'UAE',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const validateLoginForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!loginForm.email) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!validateEmail(loginForm.email)) {
      newErrors.email = 'تنسيق البريد الإلكتروني غير صحيح';
    }

    if (!loginForm.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignupForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!signupForm.firstName) {
      newErrors.firstName = 'الاسم الأول مطلوب';
    }

    if (!signupForm.lastName) {
      newErrors.lastName = 'الاسم الأخير مطلوب';
    }

    if (!signupForm.email) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!validateEmail(signupForm.email)) {
      newErrors.email = 'تنسيق البريد الإلكتروني غير صحيح';
    }

    if (!signupForm.phone) {
      newErrors.phone = 'رقم الهاتف مطلوب';
    }

    if (!signupForm.company) {
      newErrors.company = 'اسم الشركة مطلوب';
    }

    if (!signupForm.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (!validatePassword(signupForm.password)) {
      newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    }

    if (!signupForm.confirmPassword) {
      newErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
    } else if (signupForm.password !== signupForm.confirmPassword) {
      newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
    }

    if (!signupForm.acceptTerms) {
      newErrors.acceptTerms = 'يجب الموافقة على الشروط والأحكام';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateLoginForm()) return;

    setIsLoading(true);
    setErrors({});
    
    try {
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
      // Firebase will automatically update the auth state, no need to call onLogin
    } catch (error) {
      const authError = error as AuthError;
      let errorMessage = 'خطأ في تسجيل الدخول. يرجى المحاولة مرة أخرى.';
      
      switch (authError.code) {
        case 'auth/user-not-found':
          errorMessage = 'لا يوجد حساب مسجل بهذا البريد الإلكتروني.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'كلمة المرور غير صحيحة.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'تنسيق البريد الإلكتروني غير صحيح.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'تم تعطيل هذا الحساب. يرجى التواصل مع الدعم.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'تم تجاوز عدد المحاولات المسموح. يرجى المحاولة لاحقاً.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'خطأ في الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت.';
          break;
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSignupForm()) return;

    setIsLoading(true);
    setErrors({});
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signupForm.email, signupForm.password);
      
      console.log('User created successfully:', userCredential.user);

      try {
        await sendEmailVerification(userCredential.user, {
          url: window.location.origin,
          handleCodeInApp: false
        });
        console.log('Email verification sent successfully');
      } catch (emailError) {
        console.error('Error sending verification email:', emailError);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // إنشاء الملف الشخصي في Firestore
      try {
        await addDoc(collection(db, 'user_profiles'), {
          user_id: userCredential.user.uid,
          first_name: signupForm.firstName,
          last_name: signupForm.lastName,
          email: signupForm.email,
          phone: signupForm.phone,
          company: signupForm.company,
          country: signupForm.country,
          language: 'ar',
          email_verified: false,
          phone_verified: true,
          verification_step: 'email',
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
        console.log('User profile created successfully');
      } catch (profileError) {
        console.error('Error creating user profile:', profileError);
        // لا نوقف العملية إذا فشل إنشاء الملف الشخصي
      }

      // إنشاء الحساب المصرفي في Firestore
      try {
        const accountNumber = Math.floor(Math.random() * 9999999999).toString().padStart(10, '0');
        const iban = 'ES91' + '2100' + '0418' + '45' + accountNumber;
        const balance = 0;

        await addDoc(collection(db, 'bank_accounts'), {
          user_id: userCredential.user.uid,
          account_number: accountNumber,
          iban: iban,
          swift_code: 'CAIXESBBXXX',
          bank_name: 'TradeHub Bank',
          account_type: 'Business Current Account',
          balance: balance,
          currency: 'EUR',
          status: 'Pending',
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
        console.log('Bank account created successfully');
      } catch (accountError) {
        console.error('Error creating bank account:', accountError);
        // لا نوقف العملية إذا فشل إنشاء الحساب المصرفي
      }

      // إنشاء الإعدادات الافتراضية في Firestore
      try {
        await addDoc(collection(db, 'user_settings'), {
          user_id: userCredential.user.uid,
          email_notifications: true,
          sms_notifications: true,
          push_notifications: false,
          login_alerts: false,
          two_factor_enabled: false,
          device_tracking: true,
          session_timeout: 30,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
        console.log('User settings created successfully');
      } catch (settingsError) {
        console.error('Error creating user settings:', settingsError);
        // لا نوقف العملية إذا فشلت الإعدادات
      }

      // إنشاء إشعار ترحيب في Firestore
      try {
        await addDoc(collection(db, 'notifications'), {
          user_id: userCredential.user.uid,
          type: 'info',
          title: 'مرحباً بك في TradeHub!',
          message: 'يرجى تأكيد بريدك الإلكتروني ورقم هاتفك لتفعيل حسابك بالكامل.',
          description: 'حساب جديد تم إنشاؤه',
          read: false,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
        console.log('Welcome notification created successfully');
      } catch (notificationError) {
        console.error('Error creating welcome notification:', notificationError);
        // لا نوقف العملية إذا فشل إنشاء الإشعار
      }
      
      // Firebase will automatically update the auth state, no need to call onLogin
    } catch (error) {
      const authError = error as AuthError;
      let errorMessage = 'خطأ في إنشاء الحساب. يرجى المحاولة مرة أخرى.';
      
      switch (authError.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'تنسيق البريد الإلكتروني غير صحيح.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'تسجيل الحسابات الجديدة غير مفعل حالياً.';
          break;
        case 'auth/weak-password':
          errorMessage = 'كلمة المرور ضعيفة جداً. يرجى اختيار كلمة مرور أقوى.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'خطأ في الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'تم تجاوز عدد المحاولات المسموح. يرجى المحاولة لاحقاً.';
          break;
        case 'auth/internal-error':
          errorMessage = 'خطأ داخلي في الخدمة. يرجى المحاولة لاحقاً.';
          break;
      }
      
      console.error('Firebase Auth Error:', authError);
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const updateLoginForm = (field: keyof LoginForm, value: string) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateSignupForm = (field: keyof SignupForm, value: string | boolean) => {
    setSignupForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail) {
      setErrors({ forgotPassword: 'البريد الإلكتروني مطلوب' });
      return;
    }
    
    if (!validateEmail(forgotPasswordEmail)) {
      setErrors({ forgotPassword: 'تنسيق البريد الإلكتروني غير صحيح' });
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      await sendPasswordResetEmail(auth, forgotPasswordEmail);
      setResetEmailSent(true);
    } catch (error) {
      const authError = error as AuthError;
      let errorMessage = 'خطأ في إرسال رابط إعادة تعيين كلمة المرور. يرجى المحاولة مرة أخرى.';
      
      switch (authError.code) {
        case 'auth/user-not-found':
          errorMessage = 'لا يوجد حساب مسجل بهذا البريد الإلكتروني.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'تنسيق البريد الإلكتروني غير صحيح.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'تم تجاوز عدد المحاولات المسموح. يرجى المحاولة لاحقاً.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'خطأ في الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت.';
          break;
      }
      
      setErrors({ forgotPassword: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setResetEmailSent(false);
    setForgotPasswordEmail('');
    setErrors({});
  };

  const features = [
    {
      icon: Shield,
      title: 'أمان متقدم',
      description: 'حماية بنكية عالية المستوى'
    },
    {
      icon: Globe,
      title: 'تحويلات دولية',
      description: 'تحويل الأموال حول العالم'
    },
    {
      icon: Zap,
      title: 'معاملات فورية',
      description: 'تنفيذ سريع للعمليات'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-base via-light-surface to-light-glass dark:from-dark-base dark:via-dark-surface dark:to-dark-glass flex items-center justify-center p-4 transition-colors duration-300">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-lime-accent/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-lime-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-lime-accent/3 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
        {/* Left Side - Branding & Features */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center lg:text-right space-y-8"
        >
          {/* Logo & Title */}
          <div className="space-y-4">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center justify-center lg:justify-end space-x-3"
            >
              <div className="w-12 h-12 bg-lime-accent rounded-xl flex items-center justify-center shadow-glow">
                <Building2 className="w-7 h-7 text-light-base dark:text-dark-base" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-lime-accent font-editorial">TradeHub</h1>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">منصة التمويل التجاري</p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-2"
            >
              <h2 className="text-2xl lg:text-4xl font-bold text-light-text dark:text-dark-text font-editorial">
                مرحباً بك في المستقبل
              </h2>
              <p className="text-lg text-light-text-secondary dark:text-dark-text-secondary">
                حلول مصرفية متطورة للأعمال التجارية
              </p>
            </motion.div>
          </div>

          {/* Features */}
          <div className="space-y-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                className="flex items-center space-x-4 lg:justify-end"
              >
                <div className="text-right">
                  <h3 className="font-medium text-light-text dark:text-dark-text">{feature.title}</h3>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{feature.description}</p>
                </div>
                <div className="p-3 bg-lime-accent/10 rounded-xl">
                  <feature.icon className="w-6 h-6 text-lime-accent" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="flex items-center justify-center lg:justify-end space-x-6 text-sm text-light-text-secondary dark:text-dark-text-secondary"
          >
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-lime-accent" />
              <span>مرخص من المصرف المركزي</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-lime-accent" />
              <span>آمن ومشفر</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Side - Auth Forms */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="bg-light-surface/80 dark:bg-dark-surface/80 backdrop-blur-glass border border-light-border dark:border-dark-border rounded-2xl p-8 shadow-2xl">
            {/* Tabs */}
            <div className="flex bg-light-glass dark:bg-dark-glass rounded-xl p-1 mb-8">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  activeTab === 'login'
                    ? 'bg-lime-accent text-light-base dark:text-dark-base shadow-md'
                    : 'text-light-text dark:text-dark-text hover:bg-light-surface dark:hover:bg-dark-surface'
                }`}
              >
                تسجيل الدخول
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('signup')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  activeTab === 'signup'
                    ? 'bg-lime-accent text-light-base dark:text-dark-base shadow-md'
                    : 'text-light-text dark:text-dark-text hover:bg-light-surface dark:hover:bg-dark-surface'
                }`}
              >
                إنشاء حساب
              </motion.button>
            </div>

            {/* Error Message */}
            {(errors.general || errors.forgotPassword) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-sm text-red-400">{errors.general || errors.forgotPassword}</span>
              </motion.div>
            )}

            {/* Success Message for Password Reset */}
            {resetEmailSent && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center space-x-3"
              >
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div className="text-sm text-green-400">
                  <p className="font-medium">تم إرسال رابط إعادة تعيين كلمة المرور!</p>
                  <p className="mt-1">يرجى التحقق من بريدك الإلكتروني واتباع التعليمات.</p>
                </div>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {showForgotPassword ? (
                <motion.form
                  key="forgot-password"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleForgotPassword}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial mb-2">
                      نسيت كلمة المرور؟
                    </h3>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                      البريد الإلكتروني
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                      <input
                        type="email"
                        value={forgotPasswordEmail}
                        onChange={(e) => {
                          setForgotPasswordEmail(e.target.value);
                          if (errors.forgotPassword) {
                            setErrors(prev => ({ ...prev, forgotPassword: '' }));
                          }
                        }}
                        className={`w-full pl-12 pr-4 py-3 bg-light-glass dark:bg-dark-glass border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent/50 transition-all ${
                          errors.forgotPassword ? 'border-red-500' : 'border-light-border dark:border-dark-border'
                        }`}
                        placeholder="أدخل بريدك الإلكتروني"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isLoading || resetEmailSent}
                      className="w-full bg-lime-accent text-light-base dark:text-dark-base py-3 rounded-xl font-medium hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-light-base dark:border-dark-base border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>{resetEmailSent ? 'تم الإرسال' : 'إرسال رابط إعادة التعيين'}</span>
                          {!resetEmailSent && <ArrowRight className="w-5 h-5" />}
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleBackToLogin}
                      className="w-full bg-light-glass dark:bg-dark-glass text-light-text dark:text-dark-text py-3 rounded-xl font-medium hover:bg-light-surface dark:hover:bg-dark-surface transition-all"
                    >
                      العودة إلى تسجيل الدخول
                    </motion.button>
                  </div>
                </motion.form>
              ) : activeTab === 'login' ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleLogin}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                      البريد الإلكتروني
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                      <input
                        type="email"
                        value={loginForm.email}
                        onChange={(e) => updateLoginForm('email', e.target.value)}
                        className={`w-full pl-12 pr-4 py-3 bg-light-glass dark:bg-dark-glass border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent/50 transition-all ${
                          errors.email ? 'border-red-500' : 'border-light-border dark:border-dark-border'
                        }`}
                        placeholder="أدخل بريدك الإلكتروني"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                      كلمة المرور
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginForm.password}
                        onChange={(e) => updateLoginForm('password', e.target.value)}
                        className={`w-full pl-12 pr-12 py-3 bg-light-glass dark:bg-dark-glass border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent/50 transition-all ${
                          errors.password ? 'border-red-500' : 'border-light-border dark:border-dark-border'
                        }`}
                        placeholder="أدخل كلمة المرور"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary hover:text-lime-accent transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-lime-accent bg-light-glass dark:bg-dark-glass border-light-border dark:border-dark-border rounded focus:ring-lime-accent/50"
                      />
                      <span className="mr-2 text-sm text-light-text dark:text-dark-text">تذكرني</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-lime-accent hover:text-lime-accent/80 transition-colors"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-lime-accent text-light-base dark:text-dark-base py-3 rounded-xl font-medium hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-light-base dark:border-dark-base border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>تسجيل الدخول</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </motion.form>
              ) : (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSignup}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                        الاسم الأول
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                        <input
                          type="text"
                          value={signupForm.firstName}
                          onChange={(e) => updateSignupForm('firstName', e.target.value)}
                          className={`w-full pl-12 pr-4 py-3 bg-light-glass dark:bg-dark-glass border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent/50 transition-all ${
                            errors.firstName ? 'border-red-500' : 'border-light-border dark:border-dark-border'
                          }`}
                          placeholder="الاسم الأول"
                        />
                      </div>
                      {errors.firstName && (
                        <p className="mt-1 text-xs text-red-400">{errors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                        الاسم الأخير
                      </label>
                      <input
                        type="text"
                        value={signupForm.lastName}
                        onChange={(e) => updateSignupForm('lastName', e.target.value)}
                        className={`w-full px-4 py-3 bg-light-glass dark:bg-dark-glass border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent/50 transition-all ${
                          errors.lastName ? 'border-red-500' : 'border-light-border dark:border-dark-border'
                        }`}
                        placeholder="الاسم الأخير"
                      />
                      {errors.lastName && (
                        <p className="mt-1 text-xs text-red-400">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                      البريد الإلكتروني
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                      <input
                        type="email"
                        value={signupForm.email}
                        onChange={(e) => updateSignupForm('email', e.target.value)}
                        className={`w-full pl-12 pr-4 py-3 bg-light-glass dark:bg-dark-glass border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent/50 transition-all ${
                          errors.email ? 'border-red-500' : 'border-light-border dark:border-dark-border'
                        }`}
                        placeholder="أدخل بريدك الإلكتروني"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-400">{errors.email}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                        رقم الهاتف
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                        <input
                          type="tel"
                          value={signupForm.phone}
                          onChange={(e) => updateSignupForm('phone', e.target.value)}
                          className={`w-full pl-12 pr-4 py-3 bg-light-glass dark:bg-dark-glass border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent/50 transition-all ${
                            errors.phone ? 'border-red-500' : 'border-light-border dark:border-dark-border'
                          }`}
                          placeholder="+971 50 123 4567"
                        />
                      </div>
                      {errors.phone && (
                        <p className="mt-1 text-xs text-red-400">{errors.phone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                        الدولة
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                        <select
                          value={signupForm.country}
                          onChange={(e) => updateSignupForm('country', e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-accent/50 transition-all"
                        >
                          <optgroup label="دول الخليج العربي">
                            <option value="UAE">الإمارات العربية المتحدة</option>
                            <option value="SA">المملكة العربية السعودية</option>
                            <option value="QA">قطر</option>
                            <option value="KW">الكويت</option>
                            <option value="BH">البحرين</option>
                            <option value="OM">عمان</option>
                          </optgroup>
                          <optgroup label="دول عربية أخرى">
                            <option value="LB">لبنان</option>
                            <option value="SY">سوريا</option>
                            <option value="IQ">العراق</option>
                            <option value="EG">مصر</option>
                            <option value="JO">الأردن</option>
                            <option value="TN">تونس</option>
                            <option value="DZ">الجزائر</option>
                            <option value="MA">المغرب</option>
                            <option value="LY">ليبيا</option>
                          </optgroup>
                          <optgroup label="دول أخرى">
                            <option value="TR">تركيا</option>
                          </optgroup>
                          <optgroup label="الدول الأوروبية">
                            <option value="AL">ألبانيا</option>
                            <option value="AD">أندورا</option>
                            <option value="AT">النمسا</option>
                            <option value="BY">بيلاروسيا</option>
                            <option value="BE">بلجيكا</option>
                            <option value="BA">البوسنة والهرسك</option>
                            <option value="BG">بلغاريا</option>
                            <option value="HR">كرواتيا</option>
                            <option value="CY">قبرص</option>
                            <option value="CZ">التشيك</option>
                            <option value="DK">الدنمارك</option>
                            <option value="EE">إستونيا</option>
                            <option value="FI">فنلندا</option>
                            <option value="FR">فرنسا</option>
                            <option value="DE">ألمانيا</option>
                            <option value="GR">اليونان</option>
                            <option value="HU">المجر</option>
                            <option value="IS">أيسلندا</option>
                            <option value="IE">أيرلندا</option>
                            <option value="IT">إيطاليا</option>
                            <option value="XK">كوسوفو</option>
                            <option value="LV">لاتفيا</option>
                            <option value="LI">ليختنشتاين</option>
                            <option value="LT">ليتوانيا</option>
                            <option value="LU">لوكسمبورغ</option>
                            <option value="MT">مالطا</option>
                            <option value="MD">مولدوفا</option>
                            <option value="MC">موناكو</option>
                            <option value="ME">الجبل الأسود</option>
                            <option value="NL">هولندا</option>
                            <option value="MK">مقدونيا الشمالية</option>
                            <option value="NO">النرويج</option>
                            <option value="PL">بولندا</option>
                            <option value="PT">البرتغال</option>
                            <option value="RO">رومانيا</option>
                            <option value="RU">روسيا</option>
                            <option value="SM">سان مارينو</option>
                            <option value="RS">صربيا</option>
                            <option value="SK">سلوفاكيا</option>
                            <option value="SI">سلوفينيا</option>
                            <option value="ES">إسبانيا</option>
                            <option value="SE">السويد</option>
                            <option value="CH">سويسرا</option>
                            <option value="UA">أوكرانيا</option>
                            <option value="GB">المملكة المتحدة</option>
                            <option value="VA">الفاتيكان</option>
                          </optgroup>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                      اسم الشركة
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                      <input
                        type="text"
                        value={signupForm.company}
                        onChange={(e) => updateSignupForm('company', e.target.value)}
                        className={`w-full pl-12 pr-4 py-3 bg-light-glass dark:bg-dark-glass border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent/50 transition-all ${
                          errors.company ? 'border-red-500' : 'border-light-border dark:border-dark-border'
                        }`}
                        placeholder="اسم شركتك"
                      />
                    </div>
                    {errors.company && (
                      <p className="mt-1 text-xs text-red-400">{errors.company}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                        كلمة المرور
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={signupForm.password}
                          onChange={(e) => updateSignupForm('password', e.target.value)}
                          className={`w-full pl-12 pr-12 py-3 bg-light-glass dark:bg-dark-glass border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent/50 transition-all ${
                            errors.password ? 'border-red-500' : 'border-light-border dark:border-dark-border'
                          }`}
                          placeholder="كلمة المرور"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary hover:text-lime-accent transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="mt-1 text-xs text-red-400">{errors.password}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                        تأكيد كلمة المرور
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={signupForm.confirmPassword}
                          onChange={(e) => updateSignupForm('confirmPassword', e.target.value)}
                          className={`w-full pl-12 pr-12 py-3 bg-light-glass dark:bg-dark-glass border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent/50 transition-all ${
                            errors.confirmPassword ? 'border-red-500' : 'border-light-border dark:border-dark-border'
                          }`}
                          placeholder="تأكيد كلمة المرور"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary hover:text-lime-accent transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={signupForm.acceptTerms}
                        onChange={(e) => updateSignupForm('acceptTerms', e.target.checked)}
                        className="w-4 h-4 text-lime-accent bg-light-glass dark:bg-dark-glass border-light-border dark:border-dark-border rounded focus:ring-lime-accent/50 mt-1"
                      />
                      <span className="text-sm text-light-text dark:text-dark-text">
                        أوافق على{' '}
                        <button type="button" className="text-lime-accent hover:text-lime-accent/80 transition-colors">
                          الشروط والأحكام
                        </button>
                        {' '}و{' '}
                        <button type="button" className="text-lime-accent hover:text-lime-accent/80 transition-colors">
                          سياسة الخصوصية
                        </button>
                      </span>
                    </label>
                    {errors.acceptTerms && (
                      <p className="mt-1 text-xs text-red-400">{errors.acceptTerms}</p>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-lime-accent text-light-base dark:text-dark-base py-3 rounded-xl font-medium hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-light-base dark:border-dark-base border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>إنشاء حساب</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};