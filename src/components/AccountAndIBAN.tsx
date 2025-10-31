import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Eye, EyeOff, Building2, Globe } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { useBankAccount } from '../hooks/useBankAccount';
import { useUserProfile } from '../hooks/useUserProfile';
import { useLanguage } from '../contexts/LanguageContext';

export const AccountAndIBAN: React.FC = () => {
  const [showBalance, setShowBalance] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [user] = useAuthState(auth);
  const { account, loading, error } = useBankAccount();
  const { profile } = useUserProfile();
  const { t } = useLanguage();

  // Get user display name
  const getUserDisplayName = () => {
    // أولاً، جرب الحصول على الاسم من قاعدة البيانات
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile?.first_name) {
      return profile.first_name;
    }
    
    // ثانياً، جرب Firebase Auth
    if (user?.displayName) {
      return user.displayName;
    }
    if (user?.email) {
      const emailParts = user.email.split('@');
      return emailParts[0];
    }
    return 'مستخدم';
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-light-text dark:text-dark-text font-editorial">{t('account.title')}</h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">{t('account.subtitle')}</p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-lime-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-light-text dark:text-dark-text font-editorial">{t('account.title')}</h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">{t('account.subtitle')}</p>
          </div>
        </div>
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  // Show no account state
  if (!account) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-light-text dark:text-dark-text font-editorial">{t('account.title')}</h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">{t('account.subtitle')}</p>
          </div>
        </div>
        <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-6 text-center">
          <p className="text-orange-400 mb-4">
            {t('account.notFound')}
          </p>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            {t('account.contactSupport')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0"
      >
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-light-text dark:text-dark-text font-editorial">{t('account.title')}</h2>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">{t('account.subtitle')}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowBalance(!showBalance)}
          className="p-3 bg-light-glass dark:bg-dark-glass rounded-full hover:bg-lime-accent/10 transition-colors duration-300"
        >
          {showBalance ? (
            <Eye className="w-5 h-5 text-light-text dark:text-dark-text" />
          ) : (
            <EyeOff className="w-5 h-5 text-light-text dark:text-dark-text" />
          )}
        </motion.button>
      </motion.div>

      {/* Account Balance Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gradient-to-br from-light-surface to-light-glass dark:from-dark-surface dark:to-dark-glass border border-light-border dark:border-dark-border rounded-2xl p-4 lg:p-8 shadow-glass relative overflow-hidden transition-colors duration-300"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-lime-accent/5 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Building2 className="w-8 h-8 text-lime-accent" />
              <div>
                <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm">{t('account.balance')}</p>
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{account.account_type}</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              account.status === 'Active' 
                ? 'bg-lime-accent/20 text-lime-accent' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {account.status === 'Active' ? t('common.active') : t('common.inactive')}
            </div>
          </div>
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3, type: "spring" }}
            className="flex items-baseline space-x-2 mb-4"
          >
            <span className="text-2xl lg:text-4xl font-bold text-lime-accent font-editorial">
              {showBalance ? `${account.balance.toLocaleString()}` : '••••••••'}
            </span>
            <span className="text-lg text-light-text-secondary dark:text-dark-text-secondary">EUR</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Account Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* IBAN Details */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-light-surface/50 dark:bg-dark-surface/50 backdrop-blur-sm border border-light-border dark:border-dark-border rounded-xl p-4 lg:p-6 hover:border-lime-accent/30 transition-all hover:shadow-glow duration-300"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Globe className="w-6 h-6 text-lime-accent" />
            <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial">{t('account.ibanDetails')}</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('account.iban')}</label>
              <div className="flex items-center space-x-2 bg-light-glass dark:bg-dark-glass rounded-lg p-3">
                <span className="font-mono text-light-text dark:text-dark-text flex-1 text-sm lg:text-base break-all">{account.iban}</span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCopy(account.iban, 'iban')}
                  className="p-2 hover:bg-lime-accent/10 rounded-lg transition-colors"
                >
                  <Copy className={`w-4 h-4 ${copiedField === 'iban' ? 'text-lime-accent' : 'text-light-text-secondary dark:text-dark-text-secondary'}`} />
                </motion.button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('account.swift')}</label>
              <div className="flex items-center space-x-2 bg-light-glass dark:bg-dark-glass rounded-lg p-3">
                <span className="font-mono text-light-text dark:text-dark-text flex-1 text-sm lg:text-base">{account.swift_code}</span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCopy(account.swift_code, 'swift')}
                  className="p-2 hover:bg-lime-accent/10 rounded-lg transition-colors"
                >
                  <Copy className={`w-4 h-4 ${copiedField === 'swift' ? 'text-lime-accent' : 'text-light-text-secondary dark:text-dark-text-secondary'}`} />
                </motion.button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('account.bankName')}</label>
              <div className="bg-light-glass dark:bg-dark-glass rounded-lg p-3">
                <span className="text-light-text dark:text-dark-text">{account.bank_name}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Additional Account Information */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-light-surface/50 dark:bg-dark-surface/50 backdrop-blur-sm border border-light-border dark:border-dark-border rounded-xl p-4 lg:p-6 hover:border-lime-accent/30 transition-all hover:shadow-glow duration-300"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Building2 className="w-6 h-6 text-lime-accent" />
            <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial">{t('account.additionalInfo')}</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('account.accountNumber')}</label>
              <div className="flex items-center space-x-2 bg-light-glass dark:bg-dark-glass rounded-lg p-3">
                <span className="font-mono text-light-text dark:text-dark-text flex-1 text-sm lg:text-base">{account.account_number}</span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCopy(account.account_number, 'account')}
                  className="p-2 hover:bg-lime-accent/10 rounded-lg transition-colors"
                >
                  <Copy className={`w-4 h-4 ${copiedField === 'account' ? 'text-lime-accent' : 'text-light-text-secondary dark:text-dark-text-secondary'}`} />
                </motion.button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('account.accountType')}</label>
              <div className="bg-light-glass dark:bg-dark-glass rounded-lg p-3">
                <span className="text-light-text dark:text-dark-text">{account.account_type}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('account.currency')}</label>
              <div className="bg-light-glass dark:bg-dark-glass rounded-lg p-3">
                <span className="text-light-text dark:text-dark-text">
                  {account.currency} - {account.currency === 'USD' ? 'US Dollar' : account.currency === 'EUR' ? 'Euro' : account.currency}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};