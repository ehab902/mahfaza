import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Building2, Shield, Settings, Phone, Mail } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface AccountServicesProps {
  onNavigate: (section: string) => void;
}

const services = [
  {
    id: 'security-settings',
    titleKey: 'services.security',
    descriptionKey: 'services.securityDesc',
    icon: Shield,
    features: [
      'security.twoFactorAuth',
      'security.changePassword',
      'security.securityAlerts',
      'security.activeSessions'
    ],
    status: 'available'
  },
  {
    id: 'account-management',
    titleKey: 'services.accountManagement',
    descriptionKey: 'services.accountManagementDesc',
    icon: Settings,
    features: [
      'accountMgmt.personalInfo',
      'accountMgmt.address',
      'accountMgmt.notifications',
      'accountMgmt.appLanguage'
    ],
    status: 'available'
  }
];

const supportOptions = [
  {
    id: 'phone',
    titleKey: 'services.phoneSupport',
    descriptionKey: 'services.phoneSupportDesc',
    icon: Phone,
    contact: '+212 779 449 889',
    hours: '24/7'
  },
  {
    id: 'email',
    titleKey: 'services.emailSupport',
    descriptionKey: 'services.emailSupportDesc',
    icon: Mail,
    contact: 'support@tradehub.ae',
    hoursKey: 'services.replyWithin24h'
  }
];

export const AccountServices: React.FC<AccountServicesProps> = ({ onNavigate }) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold text-light-text dark:text-dark-text font-editorial">{t('services.title')}</h2>
        <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">{t('services.subtitle')}</p>
      </motion.div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {services.map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="bg-light-surface/50 dark:bg-dark-surface/50 backdrop-blur-sm border border-light-border dark:border-dark-border rounded-xl p-6 hover:border-lime-accent/30 transition-all hover:shadow-glow duration-300 cursor-pointer"
          >
            <div className="flex items-start space-x-4 mb-4">
              <div className="p-3 bg-lime-accent/10 rounded-full">
                <service.icon className="w-6 h-6 text-lime-accent" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial mb-2">{t(service.titleKey)}</h3>
                <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm mb-4">{t(service.descriptionKey)}</p>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-light-text dark:text-dark-text">{t('services.availableFeatures')}:</p>
                  <ul className="space-y-1">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="text-xs text-light-text-secondary dark:text-dark-text-secondary flex items-center space-x-2">
                        <div className="w-1 h-1 bg-lime-accent rounded-full" />
                        <span>{t(feature)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-light-border dark:border-dark-border">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-lime-accent/20 text-lime-accent">
                {t('services.available')}
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (service.id === 'account-management') {
                    onNavigate('account-management');
                  } else if (service.id === 'security-settings') {
                    onNavigate('security-settings');
                  }
                }}
                className="bg-lime-accent text-light-base dark:text-dark-base px-4 py-2 rounded-lg font-medium hover:shadow-glow transition-all text-sm"
              >
                {t('services.startNow')}
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Support Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-gradient-to-r from-light-surface/80 to-light-glass dark:from-dark-surface/80 dark:to-dark-glass border border-light-border dark:border-dark-border rounded-2xl p-6 shadow-glass transition-colors duration-300"
      >
        <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial mb-4">{t('services.needHelp')}</h3>
        <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6">{t('services.supportTeam')}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {supportOptions.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
              className="flex items-center space-x-4 p-4 bg-light-glass dark:bg-dark-glass rounded-xl hover:bg-lime-accent/5 transition-colors"
            >
              <div className="p-3 bg-lime-accent/10 rounded-full">
                <option.icon className="w-5 h-5 text-lime-accent" />
              </div>
              <div>
                <h4 className="font-medium text-light-text dark:text-dark-text">{t(option.titleKey)}</h4>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">{t(option.descriptionKey)}</p>
                <p className="text-sm font-medium text-lime-accent">{option.contact}</p>
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{option.hoursKey ? t(option.hoursKey) : option.hours}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

    </div>
  );
};