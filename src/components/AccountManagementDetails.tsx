import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Bell, Globe, Save, ArrowLeft, CheckCircle, AlertCircle, Camera, Upload, X } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { useUserProfile } from '../hooks/useUserProfile';
import { useUserSettings } from '../hooks/useUserSettings';
import { useLanguage } from '../contexts/LanguageContext';

interface AccountManagementDetailsProps {
  onBack: () => void;
}

export const AccountManagementDetails: React.FC<AccountManagementDetailsProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [user] = useAuthState(auth);
  const { profile, loading, error, updateProfile } = useUserProfile();
  const { settings, loading: settingsLoading, error: settingsError, updateSettings } = useUserSettings();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    country: 'UAE',
    language: 'ar'
  });
  
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    push: false
  });

  // Update form data when profile loads
  React.useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        company: profile.company || '',
        address: profile.address || '',
        city: profile.city || '',
        country: profile.country || 'UAE',
        language: profile.language || 'ar'
      });

      if (profile.profile_image_url) {
        setProfileImageUrl(profile.profile_image_url);
      }
    } else if (user) {
      const nameParts = user.displayName?.split(' ') || [];
      setFormData(prev => ({
        ...prev,
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || ''
      }));
    }
  }, [profile, user]);

  React.useEffect(() => {
    if (settings) {
      setNotifications({
        email: settings.email_notifications,
        sms: settings.sms_notifications,
        push: settings.push_notifications
      });
    }
  }, [settings]);

  const tabs = [
    { id: 'personal', labelKey: 'accountMgmt.personalInfo', icon: User },
    { id: 'notifications', labelKey: 'accountMgmt.notifications', icon: Bell },
    { id: 'preferences', labelKey: 'accountMgmt.preferences', icon: Globe }
  ];

  const handleSave = async () => {
    setIsLoading(true);
    setSaveStatus('idle');

    try {
      const profileSuccess = await updateProfile({
        ...formData,
        profile_image_url: profileImageUrl
      });

      const settingsSuccess = await updateSettings({
        email_notifications: notifications.email,
        sms_notifications: notifications.sms,
        push_notifications: notifications.push
      });

      if (profileSuccess && settingsSuccess) {
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

  const updateNotifications = (field: keyof typeof notifications, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // تصغير الصورة إذا كانت كبيرة جداً
          const maxSize = 400;
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // ضغط الصورة إلى JPEG بجودة 0.6
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // التحقق من نوع الملف
      if (!file.type.startsWith('image/')) {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
        return;
      }

      // التحقق من حجم الملف (5MB كحد أقصى)
      if (file.size > 5 * 1024 * 1024) {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
        return;
      }

      setIsUploadingImage(true);

      try {
        const compressedImage = await compressImage(file);
        setProfileImageUrl(compressedImage);
      } catch (error) {
        console.error('Error compressing image:', error);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const handleRemoveImage = () => {
    setProfileImageUrl('');
  };

  if (loading || settingsLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-lime-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">{t('common.loading')}</p>
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
            <h2 className="text-3xl font-bold text-light-text dark:text-dark-text font-editorial">{t('accountMgmt.title')}</h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">{t('accountMgmt.subtitle')}</p>
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
              {saveStatus === 'success' ? t('accountMgmt.savedSuccessfully') : t('accountMgmt.saveFailed')}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-light-surface/50 dark:bg-dark-surface/50 backdrop-blur-sm border border-light-border dark:border-dark-border rounded-xl p-2"
      >
        <div className="flex space-x-2">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all flex-1 ${
                activeTab === tab.id
                  ? 'bg-lime-accent/20 text-lime-accent border border-lime-accent/30'
                  : 'text-light-text dark:text-dark-text hover:bg-light-glass dark:hover:bg-dark-glass'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-medium">{t(tab.labelKey)}</span>
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
        {activeTab === 'personal' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial">{t('accountMgmt.personalInfo')}</h3>
            
            {/* Profile Picture Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center space-y-4 p-6 bg-light-glass dark:bg-dark-glass rounded-xl border border-light-border dark:border-dark-border"
            >
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-light-glass dark:bg-dark-glass border-4 border-lime-accent/20 shadow-lg">
                  {profileImageUrl ? (
                    <img
                      src={profileImageUrl}
                      alt="الصورة الشخصية"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-lime-accent/20 to-lime-accent/10">
                      <User className="w-16 h-16 text-lime-accent/60" />
                    </div>
                  )}
                </div>
                
                {/* Upload Button Overlay */}
                <motion.label
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute bottom-2 right-2 w-10 h-10 bg-lime-accent rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:shadow-glow transition-all"
                >
                  {isUploadingImage ? (
                    <div className="w-5 h-5 border-2 border-light-base dark:border-dark-base border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 text-light-base dark:text-dark-base" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploadingImage}
                  />
                </motion.label>
              </div>
              
              <div className="text-center space-y-2">
                <h4 className="font-medium text-light-text dark:text-dark-text">{t('accountMgmt.profilePicture')}</h4>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  {t('accountMgmt.selectImage')}
                </p>
                
                <div className="flex items-center space-x-3">
                  <motion.label
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-600 transition-colors text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{t('accountMgmt.uploadImage')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isUploadingImage}
                    />
                  </motion.label>
                  
                  {profileImageUrl && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRemoveImage}
                      className="flex items-center space-x-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                    >
                      <X className="w-4 h-4" />
                      <span>{t('accountMgmt.remove')}</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('accountMgmt.firstName')}</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => updateFormData('first_name', e.target.value)}
                  className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                />
              </div>
              
              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('accountMgmt.lastName')}</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => updateFormData('last_name', e.target.value)}
                  className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                />
              </div>
              
              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('accountMgmt.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl pl-12 pr-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('accountMgmt.phone')}</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl pl-12 pr-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                  />
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('accountMgmt.company')}</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => updateFormData('company', e.target.value)}
                  className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('accountMgmt.address')}</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-4 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                  <textarea
                    value={formData.address}
                    onChange={(e) => updateFormData('address', e.target.value)}
                    rows={3}
                    className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl pl-12 pr-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300 resize-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('accountMgmt.city')}</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateFormData('city', e.target.value)}
                  className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                />
              </div>
              
              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('accountMgmt.country')}</label>
                <select
                  value={formData.country}
                  disabled
                  className="w-full bg-white dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-lime-accent/50 transition-colors duration-300 cursor-not-allowed opacity-75"
                >
                  <optgroup label={t('country.gulfCountries')}>
                    <option value="UAE">{t('country.uae')}</option>
                    <option value="SA">{t('country.saudi')}</option>
                    <option value="QA">{t('country.qatar')}</option>
                    <option value="KW">{t('country.kuwait')}</option>
                    <option value="BH">{t('country.bahrain')}</option>
                    <option value="OM">{t('country.oman')}</option>
                  </optgroup>
                  <optgroup label={t('country.arabCountries')}>
                    <option value="LB">{t('country.lebanon')}</option>
                    <option value="SY">{t('country.syria')}</option>
                    <option value="IQ">{t('country.iraq')}</option>
                    <option value="EG">{t('country.egypt')}</option>
                    <option value="JO">{t('country.jordan')}</option>
                    <option value="TN">{t('country.tunisia')}</option>
                    <option value="DZ">{t('country.algeria')}</option>
                    <option value="MA">{t('country.morocco')}</option>
                    <option value="LY">{t('country.libya')}</option>
                  </optgroup>
                </select>
                <p className="mt-1 text-xs text-light-text-secondary dark:text-dark-text-secondary">{t('accountMgmt.countryCannotBeChanged')}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial">{t('accountMgmt.notifications')}</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-light-glass dark:bg-dark-glass rounded-xl">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-lime-accent" />
                  <div>
                    <p className="font-medium text-light-text dark:text-dark-text">{t('accountMgmt.emailNotifications')}</p>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{t('accountMgmt.emailNotificationsDesc')}</p>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => updateNotifications('email', !notifications.email)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    notifications.email ? 'bg-lime-accent' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <motion.div
                    animate={{ x: notifications.email ? 24 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                  />
                </motion.button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-light-glass dark:bg-dark-glass rounded-xl">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-lime-accent" />
                  <div>
                    <p className="font-medium text-light-text dark:text-dark-text">{t('accountMgmt.smsNotifications')}</p>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{t('accountMgmt.smsNotificationsDesc')}</p>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => updateNotifications('sms', !notifications.sms)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    notifications.sms ? 'bg-lime-accent' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <motion.div
                    animate={{ x: notifications.sms ? 24 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                  />
                </motion.button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-light-glass dark:bg-dark-glass rounded-xl">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-lime-accent" />
                  <div>
                    <p className="font-medium text-light-text dark:text-dark-text">{t('accountMgmt.pushNotifications')}</p>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{t('accountMgmt.pushNotificationsDesc')}</p>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => updateNotifications('push', !notifications.push)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    notifications.push ? 'bg-lime-accent' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <motion.div
                    animate={{ x: notifications.push ? 24 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                  />
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial">{t('accountMgmt.preferences')}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('accountMgmt.appLanguage')}</label>
                <select
                  value={formData.language}
                  onChange={(e) => updateFormData('language', e.target.value)}
                  className="w-full bg-white dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                >
                  <option value="ar" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('language.arabic')}</option>
                  <option value="en" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('language.english')}</option>
                  <option value="fr" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('language.french')}</option>
                  <option value="de" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('language.german')}</option>
                  <option value="es" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('language.spanish')}</option>
                </select>
              </div>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">{t('accountMgmt.importantInfo')}</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {t('accountMgmt.languageNote')}
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Save Button */}
      {(error || settingsError) && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-center">
          <p className="text-red-400">{error || settingsError}</p>
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
          <span>{isLoading ? t('accountMgmt.saving') : t('accountMgmt.saveChanges')}</span>
        </motion.button>
      </motion.div>
    </div>
  );
};