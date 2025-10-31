import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Building2, Users, CreditCard, ArrowRight, CheckCircle, Clock, AlertCircle, Upload, MessageCircle, Copy, Search, MapPin, Phone } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useBankAccount } from '../hooks/useBankAccount';
import { useTransactions } from '../hooks/useTransactions';
import { useNotifications } from '../hooks/useNotifications';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAgents, useAgentTransactions } from '../hooks/useAgents';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface AccountTopUpProps {}

interface TopUpMethod {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  processingTime: string;
  fees: string;
  minAmount: number;
  maxAmount: number;
  status: 'available' | 'maintenance' | 'coming-soon';
}

const topUpMethods: TopUpMethod[] = [
  {
    id: 'western-union',
    name: 'topup.methodWesternUnion',
    icon: Wallet,
    description: 'topup.descWesternUnion',
    processingTime: 'topup.processingTimeWU',
    fees: '2.5% + 4 EUR',
    minAmount: 100,
    maxAmount: 50000,
    status: 'available'
  },
  {
    id: 'agents',
    name: 'topup.methodAgents',
    icon: Users,
    description: 'topup.descAgents',
    processingTime: 'topup.processingTimeAgents',
    fees: '1.5% + 2.5 EUR',
    minAmount: 50,
    maxAmount: 25000,
    status: 'available'
  },
  {
    id: 'bank-transfer',
    name: 'topup.methodBankTransfer',
    icon: Building2,
    description: 'topup.descBankTransfer',
    processingTime: 'topup.processingTimeBank',
    fees: '0.5% (حد أدنى 1.5 EUR)',
    minAmount: 500,
    maxAmount: 100000,
    status: 'available'
  },
  {
    id: 'debit-card',
    name: 'topup.methodDebitCard',
    icon: CreditCard,
    description: 'topup.descDebitCard',
    processingTime: 'topup.processingTimeInstant',
    fees: '2% + 1.5 EUR',
    minAmount: 25,
    maxAmount: 10000,
    status: 'maintenance'
  }
];

export const AccountTopUp: React.FC<AccountTopUpProps> = () => {
  const { t } = useLanguage();
  const [user] = useAuthState(auth);
  const { profile, loading: profileLoading } = useUserProfile();
  // Database hooks
  const { account, loading: accountLoading, updateBalance } = useBankAccount();
  const { transactions, loading: transactionsLoading, createTransaction } = useTransactions(10);
  const { createNotification } = useNotifications();
  // Filter agents by user's registered country
  const { agents, loading: agentsLoading, error: agentsError } = useAgents(profile?.country);
  const { transactions: agentTransactions, createAgentTransaction } = useAgentTransactions();
  
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const currency = 'EUR';
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const westernUnionFormRef = useRef<HTMLDivElement>(null);
  const [westernUnionData, setWesternUnionData] = useState({
    mtcn: '',
    senderName: '',
    receiptFile: null as File | null,
    transactionNumber: ''
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false);
  const [transactionSuccess, setTransactionSuccess] = useState(false);
  const [successfulAgentData, setSuccessfulAgentData] = useState<any>(null);
  const [transactionReference, setTransactionReference] = useState<string>('');
  
  // Get user's registered country
  const registeredCountry = profile?.country || 'Unknown';
  
  // Helper function to get user display name
  const getUserDisplayName = () => {
    if (profile && profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile && profile.first_name) {
      return profile.first_name;
    }
    if (user && user.displayName) {
      return user.displayName;
    }
    if (user && user.email) {
      const emailParts = user.email.split('@');
      return emailParts[0];
    }
    return t('common.user');
  };

  // Get country code from country name
  function getCountryCode(countryName: string): string {
    const countryMap: { [key: string]: string } = {
      'lebanon': 'Lebanon',
      'jordan': 'Jordan',
      'uae': 'UAE',
      'saudi arabia': 'Saudi Arabia',
      'qatar': 'Qatar',
      'kuwait': 'Kuwait',
      'bahrain': 'Bahrain',
      'oman': 'Oman',
      'egypt': 'Egypt',
      'morocco': 'Morocco'
    };
    return countryMap[countryName.toLowerCase()] || countryName;
  }

  // Get country name in Arabic
  function getCountryNameArabic(countryName: string): string {
    if (!countryName) return t('common.unspecified');

    const upperCode = countryName.toUpperCase();

    const countryMap: { [key: string]: string } = {
      // دول الخليج
      'UAE': t('country.uae'),
      'SA': t('country.saudiArabia'),
      'QA': t('country.qatar'),
      'KW': t('country.kuwait'),
      'BH': t('country.bahrain'),
      'OM': t('country.oman'),
      // دول عربية
      'LB': t('country.lebanon'),
      'LEBANON': t('country.lebanon'),
      'SY': t('country.syria'),
      'SYRIA': t('country.syria'),
      'JO': t('country.jordan'),
      'JORDAN': t('country.jordan'),
      'EG': t('country.egypt'),
      'EGYPT': t('country.egypt'),
      'MA': t('country.morocco'),
      'MOROCCO': t('country.morocco'),
      'IQ': t('country.iraq'),
      'TN': t('country.tunisia'),
      'DZ': t('country.algeria'),
      'LY': t('country.libya'),
      // دول أخرى
      'TR': t('country.turkey'),
      'SAUDI ARABIA': t('country.saudiArabia'),
      'UNKNOWN': t('common.unknown')
    };

    return countryMap[upperCode] || countryName;
  }

  // Get user's registered country from profile or use prop
  const userCountry = profile?.country?.toLowerCase() || registeredCountry;
  
  // Filter transactions to show only deposits (top-ups)
  const recentTopUps = transactions.filter(t => t.type === 'deposit').slice(0, 5);
  const agentsFormRef = useRef<HTMLDivElement>(null);
  const bankTransferFormRef = useRef<HTMLDivElement>(null);

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateTransaction = async () => {
    if (!selectedAgent || !amount) return;

    const agent = agents.find(a => a.id === selectedAgent);
    if (!agent) return;

    setIsCreatingTransaction(true);
    try {
      // Generate transaction reference
      const reference = `TU${Date.now().toString().slice(-10)}`;
      setTransactionReference(reference);

      await createAgentTransaction({
        agent_id: selectedAgent,
        transaction_type: 'deposit',
        amount: parseFloat(amount),
        currency: currency,
        notes: `تعبئة حساب عبر الوكيل - ${reference}`
      });

      // Show success and save agent data for WhatsApp
      setSuccessfulAgentData(agent);
      setTransactionSuccess(true);
    } catch (error) {
      console.error('Error creating transaction:', error);
    } finally {
      setIsCreatingTransaction(false);
    }
  };

  const handleWhatsAppContact = (phone: string, agentName: string) => {
    const message = encodeURIComponent(
      `مرحباً ${agentName}، أود تعبئة حسابي بمبلغ ${amount} EUR. المعاملة رقم: ${transactionReference}`
    );
    const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCloseSuccess = () => {
    setTransactionSuccess(false);
    setSuccessfulAgentData(null);
    setSelectedAgent(null);
    setAmount('');
  };

  // Auto-scroll to form when Western Union is selected
  useEffect(() => {
    if (selectedMethod === 'western-union' && westernUnionFormRef.current) {
      setTimeout(() => {
        westernUnionFormRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 300); // Small delay to allow animation to start
    }
  }, [selectedMethod]);

  // Auto-scroll to form when Agents Network is selected
  useEffect(() => {
    if (selectedMethod === 'agents' && agentsFormRef.current) {
      setTimeout(() => {
        agentsFormRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 300);
    }
  }, [selectedMethod]);

  // Auto-scroll to form when Bank Transfer is selected
  useEffect(() => {
    if (selectedMethod === 'bank-transfer' && bankTransferFormRef.current) {
      setTimeout(() => {
        bankTransferFormRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 300);
    }
  }, [selectedMethod]);

  const generateTransactionNumber = () => {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `WU${timestamp}${random}`;
  };

  const showMessage = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccessMessage(message);
      setError(null);
      setTimeout(() => setSuccessMessage(null), 5000);
    } else {
      setError(message);
      setSuccessMessage(null);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };


  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setWesternUnionData(prev => ({ ...prev, receiptFile: file }));
    }
  };

  const handleWesternUnionSubmit = () => {
    if (westernUnionData.mtcn && westernUnionData.senderName && westernUnionData.receiptFile && amount) {
      handleTopUpSubmit('western-union', westernUnionData.mtcn);
    }
  };

  const handleBankTransferSubmit = () => {
    if (amount && currency) {
      const reference = `BT${Date.now().toString().slice(-8)}`;
      handleTopUpSubmit('bank-transfer', reference);
    }
  };

  const handleAgentTopUpSubmit = (agentId: string) => {
    if (amount && currency && selectedAgent) {
      const selectedAgentData = agents.find(a => a.id === agentId);
      if (selectedAgentData) {
        const reference = `AG${Date.now().toString().slice(-8)}`;
        handleTopUpSubmit('agents', reference, selectedAgentData.name);
      }
    }
  };

  const handleTopUpSubmit = async (method: string, reference: string, agentName?: string) => {
    if (!amount || !currency) {
      showMessage(t('topup.enterAmountAndCurrency'), 'error');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showMessage(t('topup.enterValidAmount'), 'error');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let receiptUrl = '';

      if (method === 'western-union' && westernUnionData.receiptFile && user) {
        const timestamp = Date.now();
        const fileName = `receipts/${user.uid}/${timestamp}_${westernUnionData.receiptFile.name}`;
        const storageRef = ref(storage, fileName);

        await uploadBytes(storageRef, westernUnionData.receiptFile);
        receiptUrl = await getDownloadURL(storageRef);
      }

      let description = '';
      let recipient = '';

      switch (method) {
        case 'western-union':
          description = 'Western Union Top-up';
          recipient = t('topup.methodWesternUnion');
          break;
        case 'bank-transfer':
          description = 'Bank Transfer Top-up';
          recipient = t('topup.methodBankTransfer');
          break;
        case 'agents':
          description = `Agent Network Top-up via ${agentName}`;
          recipient = agentName || t('topup.methodAgents');
          break;
        default:
          description = 'Account Top-up';
          recipient = 'TradeHub';
      }

      const transactionData: any = {
        type: 'deposit',
        amount: amountNum,
        currency: currency,
        recipient: recipient,
        location: userCountry === 'lebanon' ? 'Lebanon' : userCountry === 'syria' ? 'Syria' : 'Jordan',
        country_flag: userCountry === 'lebanon' ? '🇱🇧' : userCountry === 'syria' ? '🇸🇾' : '🇯🇴',
        category: 'Deposit',
        description: description,
        reference: reference,
        method: selectedMethod || 'unknown'
      };

      if (receiptUrl) {
        transactionData.receipt_url = receiptUrl;
      }

      const transaction = await createTransaction(transactionData);

      if (transaction) {
        // إنشاء إشعار بنجاح إرسال الطلب
        await createNotification({
          type: 'info',
          title: t('topup.requestSubmitted'),
          message: t('topup.requestSubmittedMessage', { amount: amountNum.toLocaleString(), currency }),
          description: t('topup.requestPendingReview')
        });

        showMessage(t('topup.requestSubmittedSuccess'), 'success');

        // إعادة تعيين النموذج
        setAmount('');
        setSelectedMethod(null);
        if (method === 'western-union') {
          setWesternUnionData({
            mtcn: '',
            senderName: '',
            receiptFile: null,
            transactionNumber: ''
          });
        }
        setSelectedAgent(null);
      } else {
        showMessage(t('topup.failedToRegisterTransaction'), 'error');
      }
    } catch (err) {
      console.error('Error processing top-up:', err);
      showMessage(t('topup.errorProcessingTopUp'), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWesternUnionSubmitOld = () => {
    if (westernUnionData.mtcn && westernUnionData.senderName && westernUnionData.receiptFile && amount) {
      const transactionNumber = generateTransactionNumber();
      setWesternUnionData(prev => ({ ...prev, transactionNumber }));
      // هنا يمكن إرسال البيانات إلى الخادم
      console.log('Western Union data:', { ...westernUnionData, transactionNumber, amount });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-lime-accent/20 text-lime-accent';
      case 'maintenance':
        return 'bg-orange-500/20 text-orange-400';
      case 'coming-soon':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return t('topup.statusAvailable');
      case 'maintenance':
        return t('topup.statusMaintenance');
      case 'coming-soon':
        return t('topup.statusComingSoon');
      default:
        return t('topup.statusUnknown');
    }
  };

  const getTransactionStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-lime-accent" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-orange-400" />;
      case 'rejected':
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTransactionStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return t('topup.transactionStatusCompleted');
      case 'approved':
        return t('topup.transactionStatusApproved');
      case 'pending':
        return t('topup.transactionStatusPending');
      case 'rejected':
        return t('topup.transactionStatusRejected');
      case 'cancelled':
        return t('topup.transactionStatusCancelled');
      case 'failed':
        return t('topup.transactionStatusFailed');
      default:
        return t('topup.transactionStatusUnknown');
    }
  };

  // Helper function to get method name in Arabic
  const getMethodNameArabic = (type: string) => {
    switch (type) {
      case 'deposit':
        if (recentTopUps.find(t => t.recipient === t('topup.methodWesternUnion'))) return t('topup.methodWesternUnion');
        if (recentTopUps.find(t => t.recipient === t('topup.methodBankTransfer'))) return t('topup.methodBankTransfer');
        if (recentTopUps.find(t => t.recipient?.includes(t('topup.methodAgents')))) return t('topup.methodAgents');
        return t('topup.topUpAccount');
      default:
        return t('common.unspecified');
    }
  };

  // Show loading state while profile is loading
  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-lime-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">{t('topup.loadingData')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {(accountLoading || transactionsLoading) && (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-lime-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">{t('topup.loadingAccountData')}</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 flex items-center space-x-3"
        >
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-400 font-medium">{successMessage}</span>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center space-x-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400 font-medium">{error}</span>
        </motion.div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold text-light-text dark:text-dark-text font-editorial">{t('topup.title')}</h2>
        <div className="flex items-center justify-between mt-1">
          <p className="text-light-text-secondary dark:text-dark-text-secondary">{t('topup.subtitle')}</p>
          {account && (
            <div className="text-right">
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{t('topup.currentBalance')}</p>
              <p className="text-lg font-bold text-lime-accent">{account.balance.toLocaleString()} {account.currency}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Top-up Methods Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {topUpMethods.map((method, index) => (
          <motion.div
            key={method.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => method.status === 'available' && setSelectedMethod(method.id)}
            className={`bg-light-surface/50 dark:bg-dark-surface/50 backdrop-blur-sm border border-light-border dark:border-dark-border rounded-xl p-6 transition-all duration-300 cursor-pointer ${
              method.status === 'available' 
                ? 'hover:border-lime-accent/30 hover:shadow-glow' 
                : 'opacity-60 cursor-not-allowed'
            } ${selectedMethod === method.id ? 'border-lime-accent/50 bg-lime-accent/5' : ''}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-lime-accent/10 rounded-full">
                  <method.icon className="w-6 h-6 text-lime-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-light-text dark:text-dark-text font-editorial">{t(method.name)}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(method.status)}`}>
                    {getStatusText(method.status)}
                  </span>
                </div>
              </div>
              {selectedMethod === method.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 bg-lime-accent rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="w-4 h-4 text-light-base dark:text-dark-base" />
                </motion.div>
              )}
            </div>

            <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm mb-4">{t(method.description)}</p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('topup.processingTime')}:</span>
                <span className="text-light-text dark:text-dark-text font-medium">{t(method.processingTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('topup.fees')}:</span>
                <span className="text-light-text dark:text-dark-text font-medium">{method.fees}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('topup.minMaxAmount')}:</span>
                <span className="text-light-text dark:text-dark-text font-medium">
                  {method.minAmount.toLocaleString()} - {method.maxAmount.toLocaleString()} EUR
                </span>
              </div>
            </div>

            {method.status === 'available' && (
              <div className="flex items-center justify-end mt-4 pt-4 border-t border-light-border dark:border-dark-border">
                <ArrowRight className="w-5 h-5 text-lime-accent" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Western Union Form */}
      {selectedMethod === 'western-union' && (
        <motion.div
          ref={westernUnionFormRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-light-surface/80 to-light-glass dark:from-dark-surface/80 dark:to-dark-glass border border-light-border dark:border-dark-border rounded-2xl p-6 shadow-glass transition-colors duration-300"
        >
          <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial mb-4">{t('topup.westernUnionDetails')}</h3>
          
          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>{t('topup.wuInstructionsTitle')}</strong> {t('topup.wuInstructionsDesc')}
              </p>
            </div>

            {/* Recipient Information */}
            <div className="bg-lime-accent/10 border border-lime-accent/30 rounded-xl p-4">
              <h4 className="font-medium text-light-text dark:text-dark-text mb-3">{t('topup.recipientInfo')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('topup.name')}:</span>
                  <p className="font-medium text-light-text dark:text-dark-text">FATIMA ES SAHNOUNY</p>
                </div>
                <div>
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('topup.city')}:</span>
                  <p className="font-medium text-light-text dark:text-dark-text">Morocco Casablanca</p>
                </div>
                <div>
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('topup.phone')}:</span>
                  <p className="font-medium text-light-text dark:text-dark-text">+212 779 449 889</p>
                </div>
                <div>
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('topup.purpose')}:</span>
                  <p className="font-medium text-light-text dark:text-dark-text">{t('topup.topUpAccount')}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('topup.amount')}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={t('topup.enterAmount')}
                    className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 pr-12 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary">{currency}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('topup.mtcn')}</label>
                <input
                  type="text"
                  value={westernUnionData.mtcn}
                  onChange={(e) => setWesternUnionData(prev => ({ ...prev, mtcn: e.target.value }))}
                  placeholder={t('topup.enterMtcn')}
                  className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                />
              </div>
              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('topup.senderName')}</label>
                <input
                  type="text"
                  value={westernUnionData.senderName}
                  onChange={(e) => setWesternUnionData(prev => ({ ...prev, senderName: e.target.value }))}
                  placeholder={t('topup.enterSenderName')}
                  className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                />
              </div>
            </div>

            {/* Receipt Upload */}
            <div>
              <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('topup.receiptImage')}</label>
              <div className="border-2 border-dashed border-light-border dark:border-dark-border rounded-xl p-4 text-center hover:border-lime-accent/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="receipt-upload"
                />
                <label htmlFor="receipt-upload" className="cursor-pointer">
                  <Upload className="w-6 h-6 text-light-text-secondary dark:text-dark-text-secondary mx-auto mb-2" />
                  <p className="text-sm text-light-text dark:text-dark-text font-medium mb-1">
                    {westernUnionData.receiptFile ? westernUnionData.receiptFile.name : t('topup.uploadReceipt')}
                  </p>
                  <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                    {t('topup.receiptFormat')}
                  </p>
                </label>
              </div>
            </div>

            {/* Transaction Number Display */}
            {westernUnionData.transactionNumber && (
              <div className="bg-lime-accent/10 border border-lime-accent/30 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{t('topup.transactionNumber')}</p>
                    <p className="font-mono text-base font-bold text-lime-accent">{westernUnionData.transactionNumber}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCopy(westernUnionData.transactionNumber, 'transaction')}
                    className="p-2 bg-lime-accent/10 rounded-lg hover:bg-lime-accent/20 transition-colors"
                  >
                    <Copy className={`w-4 h-4 ${copiedField === 'transaction' ? 'text-lime-accent' : 'text-light-text-secondary dark:text-dark-text-secondary'}`} />
                  </motion.button>
                </div>
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                  {t('topup.keepReference')}
                </p>
              </div>
            )}

            {/* WhatsApp Support */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">{t('topup.needHelp')}</p>
                </div>
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="https://wa.me/212779449889?text=مرحباً%2C%20لدي%20استفسار%20بخصوص%20تعبئة%20الرصيد%20عبر%20ويسترن%20يونيون"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">{t('topup.whatsapp')}</span>
                </motion.a>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleWesternUnionSubmit}
              disabled={isProcessing || !westernUnionData.mtcn || !westernUnionData.senderName || !westernUnionData.receiptFile || !amount}
              className="bg-lime-accent text-light-base dark:text-dark-base px-6 py-3 rounded-xl font-medium hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-light-base dark:border-dark-base border-t-transparent rounded-full animate-spin" />
                  <span>{t('topup.processing')}</span>
                </>
              ) : (
                <span>{t('topup.confirmTransfer')}</span>
              )}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Bank Transfer Form */}
      {selectedMethod === 'bank-transfer' && (
        <motion.div
          ref={bankTransferFormRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-light-surface/80 to-light-glass dark:from-dark-surface/80 dark:to-dark-glass border border-light-border dark:border-dark-border rounded-2xl p-6 shadow-glass transition-colors duration-300"
        >
          <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial mb-4">{t('topup.bankTransferDetails')}</h3>
          
          <div className="space-y-6">
            {/* Bank Information */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <h4 className="font-medium text-light-text dark:text-dark-text mb-3">{t('topup.receivingBankInfo')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('topup.bankName')}:</span>
                  <p className="font-medium text-light-text dark:text-dark-text">Emirates NBD Bank</p>
                </div>
                <div>
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('topup.accountNumber')}:</span>
                  <div className="flex items-center space-x-2">
                    <p className="font-mono text-light-text dark:text-dark-text">AE070331234567890123456</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCopy('AE070331234567890123456', 'bank-account')}
                      className="p-1 hover:bg-lime-accent/10 rounded transition-colors"
                    >
                      <Copy className={`w-3 h-3 ${copiedField === 'bank-account' ? 'text-lime-accent' : 'text-light-text-secondary dark:text-dark-text-secondary'}`} />
                    </motion.button>
                  </div>
                </div>
                <div>
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('topup.swiftCode')}:</span>
                  <div className="flex items-center space-x-2">
                    <p className="font-mono text-light-text dark:text-dark-text">EBILAEAD</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCopy('EBILAEAD', 'swift-code')}
                      className="p-1 hover:bg-lime-accent/10 rounded transition-colors"
                    >
                      <Copy className={`w-3 h-3 ${copiedField === 'swift-code' ? 'text-lime-accent' : 'text-light-text-secondary dark:text-dark-text-secondary'}`} />
                    </motion.button>
                  </div>
                </div>
                <div>
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('topup.beneficiaryName')}:</span>
                  <p className="font-medium text-light-text dark:text-dark-text">TradeHub Financial Services LLC</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('topup.transferredAmount')}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={t('topup.enterAmount')}
                    className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 pr-12 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary">{currency}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('topup.referenceNumberOptional')}</label>
                <input
                  type="text"
                  placeholder={t('topup.referenceNumberPlaceholder')}
                  className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                />
              </div>
              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('topup.transferDate')}</label>
                <input
                  type="date"
                  className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
              <h5 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">{t('topup.importantInstructions')}</h5>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• {t('topup.instruction1')}</li>
                <li>• {t('topup.instruction2')}</li>
                <li>• {t('topup.instruction3')}</li>
                <li>• {t('topup.instruction4')}</li>
              </ul>
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBankTransferSubmit}
              disabled={isProcessing || !amount || !currency}
              className="bg-lime-accent text-light-base dark:text-dark-base px-6 py-3 rounded-xl font-medium hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-light-base dark:border-dark-base border-t-transparent rounded-full animate-spin" />
                  <span>{t('topup.processing')}</span>
                </>
              ) : (
                <span>{t('topup.confirmTransfer')}</span>
              )}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Debit Card Form */}
      {selectedMethod === 'debit-card' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-light-surface/80 to-light-glass dark:from-dark-surface/80 dark:to-dark-glass border border-light-border dark:border-dark-border rounded-2xl p-6 shadow-glass transition-colors duration-300"
        >
          <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial mb-4">{t('topup.debitCardPayment')}</h3>
          
          <div className="space-y-6">
            {/* Maintenance Notice */}
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-6 h-6 text-orange-500" />
                <div>
                  <h4 className="font-medium text-orange-800 dark:text-orange-200">{t('topup.serviceUnderMaintenance')}</h4>
                  <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">
                    {t('topup.maintenanceMessage')}
                  </p>
                </div>
              </div>
            </div>

            {/* Card Form (Disabled) */}
            <div className="opacity-50 pointer-events-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('topup.cardNumber')}</label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    disabled
                    className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('topup.expiryDate')}</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    disabled
                    className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('topup.securityCode')}</label>
                  <input
                    type="text"
                    placeholder="123"
                    disabled
                    className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('topup.cardholderName')}</label>
                  <input
                    type="text"
                    placeholder={t('topup.cardholderNamePlaceholder')}
                    disabled
                    className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('topup.amount')}</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder={t('topup.enterAmount')}
                      disabled
                      className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 pr-12 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary">EUR</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('topup.currency')}</label>
                  <select
                    disabled
                    className="w-full bg-white dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-lime-accent/50 transition-colors duration-300 opacity-75"
                  >
                    <option value="EUR" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('topup.eur')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Alternative Payment Methods */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-3">{t('topup.alternativePaymentMethods')}</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedMethod('western-union')}
                  className="flex items-center space-x-2 p-3 bg-white dark:bg-dark-surface border border-blue-200 dark:border-blue-700 rounded-lg hover:border-lime-accent/50 transition-colors text-sm"
                >
                  <Wallet className="w-4 h-4 text-lime-accent" />
                  <span className="text-light-text dark:text-dark-text">{t('topup.methodWesternUnion')}</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedMethod('agents')}
                  className="flex items-center space-x-2 p-3 bg-white dark:bg-dark-surface border border-blue-200 dark:border-blue-700 rounded-lg hover:border-lime-accent/50 transition-colors text-sm"
                >
                  <Users className="w-4 h-4 text-lime-accent" />
                  <span className="text-light-text dark:text-dark-text">{t('topup.methodAgents')}</span>
                </motion.button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled
              className="bg-gray-400 text-white px-6 py-3 rounded-xl font-medium cursor-not-allowed opacity-50"
            >
              {t('topup.notAvailable')}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Agents Network Form */}
      {selectedMethod === 'agents' && (
        <motion.div
          ref={agentsFormRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-light-surface/80 to-light-glass dark:from-dark-surface/80 dark:to-dark-glass border border-light-border dark:border-dark-border rounded-2xl p-6 shadow-glass transition-colors duration-300"
        >
          <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial mb-4">{t('topup.agentsNetwork')}</h3>
          
          {/* Country Info */}
          <div className="mb-6 p-4 bg-lime-accent/10 border border-lime-accent/30 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-lime-accent rounded-full"></div>
              <p className="text-sm text-light-text dark:text-dark-text">
                <strong>{t('topup.registeredCountry')}:</strong> {getCountryNameArabic(registeredCountry)}
              </p>
            </div>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-2">
              {t('topup.agentsCountryRestriction', { country: getCountryNameArabic(registeredCountry) })}
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
              <input
                type="text"
                placeholder={t('topup.searchAgent')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text placeholder-light-text-secondary dark:placeholder-dark-text-secondary focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
              />
            </div>
          </div>

          {/* Loading State */}
          {agentsLoading && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-lime-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-light-text-secondary dark:text-dark-text-secondary">{t('topup.loadingAgents')}</p>
            </div>
          )}

          {/* Error State */}
          {agentsError && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-center mb-6">
              <p className="text-red-400">{agentsError}</p>
            </div>
          )}

          {/* Agents List */}
          {!agentsLoading && !agentsError && filteredAgents.length > 0 ? (
            <div className="space-y-4">
              {filteredAgents.map((agent, index) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedAgent(agent.id)}
                  className={`p-6 border rounded-xl cursor-pointer transition-all ${
                    selectedAgent === agent.id
                      ? 'border-lime-accent/50 bg-lime-accent/5'
                      : 'border-light-border dark:border-dark-border hover:border-lime-accent/30'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    {agent.avatar_url && (
                      <img
                        src={agent.avatar_url}
                        alt={agent.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-lime-accent/30"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-light-text dark:text-dark-text mb-1">
                        {agent.name}
                      </h3>
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        {t('topup.agentCode')}: {agent.code} • {agent.city}
                      </p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>{agent.country}</span>
                    </div>
                    {agent.phone && (
                      <div className="flex items-center gap-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span dir="ltr">{agent.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      <Users className="w-4 h-4 flex-shrink-0" />
                      <span>{(agent.total_transactions || 0)} {t('common.transaction')}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-light-border dark:border-dark-border">
                    <div className="text-sm">
                      <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('topup.commission')}: </span>
                      <span className="font-medium text-lime-accent">{agent.commission_rate}%</span>
                      <span className="text-light-text-secondary dark:text-dark-text-secondary mx-1">•</span>
                      <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('topup.maxLimit')}: </span>
                      <span className="font-medium text-light-text dark:text-dark-text">{(agent.max_transaction_amount || 0).toLocaleString()} EUR</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAgent(agent.id);
                      }}
                      className="bg-lime-accent text-light-base dark:text-dark-base px-4 py-2 rounded-lg font-medium hover:shadow-glow transition-all"
                    >
                      {t('topup.select')}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-light-glass dark:bg-dark-glass rounded-xl"
            >
              <Building2 className="w-16 h-16 text-light-text-secondary dark:text-dark-text-secondary mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-light-text dark:text-dark-text mb-2">{t('topup.noAgentsAvailable')}</h3>
              <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
                {t('topup.noAgentsMessage', { country: getCountryNameArabic(registeredCountry) })}
              </p>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                {t('topup.tryLaterContactSupport')}
              </p>
            </motion.div>
          )}

          {/* Success Modal */}
          {transactionSuccess && successfulAgentData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                className="bg-light-surface dark:bg-dark-surface rounded-2xl shadow-2xl max-w-md w-full p-8 border border-light-border dark:border-dark-border"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="w-20 h-20 bg-lime-accent/20 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle className="w-12 h-12 text-lime-accent" />
                  </motion.div>

                  <h3 className="text-2xl font-bold text-light-text dark:text-dark-text mb-2">
                    تم طلب التعبئة بنجاح!
                  </h3>
                  <p className="text-light-text-secondary dark:text-dark-text-secondary mb-2">
                    تم تقديم طلب تعبئة بمبلغ {amount} EUR
                  </p>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">
                    معاملة: {transactionReference}
                  </p>
                  <p className="text-sm text-lime-accent font-medium mb-6">
                    يرجى التواصل مع الوكيل لإتمام الطلب
                  </p>

                  <div className="space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleWhatsAppContact(successfulAgentData.phone, successfulAgentData.name)}
                      className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white px-6 py-4 rounded-xl font-medium flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>تواصل مع الوكيل {successfulAgentData.name} عبر واتساب</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCloseSuccess}
                      className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border text-light-text dark:text-dark-text px-6 py-3 rounded-xl font-medium hover:bg-light-border dark:hover:bg-dark-border transition-all"
                    >
                      إغلاق
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Transaction Form */}
          {selectedAgent && filteredAgents.length > 0 && !transactionSuccess && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 p-6 bg-gradient-to-r from-light-surface/80 to-light-glass dark:from-dark-surface/80 dark:to-dark-glass border border-light-border dark:border-dark-border rounded-xl"
            >
              {(() => {
                const agent = filteredAgents.find(a => a.id === selectedAgent);
                return (
                  <div>
                    <h4 className="text-lg font-bold text-light-text dark:text-dark-text font-editorial mb-4">
                      {t('topup.transactionDetails')} - {agent?.name}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('topup.amount')}</label>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder={t('topup.enterAmount')}
                          max={agent?.max_transaction_amount}
                          min={agent?.min_transaction_amount}
                          className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                        />
                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                          {t('topup.limit')}: {(agent?.min_transaction_amount || 0).toLocaleString()} - {(agent?.max_transaction_amount || 0).toLocaleString()} EUR
                        </p>
                      </div>
                      
                    </div>
                    
                    {amount && (
                      <div className="mt-4 p-4 bg-lime-accent/10 rounded-xl">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('topup.amount')}:</span>
                          <span className="font-medium text-light-text dark:text-dark-text">{parseFloat(amount).toLocaleString()} {currency}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-1">
                          <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('topup.commission')} ({agent?.commission_rate}%):</span>
                          <span className="font-medium text-light-text dark:text-dark-text">{((parseFloat(amount) * (agent?.commission_rate || 0)) / 100).toLocaleString()} {currency}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-lime-accent/20">
                          <span className="font-medium text-light-text dark:text-dark-text">{t('topup.total')}:</span>
                          <span className="font-bold text-lime-accent">{(parseFloat(amount) + ((parseFloat(amount) * (agent?.commission_rate || 0)) / 100)).toLocaleString()} {currency}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-3 mt-6">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCreateTransaction}
                        disabled={!amount || parseFloat(amount) <= 0 || isCreatingTransaction}
                        className="flex-1 bg-lime-accent text-light-base dark:text-dark-base px-6 py-3 rounded-xl font-medium hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCreatingTransaction ? t('topup.processing') : t('topup.confirmTransaction')}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedAgent(null)}
                        className="px-6 py-3 bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text hover:bg-red-500/10 hover:text-red-400 transition-all"
                      >
                        {t('topup.cancel')}
                      </motion.button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}

          {/* Recent Transactions */}
          {agentTransactions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8"
            >
              <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial mb-4">{t('topup.recentTransactions')}</h3>
              <div className="space-y-3">
                {agentTransactions.slice(0, 5).map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-light-glass dark:bg-dark-glass rounded-xl"
                  >
                    <div>
                      <p className="font-medium text-light-text dark:text-dark-text">{transaction.reference_code}</p>
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        {transaction.created_at ? 
                          new Date(transaction.created_at.toDate ? transaction.created_at.toDate() : transaction.created_at).toLocaleDateString('ar-AE') :
                          t('topup.unspecifiedDate')
                       }
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lime-accent">{transaction.amount.toLocaleString()} {transaction.currency}</p>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.status === 'completed' || transaction.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                          transaction.status === 'pending' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {(transaction.status === 'cancelled' || transaction.status === 'failed' || transaction.status === 'rejected') && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="m15 9-6 6"></path>
                              <path d="m9 9 6 6"></path>
                            </svg>
                          )}
                          {getTransactionStatusText(transaction.status)}
                        </span>
                        {(transaction.status === 'cancelled' || transaction.status === 'failed' || transaction.status === 'rejected') && transaction.rejection_reason && (
                          <p className="text-xs text-red-400 mt-1 max-w-xs text-right">
                            {transaction.rejection_reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Recent Top-ups */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-gradient-to-r from-light-surface/80 to-light-glass dark:from-dark-surface/80 dark:to-dark-glass border border-light-border dark:border-dark-border rounded-2xl p-6 shadow-glass transition-colors duration-300"
      >
        <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial mb-4">{t('topup.recentTopUps')}</h3>
        {recentTopUps.length > 0 ? (
          <div className="space-y-3">
            {recentTopUps.map((topup, index) => (
              <motion.div
                key={topup.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-light-glass dark:bg-dark-glass rounded-xl hover:bg-lime-accent/5 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  {getTransactionStatusIcon(topup.status)}
                  <div>
                    <p className="font-medium text-light-text dark:text-dark-text">{topup.recipient || t('topup.topUpAccount')}</p>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      {topup.reference} • {topup.created_at ? 
                        new Date(topup.created_at.toDate ? topup.created_at.toDate() : topup.created_at).toLocaleDateString('ar-AE') :
                        t('topup.unspecifiedDate')
                      }
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lime-accent">+{topup.amount.toLocaleString()} {topup.currency}</p>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    {getTransactionStatusText(topup.status)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Wallet className="w-12 h-12 text-light-text-secondary dark:text-dark-text-secondary mx-auto mb-4 opacity-50" />
            <p className="text-light-text-secondary dark:text-dark-text-secondary">{t('topup.noPreviousTopUps')}</p>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">{t('topup.startTopUpNow')}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};