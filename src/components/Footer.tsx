import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Mail, Phone, Globe, MessageCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const Footer: React.FC = () => {
  const { t, language } = useLanguage();

  // رسالة الواتساب حسب اللغة
  const getWhatsAppMessage = () => {
    const messages = {
      ar: "مرحباً! أريد الاستفسار عن خدمات TradeHub",
      en: "Hello! I want to inquire about TradeHub services", 
      es: "¡Hola! Quiero consultar sobre los servicios de TradeHub",
      fr: "Bonjour! Je veux me renseigner sur les services TradeHub",
      de: "Hallo! Ich möchte mich über TradeHub-Dienstleistungen erkundigen"
    };
    return encodeURIComponent(messages[language] || messages.en);
  };

  const whatsappLink = `https://wa.me/212779449889?text=${getWhatsAppMessage()}`;

  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-light-surface/80 dark:bg-dark-surface/80 backdrop-blur-glass border-t border-light-border dark:border-dark-border mt-8 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Company Info */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Building2 className="w-6 h-6 text-lime-accent" />
              <h3 className="text-lg font-bold text-lime-accent font-editorial">TradeHub</h3>
            </div>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              {t('footer.company')}
            </p>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <h4 className="font-medium text-light-text dark:text-dark-text">{t('footer.contactUs')}</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                <Phone className="w-4 h-4" />
                <div>
                  <a 
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-lime-accent transition-colors flex items-center gap-1"
                  >
                    +212 779 449889
                    <MessageCircle className="w-3 h-3 text-green-500" />
                  </a>
                  <p className="text-xs text-lime-accent mt-1">
                    {t('footer.arabicCustomerService')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                <Mail className="w-4 h-4" />
                <span>support@tradehub-pay.online</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                <Globe className="w-4 h-4" />
                <span>{t('footer.location')}</span>
              </div>
            </div>
          </div>

          {/* Legal Links */}
          <div className="space-y-3">
            <h4 className="font-medium text-light-text dark:text-dark-text">{t('footer.importantLinks')}</h4>
            <div className="space-y-2">
              <a href="#" className="block text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-lime-accent transition-colors">
                {t('footer.privacyPolicy')}
              </a>
              <a href="#" className="block text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-lime-accent transition-colors">
                {t('footer.termsOfService')}
              </a>
              <a href="#" className="block text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-lime-accent transition-colors">
                {t('footer.disclaimer')}
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-light-border dark:border-dark-border mt-6 pt-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              © {new Date().getFullYear()} TradeHub. {t('footer.allRightsReserved')}
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                {t('auth.centralBankLicensed')}
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-lime-accent rounded-full animate-pulse" />
                <span className="text-xs text-lime-accent">{t('footer.secureEncrypted')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};