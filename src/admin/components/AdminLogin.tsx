import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, AlertCircle } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { checkAdminStatus, logAdminAccess } from '../hooks/useAdminCheck';

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userEmail = userCredential.user.email;

      if (!userEmail) {
        await auth.signOut();
        await logAdminAccess(email, 'login_failed', 'No email found in user account');
        throw new Error('حدث خطأ في البريد الإلكتروني');
      }

      const isAdmin = await checkAdminStatus(userEmail);

      if (!isAdmin) {
        await auth.signOut();
        await logAdminAccess(userEmail, 'access_denied', 'Email not in allowed list');
        throw new Error('ليس لديك صلاحيات الوصول لهذه اللوحة');
      }

      await logAdminAccess(userEmail, 'login_success', 'Successfully logged in');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'فشل تسجيل الدخول. يرجى التحقق من البيانات والمحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-base via-light-surface to-light-base dark:from-dark-base dark:via-dark-surface dark:to-dark-base flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-lime-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-lime-accent/3 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-light-surface/80 dark:bg-dark-surface/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-light-border dark:border-dark-border">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="w-20 h-20 bg-gradient-to-br from-lime-accent to-lime-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
            >
              <Shield className="w-10 h-10 text-dark-text" />
            </motion.div>
            <h1 className="text-3xl font-bold text-light-text dark:text-dark-text mb-2">
              لوحة التحكم الإدارية
            </h1>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              مراجعة طلبات التحقق من الهوية (KYC)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pr-11 pl-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent transition-all"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pr-11 pl-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-lime-accent to-lime-500 text-dark-text rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-light-border dark:border-dark-border">
            <p className="text-xs text-center text-light-text-secondary dark:text-dark-text-secondary">
              هذه اللوحة مخصصة للمسؤولين فقط. جميع الأنشطة مسجلة ومراقبة.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
