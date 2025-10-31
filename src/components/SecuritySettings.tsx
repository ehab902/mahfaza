import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Key, Smartphone, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle, Clock, Lock, Unlock, Bell, Monitor, Save, CreditCard as Edit, Copy, Trash2 } from 'lucide-react';
import { useUserSettings } from '../hooks/useUserSettings';
import { useUserSessions } from '../hooks/useUserSessions';
import { useBackupCodes } from '../hooks/useBackupCodes';

interface SecuritySettingsProps {
  onBack: () => void;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({ onBack }) => {
  const { settings, loading, error, updateSettings } = useUserSettings();
  const { sessions, loading: sessionsLoading, terminateSession, terminateAllSessions } = useUserSessions();
  const { backupCodes, loading: codesLoading, generateBackupCodes: generateCodes } = useBackupCodes();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneStep, setPhoneStep] = useState<'enter' | 'verify'>('enter');
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email_notifications: true,
    sms_notifications: true,
    push_notifications: false,
    login_alerts: false,
    two_factor_enabled: false,
    device_tracking: true,
    session_timeout: 30
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Update form data when settings load
  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const tabs = [
    { id: 'overview', label: 'نظرة عامة', icon: Shield },
    { id: 'password', label: 'كلمة المرور', icon: Key },
    { id: 'two-factor', label: 'المصادقة الثنائية', icon: Smartphone },
    { id: 'sessions', label: 'الجلسات النشطة', icon: Monitor },
    { id: 'alerts', label: 'تنبيهات الأمان', icon: Bell }
  ];

  const handleSave = async () => {
    setIsLoading(true);
    setSaveStatus('idle');
    
    try {
      // محاكاة API call
      const success = await updateSettings(formData);
      if (success) {
        setSaveStatus('success');
      } else {
        setSaveStatus('error');
      }
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }
    
    setIsLoading(true);
    setSaveStatus('idle');
    
    try {
      // محاكاة API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSaveStatus('success');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = async () => {
    if (phoneStep === 'enter') {
      if (!newPhoneNumber) return;
      
      setIsLoading(true);
      try {
        // محاكاة إرسال رمز التحقق
        await new Promise(resolve => setTimeout(resolve, 2000));
        setPhoneStep('verify');
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } catch (error) {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!verificationCode) return;
      
      setIsLoading(true);
      try {
        // محاكاة التحقق من الرمز
        await new Promise(resolve => setTimeout(resolve, 2000));
        setSaveStatus('success');
        setShowPhoneModal(false);
        setPhoneStep('enter');
        setNewPhoneNumber('');
        setVerificationCode('');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } catch (error) {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGenerateBackupCodes = async () => {
    setIsLoading(true);
    try {
      const codes = await generateCodes();
      if (codes.length > 0) {
        setShowBackupCodes(true);
        setSaveStatus('success');
      } else {
        setSaveStatus('error');
      }
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const copyBackupCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const handleTerminateAllSessions = async () => {
    setIsLoading(true);
    try {
      const success = await terminateAllSessions();
      if (success) {
        setSaveStatus('success');
      } else {
        setSaveStatus('error');
      }
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    setIsLoading(true);
    try {
      await terminateSession(sessionId);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-lime-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">جاري تحميل الإعدادات...</p>
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
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="p-2 bg-light-glass dark:bg-dark-glass rounded-full hover:bg-lime-accent/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-light-text dark:text-dark-text" />
          </motion.button>
          <div>
            <h2 className="text-3xl font-bold text-light-text dark:text-dark-text font-editorial">إعدادات الأمان</h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">إدارة أمان حسابك وحماية بياناتك</p>
          </div>
        </div>

        {/* Save Status */}
        {saveStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl ${
              saveStatus === 'success' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {saveStatus === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">
              {saveStatus === 'success' ? 'تم الحفظ بنجاح' : 'خطأ في الحفظ'}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Security Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gradient-to-r from-light-surface/80 to-light-glass dark:from-dark-surface/80 dark:to-dark-glass border border-light-border dark:border-dark-border rounded-2xl p-6 shadow-glass transition-colors duration-300"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-lime-accent" />
            <div>
              <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial">درجة الأمان</h3>
              <p className="text-light-text-secondary dark:text-dark-text-secondary">تقييم شامل لأمان حسابك</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-lime-accent">85%</div>
            <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">قوي</div>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-dark-glass rounded-full h-3 mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.round((Object.values(formData).filter(v => v === true).length / Object.keys(formData).length) * 100)}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-3 bg-gradient-to-r from-lime-accent to-green-500 rounded-full"
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            {formData.two_factor_enabled ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-orange-500" />}
            <span className="text-light-text dark:text-dark-text">المصادقة الثنائية</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-light-text dark:text-dark-text">كلمة مرور قوية</span>
          </div>
          <div className="flex items-center space-x-2">
            {formData.login_alerts ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-orange-500" />}
            <span className="text-light-text dark:text-dark-text">تنبيهات تسجيل الدخول</span>
          </div>
          <div className="flex items-center space-x-2">
            {formData.device_tracking ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-orange-500" />}
            <span className="text-light-text dark:text-dark-text">تتبع الأجهزة</span>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-light-surface/50 dark:bg-dark-surface/50 backdrop-blur-sm border border-light-border dark:border-dark-border rounded-xl p-2"
      >
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap text-sm ${
                activeTab === tab.id
                  ? 'bg-lime-accent/20 text-lime-accent border border-lime-accent/30'
                  : 'text-light-text dark:text-dark-text hover:bg-light-glass dark:hover:bg-dark-glass'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-light-surface/50 dark:bg-dark-surface/50 backdrop-blur-sm border border-light-border dark:border-dark-border rounded-2xl p-6"
      >
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial">نظرة عامة على الأمان</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-light-glass dark:bg-dark-glass rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-5 h-5 text-lime-accent" />
                    <div>
                      <p className="font-medium text-light-text dark:text-dark-text">المصادقة الثنائية</p>
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">حماية إضافية لحسابك</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    formData.two_factor_enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {formData.two_factor_enabled ? 'مفعل' : 'غير مفعل'}
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-light-glass dark:bg-dark-glass rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-lime-accent" />
                    <div>
                      <p className="font-medium text-light-text dark:text-dark-text">تنبيهات الأمان</p>
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">إشعارات النشاط المشبوه</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    formData.email_notifications ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {formData.email_notifications ? 'مفعل' : 'غير مفعل'}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-light-glass dark:bg-dark-glass rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Monitor className="w-5 h-5 text-lime-accent" />
                    <div>
                      <p className="font-medium text-light-text dark:text-dark-text">الجلسات النشطة</p>
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">عدد الأجهزة المتصلة</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-lime-accent">{sessions.length}</div>
                    <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">أجهزة</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-light-glass dark:bg-dark-glass rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-lime-accent" />
                    <div>
                      <p className="font-medium text-light-text dark:text-dark-text">انتهاء الجلسة</p>
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">الخروج التلقائي</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-lime-accent">{formData.session_timeout}</div>
                    <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">دقيقة</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial">تغيير كلمة المرور</h3>
            
            <div className="max-w-md space-y-4">
              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">كلمة المرور الحالية</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 pr-12 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary hover:text-lime-accent transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">كلمة المرور الجديدة</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 pr-12 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary hover:text-lime-accent transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">تأكيد كلمة المرور الجديدة</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 pr-12 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary hover:text-lime-accent transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">متطلبات كلمة المرور</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• على الأقل 8 أحرف</li>
                  <li>• حرف كبير وحرف صغير</li>
                  <li>• رقم واحد على الأقل</li>
                  <li>• رمز خاص واحد على الأقل</li>
                </ul>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePasswordChange}
                disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                className="w-full bg-lime-accent text-light-base dark:text-dark-base px-6 py-3 rounded-xl font-medium hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
              </motion.button>
            </div>
          </div>
        )}

        {activeTab === 'two-factor' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial">المصادقة الثنائية</h3>
            
            <div className="flex items-center justify-between p-6 bg-light-glass dark:bg-dark-glass rounded-xl">
              <div className="flex items-center space-x-4">
                <Smartphone className="w-8 h-8 text-lime-accent" />
                <div>
                  <p className="text-lg font-medium text-light-text dark:text-dark-text">المصادقة الثنائية</p>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">حماية إضافية باستخدام هاتفك المحمول</p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => updateFormData('two_factor_enabled', !formData.two_factor_enabled)}
                className={`relative w-16 h-8 rounded-full transition-colors ${
                  formData.two_factor_enabled ? 'bg-lime-accent' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <motion.div
                  animate={{ x: formData.two_factor_enabled ? 32 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md"
                />
              </motion.button>
            </div>
            
            {formData.two_factor_enabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4"
              >
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <div className="flex items-center space-x-3 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <p className="font-medium text-green-800 dark:text-green-200">المصادقة الثنائية مفعلة</p>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    رقم الهاتف المسجل: +971 50 *** **67
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    تم التحقق من رقم هاتفك عند إنشاء الحساب. المصادقة الثنائية تستخدم نفس الرقم للحماية الإضافية.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowPhoneModal(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors text-sm"
                  >
                    تغيير رقم الهاتف
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGenerateBackupCodes}
                    disabled={isLoading}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors text-sm"
                  >
                    {isLoading ? 'جاري الإنشاء...' : 'إنشاء رموز احتياطية'}
                  </motion.button>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">كيف تعمل المصادقة الثنائية؟</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• عند تسجيل الدخول، ستحتاج إلى إدخال كلمة المرور</li>
                    <li>• ثم سيتم إرسال رمز تحقق إلى هاتفك</li>
                    <li>• أدخل الرمز لإكمال عملية تسجيل الدخول</li>
                    <li>• هذا يضمن أن حسابك آمن حتى لو تم اختراق كلمة المرور</li>
                  </ul>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial">الجلسات النشطة</h3>
            
            {sessionsLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-lime-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-light-text-secondary dark:text-dark-text-secondary">جاري تحميل الجلسات...</p>
              </div>
            ) : (
            <div className="space-y-4">
              {sessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-light-glass dark:bg-dark-glass rounded-xl"
                >
                  <div className="flex items-center space-x-4">
                    <Monitor className="w-6 h-6 text-lime-accent" />
                    <div>
                      <p className="font-medium text-light-text dark:text-dark-text">{session.device_info}</p>
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        {session.location} • {session.ip_address}
                      </p>
                      <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                        آخر نشاط: {session.last_activity ? new Date(session.last_activity.toDate ? session.last_activity.toDate() : session.last_activity).toLocaleString('ar-AE') : 'غير محدد'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {session.is_current ? (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                        الجلسة الحالية
                      </span>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleTerminateSession(session.id)}
                        className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-xs"
                      >
                        إنهاء الجلسة
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
            )}
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleTerminateAllSessions}
              disabled={isLoading}
              className="w-full bg-red-500/20 text-red-400 px-6 py-3 rounded-xl font-medium hover:bg-red-500/30 transition-all"
            >
              {isLoading ? 'جاري الإنهاء...' : 'إنهاء جميع الجلسات الأخرى'}
            </motion.button>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial">تنبيهات الأمان</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-light-glass dark:bg-dark-glass rounded-xl">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-lime-accent" />
                  <div>
                    <p className="font-medium text-light-text dark:text-dark-text">تنبيهات البريد الإلكتروني</p>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">إشعارات الأنشطة المشبوهة</p>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => updateFormData('email_notifications', !formData.email_notifications)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    formData.email_notifications ? 'bg-lime-accent' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <motion.div
                    animate={{ x: formData.email_notifications ? 24 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                  />
                </motion.button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-light-glass dark:bg-dark-glass rounded-xl">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-5 h-5 text-lime-accent" />
                  <div>
                    <p className="font-medium text-light-text dark:text-dark-text">تنبيهات الرسائل النصية</p>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">إشعارات فورية عبر SMS</p>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => updateFormData('sms_notifications', !formData.sms_notifications)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    formData.sms_notifications ? 'bg-lime-accent' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <motion.div
                    animate={{ x: formData.sms_notifications ? 24 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                  />
                </motion.button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-light-glass dark:bg-dark-glass rounded-xl">
                <div className="flex items-center space-x-3">
                  <Lock className="w-5 h-5 text-lime-accent" />
                  <div>
                    <p className="font-medium text-light-text dark:text-dark-text">تنبيهات تسجيل الدخول</p>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">إشعار عند كل تسجيل دخول</p>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => updateFormData('login_alerts', !formData.login_alerts)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    formData.login_alerts ? 'bg-lime-accent' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <motion.div
                    animate={{ x: formData.login_alerts ? 24 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                  />
                </motion.button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-light-glass dark:bg-dark-glass rounded-xl">
                <div className="flex items-center space-x-3">
                  <Monitor className="w-5 h-5 text-lime-accent" />
                  <div>
                    <p className="font-medium text-light-text dark:text-dark-text">تتبع الأجهزة</p>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">مراقبة الأجهزة الجديدة</p>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => updateFormData('device_tracking', !formData.device_tracking)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    formData.device_tracking ? 'bg-lime-accent' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <motion.div
                    animate={{ x: formData.device_tracking ? 24 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                  />
                </motion.button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">انتهاء الجلسة التلقائي (بالدقائق)</label>
              <select
                value={formData.session_timeout.toString()}
                onChange={(e) => updateFormData('session_timeout', parseInt(e.target.value))}
                className="w-full max-w-xs bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
              >
                <option value="15">15 دقيقة</option>
                <option value="30">30 دقيقة</option>
                <option value="60">60 دقيقة</option>
                <option value="120">120 دقيقة</option>
              </select>
            </div>
          </div>
        )}
      </motion.div>

      {/* Phone Change Modal */}
      {showPhoneModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowPhoneModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial mb-6">
              {phoneStep === 'enter' ? 'تغيير رقم الهاتف' : 'تأكيد رقم الهاتف'}
            </h3>
            
            {phoneStep === 'enter' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">
                    رقم الهاتف الجديد
                  </label>
                  <input
                    type="tel"
                    value={newPhoneNumber}
                    onChange={(e) => setNewPhoneNumber(e.target.value)}
                    placeholder="+971 50 123 4567"
                    className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                  />
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    سيتم إرسال رمز التحقق إلى رقم الهاتف الجديد
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">
                    رمز التحقق
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                  />
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    تم إرسال رمز التحقق إلى {newPhoneNumber}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-3 mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePhoneChange}
                disabled={isLoading || (phoneStep === 'enter' ? !newPhoneNumber : !verificationCode)}
                className="flex-1 bg-lime-accent text-light-base dark:text-dark-base px-4 py-2 rounded-lg font-medium hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'جاري المعالجة...' : phoneStep === 'enter' ? 'إرسال الرمز' : 'تأكيد'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowPhoneModal(false);
                  setPhoneStep('enter');
                  setNewPhoneNumber('');
                  setVerificationCode('');
                }}
                className="px-4 py-2 bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-lg text-light-text dark:text-dark-text hover:bg-red-500/10 hover:text-red-400 transition-all"
              >
                إلغاء
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Backup Codes Modal */}
      {showBackupCodes && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowBackupCodes(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial mb-6">
              الرموز الاحتياطية
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">تعليمات مهمة</h4>
                <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                  <li>• احفظ هذه الرموز في مكان آمن</li>
                  <li>• كل رمز يمكن استخدامه مرة واحدة فقط</li>
                  <li>• استخدمها عند فقدان الوصول لهاتفك</li>
                </ul>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {backupCodes.map((code, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-light-glass dark:bg-dark-glass rounded-lg">
                    <span className="font-mono text-sm text-light-text dark:text-dark-text">{code.code_hash}</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => copyBackupCode(code.code_hash)}
                      className="p-1 hover:bg-lime-accent/10 rounded transition-colors"
                    >
                      <Copy className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
                    </motion.button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const codesText = backupCodes.map(c => c.code_hash).join('\n');
                  const blob = new Blob([codesText], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'tradehub-backup-codes.txt';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-all"
              >
                تحميل الرموز
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowBackupCodes(false)}
                className="px-4 py-2 bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-lg text-light-text dark:text-dark-text hover:bg-lime-accent/10 transition-all"
              >
                إغلاق
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Save Button */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex justify-end"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center space-x-2 bg-lime-accent text-light-base dark:text-dark-base px-6 py-3 rounded-xl font-medium hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-light-base dark:border-dark-base border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>{isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
        </motion.button>
      </motion.div>
    </div>
  );
};