import React, { useState } from 'react';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthPage } from './components/AuthPage';
import { EmailVerificationPage } from './components/EmailVerificationPage';
import { PhoneVerificationPage } from './components/PhoneVerificationPage';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { AccountAndIBAN } from './components/AccountAndIBAN';
import { VirtualCards } from './components/VirtualCards';
import { TransactionTimeline } from './components/TransactionTimeline';
import { AccountTopUp } from './components/AccountTopUp';
import { StatementsAndCertificates } from './components/StatementsAndCertificates';
import { MoneyTransfer } from './components/MoneyTransfer';
import { AccountServices } from './components/AccountServices';
import { AccountManagementDetails } from './components/AccountManagementDetails';
import { SecuritySettings } from './components/SecuritySettings';
import { Footer } from './components/Footer';
import { KYCUpload } from './components/KYCUpload';
import { KYCVerificationBanner } from './components/KYCVerificationBanner';
import { KYCBlockedOverlay } from './components/KYCBlockedOverlay';
import { useKYCSubmission } from './hooks/useKYCSubmission';

function App() {
  const [activeSection, setActiveSection] = useState('account');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [verificationStep, setVerificationStep] = useState<'email' | 'phone' | 'completed' | null>(null);
  const [showKYCUpload, setShowKYCUpload] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setIsAuthenticated(!!user);

      if (user) {
        try {
          const q = query(collection(db, 'user_profiles'), where('user_id', '==', user.uid));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            const step = userData.verification_step || 'completed';
            setVerificationStep(step);
          } else {
            setVerificationStep('completed');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setVerificationStep('completed');
        }
      } else {
        setVerificationStep(null);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Show loading screen while checking auth state
  if (isLoading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-light-base dark:bg-dark-base flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-lime-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-light-text dark:text-dark-text">جاري التحميل...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  const renderMainContent = (kycSubmission: any) => {
    const isKYCApproved = kycSubmission?.status === 'approved';
    const needsKYC = !kycSubmission || kycSubmission.status === 'rejected';

    switch (activeSection) {
      case 'account':
        return <AccountAndIBAN />;
      case 'cards':
        return (
          <div className="relative">
            <VirtualCards />
            {!isKYCApproved && <KYCBlockedOverlay onVerify={() => setShowKYCUpload(true)} feature="البطاقات الافتراضية" status={kycSubmission?.status} />}
          </div>
        );
      case 'transactions':
        return <TransactionTimeline />;
      case 'topup':
        return (
          <div className="relative">
            <AccountTopUp />
            {!isKYCApproved && <KYCBlockedOverlay onVerify={() => setShowKYCUpload(true)} feature="شحن الحساب" status={kycSubmission?.status} />}
          </div>
        );
      case 'statements':
        return (
          <div className="relative">
            <StatementsAndCertificates />
            {!isKYCApproved && <KYCBlockedOverlay onVerify={() => setShowKYCUpload(true)} feature="الكشوف والشهادات" status={kycSubmission?.status} />}
          </div>
        );
      case 'transfer':
        return (
          <div className="relative">
            <MoneyTransfer />
            {!isKYCApproved && <KYCBlockedOverlay onVerify={() => setShowKYCUpload(true)} feature="تحويل الأموال" status={kycSubmission?.status} />}
          </div>
        );
      case 'services':
        return (
          <div className="relative">
            <AccountServices onNavigate={setActiveSection} />
            {!isKYCApproved && <KYCBlockedOverlay onVerify={() => setShowKYCUpload(true)} feature="خدمات الحساب" status={kycSubmission?.status} />}
          </div>
        );
      case 'account-management':
        return (
          <div className="relative">
            <AccountManagementDetails onBack={() => setActiveSection('services')} />
            {!isKYCApproved && <KYCBlockedOverlay onVerify={() => setShowKYCUpload(true)} feature="إدارة الحساب" status={kycSubmission?.status} />}
          </div>
        );
      case 'security-settings':
        return <SecuritySettings onBack={() => setActiveSection('services')} />;
      default:
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center h-96"
          >
            <div className="text-center p-8 bg-light-surface/50 dark:bg-dark-surface/50 backdrop-blur-sm border border-light-border dark:border-dark-border rounded-2xl shadow-glass">
              <div className="w-16 h-16 bg-lime-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 border-2 border-lime-accent border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-2xl font-bold text-light-text dark:text-dark-text font-editorial mb-2">قريباً</h2>
              <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">هذا القسم قيد التطوير</p>
              <div className="flex items-center justify-center space-x-2 text-sm text-lime-accent">
                <span>جاري العمل على تطوير هذه الميزة</span>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-lime-accent rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-lime-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-lime-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </motion.div>
        );
    }
  };

  const handleEmailVerified = () => {
    setVerificationStep('completed');
  };

  const handlePhoneVerified = () => {
    setVerificationStep('completed');
  };

  const handlePhoneSkipped = () => {
    setVerificationStep('completed');
  };

  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          {!isAuthenticated ? (
            <AuthPage />
          ) : (
            <AppContent
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              renderMainContent={renderMainContent}
              isMobileMenuOpen={isMobileMenuOpen}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
              showKYCUpload={showKYCUpload}
              setShowKYCUpload={setShowKYCUpload}
            />
          )}
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

const AppContent: React.FC<{
  activeSection: string;
  setActiveSection: (section: string) => void;
  renderMainContent: (kycSubmission: any) => React.ReactNode;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  showKYCUpload: boolean;
  setShowKYCUpload: (show: boolean) => void;
}> = ({ activeSection, setActiveSection, renderMainContent, isMobileMenuOpen, setIsMobileMenuOpen, showKYCUpload, setShowKYCUpload }) => {
  const { submission, loading } = useKYCSubmission();

  return (
    <div className="min-h-screen bg-light-base dark:bg-dark-base text-light-text dark:text-dark-text font-editorial transition-colors duration-300">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-lime-accent/5 dark:bg-lime-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-lime-accent/3 dark:bg-lime-accent/3 rounded-full blur-3xl"></div>
      </div>

      <div className="flex h-screen relative overflow-hidden">
        {/* Sidebar */}
        <div className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out fixed lg:relative z-50 h-full`}>
          <Sidebar 
            activeSection={activeSection} 
            onSectionChange={(section) => {
              setActiveSection(section);
              setIsMobileMenuOpen(false);
            }} 
          />
        </div>
        
        {/* Mobile overlay */}
        {isMobileMenuOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-40 lg:z-auto"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
          <TopBar 
            onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            onNavigate={setActiveSection}
          />
          
          {/* Content Area */}
          <div className="flex-1 overflow-auto pb-20 lg:pb-24 relative z-10">
            <div className="p-4 lg:p-8">
              {!loading && submission?.status !== 'approved' && (
                <div className="mb-8">
                  <KYCVerificationBanner
                    onVerify={() => setShowKYCUpload(true)}
                    status={submission?.status || 'none'}
                  />
                </div>
              )}
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-lime-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-light-text dark:text-dark-text">جاري التحميل...</p>
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    {renderMainContent(submission)}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
            <Footer />
          </div>
        </div>
      </div>

      {showKYCUpload && (
        <KYCUpload
          onSuccess={() => {
            setShowKYCUpload(false);
          }}
          onCancel={() => setShowKYCUpload(false)}
        />
      )}
    </div>
  );
};

export default App;
