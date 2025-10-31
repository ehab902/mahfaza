import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Building2, Send, FileText, Wallet, TrendingUp, ChevronLeft, ChevronRight, Settings, History } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { useLanguage } from '../contexts/LanguageContext';

// Collapsible navigation sidebar with user profile and section switching functionality
interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user] = useAuthState(auth);
  const { t } = useLanguage();

  const navigation = [
    { id: 'account', label: t('nav.account'), icon: Building2 },
    { id: 'cards', label: t('nav.cards'), icon: CreditCard },
    { id: 'transactions', label: t('nav.transactions'), icon: History },
    { id: 'transfer', label: t('nav.transfer'), icon: Send },
    { id: 'topup', label: t('nav.topup'), icon: Wallet },
    { id: 'statements', label: t('nav.statements'), icon: FileText },
    { id: 'services', label: t('nav.services'), icon: Settings },
  ];

  // Get user display name and email
  const getUserDisplayName = () => {
    if (user?.displayName) {
      return user.displayName;
    }
    if (user?.email) {
      const emailParts = user.email.split('@');
      return emailParts[0];
    }
    return 'مستخدم';
  };

  const getUserInitials = () => {
    const displayName = getUserDisplayName();
    const words = displayName.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  };

  return (
    <motion.div
      initial={{ width: 280 }}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="bg-light-surface/80 dark:bg-dark-surface/80 backdrop-blur-glass border-r border-light-border dark:border-dark-border flex flex-col h-full transition-colors duration-300"
    >
      {/* Header */}
      <div className="p-4 lg:p-6 border-b border-light-border dark:border-dark-border flex items-center justify-between">
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: isCollapsed ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          className="flex items-center"
        >
          {!isCollapsed && (
            <div>
              <h1 className="text-base lg:text-lg font-bold text-lime-accent font-editorial">TradeHub</h1>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                {t('language') === 'ar' ? 'التمويل التجاري' : 'Trade Finance'}
              </p>
            </div>
          )}
        </motion.div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-full hover:bg-light-glass dark:hover:bg-dark-glass transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 lg:p-4 space-y-1 lg:space-y-2 overflow-y-auto">
        {navigation.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={`w-full flex items-center space-x-4 p-4 rounded-xl transition-all relative group ${
              activeSection === item.id
                ? 'bg-lime-accent/10 text-lime-accent'
                : 'text-light-text dark:text-dark-text hover:bg-light-glass dark:hover:bg-dark-glass hover:text-lime-accent'
            }`}
            whileHover={{ scale: isCollapsed ? 1.05 : 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className={`relative ${activeSection === item.id ? 'drop-shadow-glow' : ''}`}>
              <item.icon className="w-6 h-6" />
              {activeSection === item.id && (
                <motion.div
                  layoutId="activeGlow"
                  className="absolute inset-0 bg-lime-accent/20 rounded-full blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </div>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 1 }}
                animate={{ opacity: isCollapsed ? 0 : 1 }}
                transition={{ duration: 0.2 }}
                className="font-medium font-editorial text-sm lg:text-base"
              >
                {item.label}
              </motion.span>
            )}
            {activeSection === item.id && (
              <motion.div
                layoutId="activeIndicator"
                className="absolute right-0 w-1 h-8 bg-lime-accent rounded-l-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </motion.button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 lg:p-4 border-t border-light-border dark:border-dark-border">
        <div className="flex items-center space-x-3 p-3 bg-light-glass dark:bg-dark-glass rounded-xl">
          <div className="w-8 h-8 bg-lime-accent rounded-full flex items-center justify-center">
            <span className="text-light-base dark:text-dark-base font-bold text-xs">
              {getUserInitials()}
            </span>
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: isCollapsed ? 0 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-sm font-medium text-light-text dark:text-dark-text">
                {getUserDisplayName()}
              </p>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                {t('common.premiumMember')}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};