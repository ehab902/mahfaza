import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Globe, Menu, X, CheckCircle, AlertTriangle, Info, DollarSign, CreditCard, LogOut, User, Settings, Shield, XCircle } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { ThemeToggle } from './ThemeToggle';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNotifications } from '../hooks/useNotifications';
import { useUserProfile } from '../hooks/useUserProfile';
import { useLanguage } from '../contexts/LanguageContext';
import { useKYCNotifications } from '../hooks/useKYCNotifications';
import { useKYCStatusMonitor } from '../hooks/useKYCStatusMonitor';

interface TopBarProps {
  onMenuToggle?: () => void;
  onNavigate?: (section: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuToggle, onNavigate }) => {
  const [user] = useAuthState(auth);
  const { notifications, loading: notificationsLoading, markAsRead, markAllAsRead } = useNotifications();
  const { profile, loading: profileLoading, updateProfile } = useUserProfile();
  const { language, setLanguage, t } = useLanguage();
  const { notifications: kycNotifications, unreadCount: kycUnreadCount, markAsRead: markKYCAsRead } = useKYCNotifications();
  useKYCStatusMonitor();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showKYCNotifications, setShowKYCNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const languageButtonRef = useRef<HTMLButtonElement>(null);

  const languages = [
    { code: 'ar' as const, name: t('language.arabic'), flag: '🇸🇦' },
    { code: 'en' as const, name: t('language.english'), flag: '🇺🇸' },
    { code: 'fr' as const, name: t('language.french'), flag: '🇫🇷' },
    { code: 'de' as const, name: t('language.german'), flag: '🇩🇪' },
    { code: 'es' as const, name: t('language.spanish'), flag: '🇪🇸' }
  ];

  // إغلاق الإشعارات عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        bellRef.current &&
        !notificationRef.current.contains(event.target as Node) &&
        !bellRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // إغلاق قائمة المستخدم عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        userButtonRef.current &&
        !userMenuRef.current.contains(event.target as Node) &&
        !userButtonRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // إغلاق قائمة اللغة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        languageMenuRef.current &&
        languageButtonRef.current &&
        !languageMenuRef.current.contains(event.target as Node) &&
        !languageButtonRef.current.contains(event.target as Node)
      ) {
        setShowLanguageMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowUserMenu(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleProfileClick = () => {
    if (onNavigate) {
      onNavigate('account-management');
    }
    setShowUserMenu(false);
  };

  const handleSettingsClick = () => {
    if (onNavigate) {
      onNavigate('security-settings');
    }
    setShowUserMenu(false);
  };

  const handleLanguageChange = async (newLanguage: 'ar' | 'en' | 'fr' | 'de' | 'es') => {
    await setLanguage(newLanguage);
    setShowLanguageMenu(false);
  };

  // Get user display name and email
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

  const getUserEmail = () => {
    return user?.email || 'لا يوجد بريد إلكتروني';
  };

  const getUserProfileImage = () => {
    // أولاً، جرب الحصول على الصورة من قاعدة البيانات
    if (profile?.profile_image_url) {
      return profile.profile_image_url;
    }
    
    // ثانياً، جرب Firebase Auth
    if (user?.photoURL) {
      return user.photoURL;
    }
    
    // إذا لم توجد صورة، ارجع null لعرض الأحرف الأولى
    return null;
  };

  const getUserInitials = () => {
    const displayName = getUserDisplayName();
    const words = displayName.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'warning':
        return 'text-orange-400';
      case 'info':
        return 'text-blue-400';
      case 'transaction':
        return 'text-lime-accent';
      case 'topup_approved':
      case 'kyc_approved':
        return 'text-green-500';
      case 'topup_rejected':
      case 'kyc_rejected':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10';
      case 'warning':
        return 'bg-orange-500/10';
      case 'info':
        return 'bg-blue-500/10';
      case 'transaction':
        return 'bg-lime-accent/10';
      case 'topup_approved':
      case 'kyc_approved':
        return 'bg-green-500/10';
      case 'topup_rejected':
      case 'kyc_rejected':
        return 'bg-red-500/10';
      default:
        return 'bg-gray-500/10';
    }
  };

  return (
    <div className="relative">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-light-surface/80 dark:bg-dark-surface/80 backdrop-blur-glass border-b border-light-border dark:border-dark-border px-4 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-30 transition-colors duration-300"
      >
        {/* Left section */}
        <div className="flex items-center space-x-6">
          {/* Mobile menu button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onMenuToggle}
            className="lg:hidden p-2 bg-light-glass dark:bg-dark-glass rounded-full hover:bg-lime-accent/10 transition-colors duration-300"
          >
            <Menu className="w-5 h-5 text-light-text dark:text-dark-text" />
          </motion.button>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-3 lg:space-x-6">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Trust indicators */}
{/* Language Selector */}
<div className="relative">
  <motion.button
    ref={languageButtonRef}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={() => setShowLanguageMenu(!showLanguageMenu)}
    className="flex items-center space-x-1 bg-light-glass dark:bg-dark-glass px-3 py-2 rounded-full transition-colors duration-300 hover:bg-lime-accent/10"
  >
    <Globe className="w-4 h-4 text-lime-accent" />
    <span className="text-base text-light-text dark:text-dark-text">
      {languages.find(lang => lang.code === language)?.flag}
    </span>
  </motion.button>

  {/* باقي الكود بدون تغيير */}
  {showLanguageMenu && (
    <motion.div
      ref={languageMenuRef}
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute top-full right-0 mt-2 w-48 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-2xl shadow-2xl backdrop-blur-glass z-50 overflow-hidden"
    >
      <div className="py-2">
        {languages.map((lang) => (
          <motion.button
            key={lang.code}
            whileHover={{ backgroundColor: 'rgba(212, 175, 55, 0.1)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleLanguageChange(lang.code)}
            className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
              language === lang.code 
                ? 'bg-lime-accent/10 text-lime-accent' 
                : 'text-light-text dark:text-dark-text hover:text-lime-accent'
            }`}
          >
            <span className="text-lg">{lang.flag}</span>
            <span className="font-medium">{lang.name}</span>
            {language === lang.code && (
              <CheckCircle className="w-4 h-4 ml-auto" />
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )}
</div>

          {/* KYC Notifications */}
          {kycUnreadCount > 0 && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowKYCNotifications(!showKYCNotifications)}
              className="relative p-2 bg-gradient-to-r from-lime-accent/20 to-green-500/20 rounded-full hover:from-lime-accent/30 hover:to-green-500/30 transition-all duration-300 shadow-lg"
            >
              <Shield className="w-5 h-5 text-lime-accent" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
              >
                <span className="text-xs font-bold text-white">
                  {kycUnreadCount > 9 ? '9+' : kycUnreadCount}
                </span>
              </motion.div>
            </motion.button>
          )}

          {/* Notifications */}
          <motion.button
            ref={bellRef}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 bg-light-glass dark:bg-dark-glass rounded-full hover:bg-lime-accent/10 transition-colors duration-300"
          >
            <Bell className="w-5 h-5 text-light-text dark:text-dark-text" />
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-lime-accent rounded-full flex items-center justify-center"
              >
                <span className="text-xs font-bold text-light-base dark:text-dark-base">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </motion.div>
            )}
          </motion.button>

          {/* User avatar */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative"
          >
            <motion.button
              ref={userButtonRef}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-8 h-8 lg:w-10 lg:h-10 rounded-full overflow-hidden cursor-pointer shadow-glow transition-all border-2 border-lime-accent/20"
            >
              {getUserProfileImage() ? (
                <img
                  src={getUserProfileImage()!}
                  alt="الصورة الشخصية"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // في حالة فشل تحميل الصورة، اعرض الأحرف الأولى
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-full h-full bg-lime-accent rounded-full flex items-center justify-center">
                          <span class="text-light-base dark:text-dark-base font-bold text-xs lg:text-sm">
                            ${getUserInitials()}
                          </span>
                        </div>
                      `;
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full bg-lime-accent rounded-full flex items-center justify-center">
                  <span className="text-light-base dark:text-dark-base font-bold text-xs lg:text-sm">
                    {getUserInitials()}
                  </span>
                </div>
              )}
            </motion.button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <motion.div
                ref={userMenuRef}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full right-0 mt-2 w-64 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-2xl shadow-2xl backdrop-blur-glass z-50 overflow-hidden"
              >
                {/* User Info Header */}
                <div className="p-4 border-b border-light-border dark:border-dark-border bg-gradient-to-r from-lime-accent/10 to-lime-accent/5">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg border-2 border-lime-accent/20">
                      {getUserProfileImage() ? (
                        <img
                          src={getUserProfileImage()!}
                          alt="الصورة الشخصية"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // في حالة فشل تحميل الصورة، اعرض الأحرف الأولى
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-full h-full bg-lime-accent rounded-full flex items-center justify-center">
                                  <span class="text-light-base dark:text-dark-base font-bold text-lg">
                                    ${getUserInitials()}
                                  </span>
                                </div>
                              `;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-lime-accent rounded-full flex items-center justify-center">
                          <span className="text-light-base dark:text-dark-base font-bold text-lg">
                            {getUserInitials()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-light-text dark:text-dark-text font-editorial">
                        {getUserDisplayName()}
                      </h3>
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        {getUserEmail()}
                      </p>
                      {profile?.company && (
                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                          {profile.company}
                        </p>
                      )}
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="inline-block px-2 py-1 bg-lime-accent/20 text-lime-accent text-xs rounded-full">
                          {t('common.premiumMember')}
                        </span>
                        {profile?.country && (
                          <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                            {profile.country}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(212, 175, 55, 0.1)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleProfileClick}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-light-text dark:text-dark-text hover:text-lime-accent transition-colors text-right"
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">الملف الشخصي</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(212, 175, 55, 0.1)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSettingsClick}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-light-text dark:text-dark-text hover:text-lime-accent transition-colors text-right"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">الإعدادات</span>
                  </motion.button>

                  <div className="border-t border-light-border dark:border-dark-border my-2"></div>

                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-red-500 hover:text-red-400 transition-colors text-right"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">تسجيل الخروج</span>
                  </motion.button>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-light-border dark:border-dark-border bg-light-glass dark:bg-dark-glass">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-lime-accent rounded-full animate-pulse" />
                      <span className="text-xs text-lime-accent font-medium">متصل</span>
                    </div>
                    <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                      آخر نشاط: الآن
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <motion.div
          ref={notificationRef}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute top-full right-4 lg:right-8 mt-2 w-80 lg:w-96 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-2xl shadow-2xl backdrop-blur-glass z-50 max-h-96 overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-light-border dark:border-dark-border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-light-text dark:text-dark-text font-editorial">
                  {language === 'ar' ? 'الإشعارات' : 'Notifications'}
                </h3>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  {language === 'ar' ? `${unreadCount} إشعار غير مقروء` : `${unreadCount} unread notifications`}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowNotifications(false)}
                className="p-1 hover:bg-light-glass dark:hover:bg-dark-glass rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
              </motion.button>
            </div>
            {unreadCount > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={markAllAsRead}
                disabled={notificationsLoading}
                className="w-full bg-lime-accent/10 text-lime-accent hover:bg-lime-accent/20 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 text-sm"
              >
                {notificationsLoading ? t('common.loading') : t('notifications.markAllRead')}
              </motion.button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => markAsRead(notification.id)}
                className={`p-4 border-b border-light-border dark:border-dark-border last:border-b-0 hover:bg-light-glass dark:hover:bg-dark-glass transition-colors cursor-pointer ${
                  !notification.read ? 'bg-lime-accent/5' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full ${getNotificationBg(notification.type)}`}>
                    {notification.type === 'transaction' && <DollarSign className={`w-4 h-4 ${getNotificationColor(notification.type)}`} />}
                    {notification.type === 'success' && <CheckCircle className={`w-4 h-4 ${getNotificationColor(notification.type)}`} />}
                    {notification.type === 'warning' && <AlertTriangle className={`w-4 h-4 ${getNotificationColor(notification.type)}`} />}
                    {notification.type === 'info' && <Info className={`w-4 h-4 ${getNotificationColor(notification.type)}`} />}
                    {notification.type === 'topup_approved' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {notification.type === 'topup_rejected' && <XCircle className="w-4 h-4 text-red-500" />}
                    {notification.type === 'kyc_approved' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {notification.type === 'kyc_rejected' && <XCircle className="w-4 h-4 text-red-500" />}
                    {notification.type === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-light-text dark:text-dark-text truncate">
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-lime-accent rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-2">
                      {notification.description || notification.message}
                    </p>
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                      {notification.created_at ? 
                        new Date(notification.created_at.toDate ? notification.created_at.toDate() : notification.created_at).toLocaleDateString('ar-AE') :
                        `منذ ${notification.time || 'وقت غير محدد'}`
                      }
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-light-border dark:border-dark-border">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text dark:hover:text-dark-text transition-colors text-center"
              >
                {t('notifications.viewAll')}
              </motion.button>
            </div>
          )}
        </motion.div>
      )}

      {/* KYC Notifications Dropdown */}
      {showKYCNotifications && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute top-full right-4 lg:right-8 mt-2 w-80 lg:w-96 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-2xl shadow-2xl backdrop-blur-glass z-50 max-h-96 overflow-hidden"
        >
          <div className="p-4 border-b border-light-border dark:border-dark-border bg-gradient-to-r from-lime-accent/10 to-green-500/10">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-light-text dark:text-dark-text font-editorial flex items-center gap-2">
                  <Shield className="w-5 h-5 text-lime-accent" />
                  إشعارات التحقق من الهوية
                </h3>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  {kycUnreadCount} إشعار غير مقروء
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowKYCNotifications(false)}
                className="p-1 hover:bg-light-glass dark:hover:bg-dark-glass rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
              </motion.button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {kycNotifications.length === 0 ? (
              <div className="p-8 text-center text-light-text-secondary dark:text-dark-text-secondary">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد إشعارات</p>
              </div>
            ) : (
              kycNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => {
                    markKYCAsRead(notification.id);
                    setShowKYCNotifications(false);
                  }}
                  className={`p-4 border-b border-light-border dark:border-dark-border last:border-b-0 hover:bg-light-glass dark:hover:bg-dark-glass transition-colors cursor-pointer ${
                    !notification.is_read ? 'bg-lime-accent/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      notification.type === 'approved' ? 'bg-green-500/20' :
                      notification.type === 'rejected' ? 'bg-red-500/20' :
                      notification.type === 'under_review' ? 'bg-amber-500/20' :
                      'bg-blue-500/20'
                    }`}>
                      {notification.type === 'approved' && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {notification.type === 'rejected' && <XCircle className="w-5 h-5 text-red-500" />}
                      {notification.type === 'under_review' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                      {notification.type === 'submission_received' && <Info className="w-5 h-5 text-blue-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-bold text-light-text dark:text-dark-text">
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
                        {notification.message}
                      </p>
                      <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-2">
                        {new Date(notification.created_at).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};