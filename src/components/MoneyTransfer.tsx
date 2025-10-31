import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, ArrowDownLeft, Globe, ArrowRight, CheckCircle, Clock, Copy, Search, Wallet, MessageCircle, User, Users, Star } from 'lucide-react';
import { useTransactions, CreateTransactionData } from '../hooks/useTransactions';
import { useRecipients } from '../hooks/useRecipients';
import { useAgents } from '../hooks/useAgents';
import { useUserProfile } from '../hooks/useUserProfile';
import { useBankAccount } from '../hooks/useBankAccount';
import { useNotifications } from '../hooks/useNotifications';
import { createRecipientTransaction, createRecipientNotification } from '../hooks/useRecipientTransaction';
import { useLanguage } from '../contexts/LanguageContext';
import { RecipientAvatar } from './RecipientAvatar';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';


interface TransferMethod {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  processingTime: string;
  // تم تعديل الرسوم لتكون دالة
  fees: (amount: string, currency: string) => string;
  minAmount: number;
  maxAmount: number;
  currencies: string[];
  status: 'available' | 'maintenance';
}

interface WithdrawalMethod {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  processingTime: string;
  // تم تعديل الرسوم لتكون دالة
  fees: (amount: string, currency: string) => string;
  minAmount: number;
  maxAmount: number;
  status: 'available' | 'maintenance';
}

interface Agent {
  id: string;
  name: string;
  country: string;
  city: string;
  area: string;
  phone: string;
  avatar: string;
  rating: number;
  workingHours: string;
  max_transaction_amount: number; // تمت إضافة هذا ليكون الكود صحيحاً إذا كانت البيانات تأتي من API
}

// دالة مساعدة لحساب الرسوم
const getFeeText = (amount: string, currency: string, baseFee: number, percentage: number): string => {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return '0';
  }
  const percentageFee = numAmount * percentage;
  const calculatedFee = baseFee + percentageFee;
  return `${calculatedFee.toFixed(2)} EUR`;
};

export const MoneyTransfer: React.FC = () => {
  const { t } = useLanguage();
  const [user] = useAuthState(auth);
  const { createTransaction } = useTransactions();
  const { recipients, loading: recipientsLoading, createRecipient, updateLastUsed, deleteRecipient } = useRecipients();
  const { profile } = useUserProfile();
  const { account, updateBalance, updateRecipientBalance, getUserIdByIban } = useBankAccount();
  const { createNotification: createUserNotification } = useNotifications();
  // Filter agents by user's registered country
  const { agents, loading: agentsLoading } = useAgents(profile?.country);
  const [operationType, setOperationType] = useState<'send' | 'withdraw'>('send');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [recipientType, setRecipientType] = useState<'saved' | 'new'>('saved');
  const [isProcessing, setIsProcessing] = useState(false);
  const [operationComplete, setOperationComplete] = useState(false);
  const [operationReference, setOperationReference] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [userCountry] = useState('lebanon');
  const [saveRecipient, setSaveRecipient] = useState(false);
  const [transferRecipientName, setTransferRecipientName] = useState('');
  const [transferSenderName, setTransferSenderName] = useState('');
  const [transferAccountNumber, setTransferAccountNumber] = useState('');
  const [transferIban, setTransferIban] = useState('');
  const [transferPhone, setTransferPhone] = useState('');
  const [transferCountry, setTransferCountry] = useState('UAE');
  const [activeTab, setActiveTab] = useState('send');
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);
  const [successfulAgentData, setSuccessfulAgentData] = useState<any>(null);

  const [transferData, setTransferData] = useState({
    amount: '',
    currency: 'EUR',
    purpose: '',
    notes: ''
  });

  const [newRecipientData, setNewRecipientData] = useState({
    name: '',
    iban: '',
    type: 'individual' as 'individual' | 'business',
    phone: '',
    email: '',
    bankName: '',
    swiftCode: '',
    country: 'UAE'
  });

  const [withdrawalData, setWithdrawalData] = useState({
    amount: '',
    currency: 'EUR',
    purpose: '',
    notes: '',
    pickupLocation: '',
    recipientName: '',
    recipientPhone: '',
    recipientId: ''
  });

  const transferMethods: TransferMethod[] = [
    {
      id: 'swift-transfer',
      name: t('transfer.swiftTransfer'),
      icon: Globe,
      description: t('transfer.swiftTransferDesc'),
      processingTime: `3-7 ${t('transfer.businessDays')}`,
      fees: (amount, currency) => getFeeText(amount, currency, 25, 0.003),
      minAmount: 500,
      maxAmount: 1000000,
      currencies: ['EUR'],
      status: 'available'
    },
    {
      id: 'instant-transfer',
      name: t('transfer.instantTransfer'),
      icon: Send,
      description: t('transfer.instantTransferDesc'),
      processingTime: `${t('transfer.instant')} - ${t('transfer.minutes')}`,
      fees: () => t('transfer.free'),
      minAmount: 10,
      maxAmount: 100000,
      currencies: ['EUR'],
      status: 'available'
    }
  ];

  const withdrawalMethods: WithdrawalMethod[] = [
    {
      id: 'western-union',
      name: t('transfer.westernUnion'),
      icon: Wallet,
      description: t('transfer.westernUnionDesc'),
      processingTime: `${t('transfer.instant')} - 30 ${t('transfer.minutes')}`,
      fees: (amount, currency) => getFeeText(amount, currency, 15, 0.025),
      minAmount: 100,
      maxAmount: 50000,
      status: 'available'
    },
    {
      id: 'agents',
      name: t('transfer.agentsNetwork'),
      icon: Users,
      description: t('transfer.agentsNetworkDesc'),
      processingTime: `${t('transfer.instant')} - 15 ${t('transfer.minutes')}`,
      fees: (amount, currency) => getFeeText(amount, currency, 10, 0.015),
      minAmount: 50,
      maxAmount: 25000,
      status: 'available'
    }
  ];


  const agentsByCountry: { [key: string]: Agent[] } = {
    lebanon: [],
    syria: [],
    jordan: []
  };

  // دالة لمطابقة رمز البلد مع الاسم الكامل
  const getCountryName = (code: string | undefined): string => {
    if (!code) return t('common.unspecified');

    const upperCode = code.toUpperCase();

    // رموز الدول ISO
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
      'SY': t('country.syria'),
      'JO': t('country.jordan'),
      'EG': t('country.egypt'),
      'MA': t('country.morocco'),
      'IQ': t('country.iraq'),
      'TN': t('country.tunisia'),
      'DZ': t('country.algeria'),
      'LY': t('country.libya'),
      // دول أخرى
      'TR': t('country.turkey'),
      'US': 'United States',
      'UK': 'United Kingdom',
      'GB': 'United Kingdom',
      'DE': 'Germany',
      'FR': 'France',
      'ES': 'Spain',
    };

    return countryMap[upperCode] || code;
  };

  const isSwiftTransfer = selectedMethod === 'swift-transfer';
  const isAgentWithdrawal = selectedMethod === 'agents';

  const filteredRecipients = recipients.filter(recipient =>
    recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipient.iban?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentAgents = agents || [];
  const selectedMethodData = operationType === 'send'
    ? transferMethods.find(m => m.id === selectedMethod)
    : withdrawalMethods.find(m => m.id === selectedMethod);
  const selectedRecipientData = recipients.find(r => r.id === selectedRecipient);

  const generateOperationReference = () => {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const prefix = operationType === 'send' ? 'TH' : 'WD';
    return `${prefix}${timestamp}${random}`;
  };

  const handleWhatsAppContact = (phone: string, agentName: string) => {
    const message = encodeURIComponent(
      `مرحباً ${agentName}، أود سحب مبلغ ${withdrawalData.amount} ${withdrawalData.currency}. المعاملة رقم: ${operationReference}`
    );
    const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCloseWithdrawalSuccess = () => {
    setWithdrawalSuccess(false);
    setSuccessfulAgentData(null);
    resetForm();
  };

  const handleOperation = async () => {
    if (operationType === 'send') {
      if (!selectedMethod || !transferData.amount || (!selectedRecipient && recipientType === 'saved')) {
        return;
      }
    } else {
      if (!selectedMethod || !withdrawalData.amount) {
        return;
      }
    }

    const amount = operationType === 'send' ? parseFloat(transferData.amount) : parseFloat(withdrawalData.amount);

    if (!account) {
      alert(t('transfer.noAccountError') || 'No bank account found');
      return;
    }

    if (account.balance < amount) {
      alert(t('transfer.insufficientBalance') || 'Insufficient balance');
      return;
    }

    setIsProcessing(true);

    if (saveRecipient && recipientType === 'new' && newRecipientData.name) {
      const savedRecipient = await createRecipient({
        name: newRecipientData.name,
        type: newRecipientData.type,
        country: newRecipientData.country,
        email: newRecipientData.email,
        phone: newRecipientData.phone,
        iban: newRecipientData.iban,
        bank_name: newRecipientData.bankName,
        swift_code: newRecipientData.swiftCode,
        flag: newRecipientData.country === 'UAE' ? '🇦🇪' :
              newRecipientData.country === 'SA' ? '🇸🇦' :
              newRecipientData.country === 'QA' ? '🇶🇦' :
              newRecipientData.country === 'US' ? '🇺🇸' :
              newRecipientData.country === 'UK' ? '🇬🇧' :
              newRecipientData.country === 'DE' ? '🇩🇪' : '🌍'
      });

      if (savedRecipient) {
        await createUserNotification({
          type: 'success',
          title: t('transfer.saveContactSuccessTitle'),
          message: t('transfer.saveContactSuccessMessage', { name: newRecipientData.name }),
          description: t('transfer.saveContactSuccessTitle')
        });
      }
    }

    try {
      const reference = generateOperationReference();
      setOperationReference(reference);

      if (operationType === 'send') {
        let recipientInfo = '';
        let location = '';
        let flag = '';
        let recipientIban = '';

        if (recipientType === 'saved' && selectedRecipientData) {
          recipientInfo = selectedRecipientData.name;
          location = selectedRecipientData.country;
          flag = selectedRecipientData.flag;
          recipientIban = selectedRecipientData.iban || '';
        } else if (recipientType === 'new') {
          recipientInfo = newRecipientData.name;
          location = newRecipientData.country;
          flag = '🏦';
          recipientIban = newRecipientData.iban;
        }

        const balanceUpdated = await updateBalance({
          amount: amount,
          type: 'debit',
          description: `Transfer to ${recipientInfo} - ${reference}`
        });

        if (!balanceUpdated) {
          setIsProcessing(false);
          alert(t('transfer.balanceUpdateFailed') || 'Failed to update balance');
          return;
        }

        const transactionData: CreateTransactionData = {
          type: 'sent',
          amount: -amount,
          currency: transferData.currency,
          recipient: recipientInfo,
          location: location,
          country_flag: flag,
          category: 'Transfer',
          description: transferData.purpose || 'Money transfer',
          reference: reference
        };

        await createTransaction(transactionData);

        await createUserNotification({
          type: 'transaction',
          title: t('notifications.moneySent'),
          message: `${t('notifications.sentAmount').replace('{amount}', amount.toString()).replace('{currency}', transferData.currency)}`,
          description: `${t('notifications.to').replace('{name}', recipientInfo)} - ${reference}`
        });

        if (recipientIban) {
          const getSenderName = () => {
            if (profile?.first_name && profile?.last_name) {
              return `${profile.first_name} ${profile.last_name}`;
            }
            if (user?.displayName) {
              return user.displayName;
            }
            if (user?.email) {
              return user.email;
            }
            return 'Unknown';
          };

          const recipientBalanceUpdated = await updateRecipientBalance(
            recipientIban,
            amount,
            `Transfer from ${getSenderName()} - ${reference}`
          );

          if (recipientBalanceUpdated) {
            console.log('Recipient balance updated successfully');

            const recipientUserId = await getUserIdByIban(recipientIban);

            if (recipientUserId) {
              const getSenderName = () => {
                if (profile?.first_name && profile?.last_name) {
                  return `${profile.first_name} ${profile.last_name}`;
                }
                if (user?.displayName) {
                  return user.displayName;
                }
                if (user?.email) {
                  return user.email;
                }
                return 'Unknown Sender';
              };

              const senderName = getSenderName();

              await createRecipientTransaction(recipientUserId, {
                type: 'received',
                amount: amount,
                currency: transferData.currency,
                sender: senderName,
                location: profile?.country || 'Unknown',
                country_flag: '🏦',
                category: 'Transfer',
                description: `Transfer from ${senderName}`,
                reference: reference
              });

              await createRecipientNotification(
                recipientUserId,
                senderName,
                amount,
                transferData.currency,
                reference
              );
            }
          } else {
            console.warn('Recipient balance update failed - account may not exist in system');
          }
        }

        if (recipientType === 'saved' && selectedRecipient) {
          await updateLastUsed(selectedRecipient);
        }

        setIsProcessing(false);
        setOperationComplete(true);
      } else {
        let recipient = withdrawalData.recipientName || 'Cash Withdrawal';
        let agentName = '';
        let agentId = '';

        if (selectedMethod === 'agents' && selectedAgent) {
          const selectedAgentData = agents.find(a => a.id === selectedAgent);
          if (selectedAgentData) {
            agentName = selectedAgentData.name;
            agentId = selectedAgent;
            recipient = agentName;
          }
        }

        const transactionData: CreateTransactionData = {
          type: 'withdrawal',
          amount: -amount,
          currency: withdrawalData.currency,
          recipient: recipient,
          location: withdrawalData.pickupLocation || profile?.country || t('common.unknown'),
          country_flag: '💰',
          category: 'Withdrawal',
          description: `${selectedMethod === 'western-union' ? t('transfer.westernUnion') : t('transfer.agentsNetwork')} ${t('transfer.withdrawMoney')}`,
          reference: reference
        };

        await createTransaction(transactionData);

        if (selectedMethod === 'agents' && agentId && user) {
          const selectedAgentData = agents.find(a => a.id === agentId);

          try {
            await addDoc(collection(db, 'agent_transactions'), {
              user_id: user.uid,
              agent_id: agentId,
              transaction_type: 'withdrawal',
              amount: amount,
              currency: withdrawalData.currency,
              commission: 0,
              reference_code: reference,
              status: 'pending',
              notes: withdrawalData.notes || '',
              created_at: serverTimestamp(),
              updated_at: serverTimestamp()
            });

            await createUserNotification({
              type: 'info',
              title: t('transfer.withdrawalRequestSubmitted'),
              message: t('transfer.withdrawalRequestMessage', { amount: amount.toString(), currency: withdrawalData.currency }),
              description: t('transfer.withdrawalPendingReview')
            });

            setIsProcessing(false);
            if (selectedAgentData) {
              setSuccessfulAgentData(selectedAgentData);
              setWithdrawalSuccess(true);
            } else {
              setOperationComplete(true);
            }
          } catch (err) {
            console.error('Error creating agent transaction:', err);
            setIsProcessing(false);
            alert(t('transfer.operationFailed') || 'Operation failed. Please try again.');
          }
        } else {
          await createUserNotification({
            type: 'info',
            title: t('transfer.withdrawalRequestSubmitted'),
            message: t('transfer.withdrawalRequestMessage', { amount: amount.toString(), currency: withdrawalData.currency }),
            description: t('transfer.withdrawalPendingReview')
          });

          setTimeout(() => {
            setIsProcessing(false);
            setOperationComplete(true);
          }, 3000);
        }
      }

    } catch (error) {
      console.error('Operation error:', error);
      setIsProcessing(false);
      alert(t('transfer.operationFailed') || 'Operation failed. Please try again.');
    }
  };

  const resetForm = () => {
    setSelectedMethod(null);
    setSelectedRecipient(null);
    setRecipientType('saved');
    setSelectedAgent(null);
    setTransferData({ amount: '', currency: 'EUR', purpose: '', notes: '' });
    setWithdrawalData({ amount: '', currency: 'EUR', purpose: '', notes: '', pickupLocation: '', recipientName: '', recipientPhone: '', recipientId: '' });
    setNewRecipientData({ name: '', email: '', phone: '', iban: '', bankName: '', country: 'UAE', type: 'individual', swiftCode: '' });
    setOperationComplete(false);
    setOperationReference('');
    setSearchTerm('');
    setWithdrawalSuccess(false);
    setSuccessfulAgentData(null);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (operationComplete) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 bg-lime-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-lime-accent" />
          </div>

          <h2 className="text-3xl font-bold text-light-text dark:text-dark-text font-editorial mb-4">
            {operationType === 'send' ? t('transfer.transferSuccessTitle') : t('transfer.withdrawalSuccessTitle')}
          </h2>

          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6">
            {operationType === 'send'
              ? t('transfer.transferSuccessMessage')
              : t('transfer.withdrawalSuccessMessage')
            }
          </p>

          <div className="bg-light-surface/50 dark:bg-dark-surface/50 backdrop-blur-sm border border-light-border dark:border-dark-border rounded-xl p-6 max-w-md mx-auto mb-8">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('transfer.referenceNumber')}</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-lime-accent font-bold">{operationReference}</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCopy(operationReference)}
                    className="p-1 hover:bg-lime-accent/10 rounded"
                  >
                    <Copy className="w-4 h-4 text-lime-accent" />
                  </motion.button>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('transfer.amount')}:</span>
                <span className="font-bold text-light-text dark:text-dark-text">
                  {parseFloat(operationType === 'send' ? transferData.amount : withdrawalData.amount).toLocaleString()} {operationType === 'send' ? transferData.currency : withdrawalData.currency}
                </span>
              </div>

              {operationType === 'send' ? (
                <div className="flex justify-between">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('transfer.recipient')}</span>
                  <span className="font-medium text-light-text dark:text-dark-text">
                    {recipientType === 'saved' && selectedRecipientData ? selectedRecipientData.name : newRecipientData.name}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('transfer.withdrawalMethodLabel')}</span>
                  <span className="font-medium text-light-text dark:text-dark-text">
                    {selectedMethod === 'western-union' ? t('transfer.westernUnion') : t('transfer.agentsNetwork')}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('transfer.processingTime')}:</span>
                <span className="text-light-text dark:text-dark-text">{selectedMethodData?.processingTime}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetForm}
              className="bg-lime-accent text-light-base dark:text-dark-base px-8 py-3 rounded-xl font-medium hover:shadow-glow transition-all"
            >
              {operationType === 'send' ? t('transfer.newTransfer') : t('transfer.newWithdrawal')}
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 border-4 border-lime-accent border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>

          <h2 className="text-2xl font-bold text-light-text dark:text-dark-text font-editorial mb-4">
            {operationType === 'send' ? t('transfer.processingTransfer') : t('transfer.processingWithdrawal')}
          </h2>

          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6">
            {operationType === 'send'
              ? t('transfer.processingTransferMessage')
              : t('transfer.processingWithdrawalMessage')
            }
          </p>

          <div className="bg-light-surface/50 dark:bg-dark-surface/50 backdrop-blur-sm border border-light-border dark:border-dark-border rounded-xl p-4 max-w-sm mx-auto">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-lime-accent animate-pulse" />
              <span className="text-sm text-light-text dark:text-dark-text">
                {t('transfer.expectedProcessingTime')} {selectedMethodData?.processingTime}
              </span>
            </div>
          </div>
        </motion.div>
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
      >
        <h2 className="text-3xl font-bold text-light-text dark:text-dark-text font-editorial">{t('transfer.title')}</h2>
        <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">{t('transfer.subtitle')}</p>
      </motion.div>

      {/* Operation Type Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-light-surface/50 dark:bg-dark-surface/50 backdrop-blur-sm border border-light-border dark:border-dark-border rounded-xl p-2"
      >
        <div className="flex bg-light-glass dark:bg-dark-glass rounded-xl p-1">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setOperationType('send');
              setSelectedMethod(null);
              setSelectedAgent(null);
            }}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all ${
              operationType === 'send'
                ? 'bg-lime-accent text-light-base dark:text-dark-base shadow-md'
                : 'text-light-text dark:text-dark-text hover:bg-light-surface dark:hover:bg-dark-surface'
            }`}
          >
            <Send className="w-5 h-5" />
            <span>{t('transfer.sendMoney')}</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setOperationType('withdraw');
              setSelectedMethod(null);
              setSelectedRecipient(null);
            }}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all ${
              operationType === 'withdraw'
                ? 'bg-lime-accent text-light-base dark:text-dark-base shadow-md'
                : 'text-light-text dark:text-dark-text hover:bg-light-surface dark:hover:bg-dark-surface'
            }`}
          >
            <ArrowDownLeft className="w-5 h-5" />
            <span>{t('transfer.withdrawMoney')}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Methods Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-light-surface/50 dark:bg-dark-surface/50 backdrop-blur-sm border border-light-border dark:border-dark-border rounded-2xl p-6 shadow-glass transition-colors duration-300"
      >
        <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial mb-4">
          {operationType === 'send' ? t('transfer.chooseTransferMethod') : t('transfer.chooseWithdrawalMethod')}
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(operationType === 'send' ? transferMethods : withdrawalMethods).map((method, index) => (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => method.status === 'available' && setSelectedMethod(method.id)}
              className={`p-4 border rounded-xl cursor-pointer transition-all ${
                method.status === 'available'
                  ? 'hover:border-lime-accent/30 hover:shadow-glow'
                  : 'opacity-60 cursor-not-allowed'
              } ${selectedMethod === method.id ? 'border-lime-accent/50 bg-lime-accent/5' : 'border-light-border dark:border-dark-border'}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-lime-accent/10 rounded-lg">
                    <method.icon className="w-5 h-5 text-lime-accent" />
                  </div>
                  <div>
                    <h4 className="font-medium text-light-text dark:text-dark-text">{method.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      method.status === 'available'
                        ? 'bg-lime-accent/20 text-lime-accent'
                        : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {method.status === 'available' ? t('transfer.available') : t('transfer.maintenance')}
                    </span>
                  </div>
                </div>
                {selectedMethod === method.id && (
                  <CheckCircle className="w-5 h-5 text-lime-accent" />
                )}
              </div>

              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-3">{method.description}</p>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('transfer.processingTime')}:</span>
                  <span className="text-light-text dark:text-dark-text">{method.processingTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('transfer.fees')}:</span>
                  <span className="text-light-text dark:text-dark-text">{method.fees(transferData.amount, transferData.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('transfer.minMaxAmount')}:</span>
                  <span className="text-light-text dark:text-dark-text">
                    {(method.minAmount || 0).toLocaleString()} - {(method.maxAmount || 0).toLocaleString()} EUR
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Send Money - Recipient Selection */}
      {operationType === 'send' && selectedMethod && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-light-surface/50 dark:bg-dark-surface/50 backdrop-blur-sm border border-light-border dark:border-dark-border rounded-2xl p-6 shadow-glass transition-colors duration-300"
        >
          <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial mb-4">{t('transfer.chooseRecipient')}</h3>

          {/* Recipient Type Toggle */}
          <div className="flex bg-light-glass dark:bg-dark-glass rounded-xl p-1 mb-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setRecipientType('saved')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                recipientType === 'saved'
                  ? 'bg-lime-accent text-light-base dark:text-dark-base shadow-md'
                  : 'text-light-text dark:text-dark-text hover:bg-light-surface dark:hover:bg-dark-surface'
              }`}
            >
              {t('transfer.savedRecipients')}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setRecipientType('new')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                recipientType === 'new'
                  ? 'bg-lime-accent text-light-base dark:text-dark-base shadow-md'
                  : 'text-light-text dark:text-dark-text hover:bg-light-surface dark:hover:bg-dark-surface'
              }`}
            >
              {t('transfer.newRecipient')}
            </motion.button>
          </div>

          {recipientType === 'saved' ? (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                <input
                  type="text"
                  placeholder={t('transfer.searchRecipients')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                />
              </div>

              {/* Recipients List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recipients.length > 0 ? (
                  recipients.map((recipient, index) => (
                    <motion.div
                      key={recipient.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedRecipient(recipient.id)}
                      className={`p-4 border rounded-xl cursor-pointer transition-all ${
                        selectedRecipient === recipient.id
                          ? 'border-lime-accent/50 bg-lime-accent/5'
                          : 'border-light-border dark:border-dark-border hover:border-lime-accent/30'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <RecipientAvatar
                          name={recipient.name}
                          avatarUrl={recipient.avatar_url}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-light-text dark:text-dark-text truncate">{recipient.name}</h4>
                            <span className="text-lg">{recipient.flag}</span>
                            {selectedRecipient === recipient.id && (
                              <CheckCircle className="w-4 h-4 text-lime-accent flex-shrink-0" />
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                            {recipient.email && <p className="truncate">{recipient.email}</p>}
                            {recipient.iban && <p className="font-mono text-xs">{recipient.iban}</p>}
                            <div className="flex items-center justify-between">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                recipient.type === 'business'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-green-500/20 text-green-400'
                              }`}>
                                {recipient.type === 'business' ? t('transfer.business') : t('transfer.individual')}
                              </span>
                              {recipient.lastUsed && (
                                <span className="text-xs">{t('transfer.lastUsed')} {new Date(recipient.lastUsed).toLocaleDateString('ar-AE')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="md:col-span-2 text-center py-8">
                    <User className="w-12 h-12 text-light-text-secondary dark:text-dark-text-secondary mx-auto mb-4" />
                    <p className="text-light-text-secondary dark:text-dark-text-secondary">{t('transfer.noSavedRecipients')}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('transfer.recipientName')}</label>
                <input
                  type="text"
                  value={newRecipientData.name}
                  onChange={(e) => setNewRecipientData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('transfer.enterRecipientName')}
                  className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                />
              </div>

              {isSwiftTransfer && (
                <>
                  <div>
                    <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('transfer.recipientType')}</label>
                    <select
                      value={newRecipientData.type}
                      onChange={(e) => setNewRecipientData(prev => ({ ...prev, type: e.target.value as 'individual' | 'business' }))}
                      className="w-full bg-white dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                    >
                      <option value="individual" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('transfer.individual')}</option>
                      <option value="business" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('transfer.business')}</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('transfer.iban')}</label>
                <input
                  type="text"
                  value={newRecipientData.iban}
                  onChange={(e) => setNewRecipientData(prev => ({ ...prev, iban: e.target.value }))}
                  placeholder="AE070331234567890123456"
                  className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                />
              </div>

              {isSwiftTransfer && (
                <>
                  <div>
                    <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('transfer.bankName')}</label>
                    <input
                      type="text"
                      value={newRecipientData.bankName}
                      onChange={(e) => setNewRecipientData(prev => ({ ...prev, bankName: e.target.value }))}
                      placeholder={t('transfer.enterBankName')}
                      className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('transfer.swiftCode')}</label>
                    <input
                      type="text"
                      value={newRecipientData.swiftCode}
                      onChange={(e) => setNewRecipientData(prev => ({ ...prev, swiftCode: e.target.value }))}
                      placeholder="SWIFT/BIC Code"
                      className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('transfer.email')}</label>
                    <input
                      type="email"
                      value={newRecipientData.email}
                      onChange={(e) => setNewRecipientData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="example@email.com"
                      className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('transfer.phone')}</label>
                    <input
                      type="tel"
                      value={newRecipientData.phone}
                      onChange={(e) => setNewRecipientData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+971 50 123 4567"
                      className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('transfer.country')}</label>
                    <select
                      value={newRecipientData.country}
                      onChange={(e) => setNewRecipientData(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full bg-white dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                    >
                      <option value="UAE" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('country.uae')}</option>
                      <option value="SA" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('country.saudiArabia')}</option>
                      <option value="QA" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('country.qatar')}</option>
                      <option value="KW" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('country.kuwait')}</option>
                      <option value="BH" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('country.bahrain')}</option>
                      <option value="OM" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('country.oman')}</option>
                      <option value="US" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">United States</option>
                      <option value="UK" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">United Kingdom</option>
                      <option value="DE" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Germany</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Send Money - Transfer Details */}
      {operationType === 'send' && selectedMethod && (recipientType === 'new' ? newRecipientData.name : selectedRecipient) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-light-surface/80 to-light-glass dark:from-dark-surface/80 dark:to-dark-glass border border-light-border dark:border-dark-border rounded-2xl p-6 shadow-glass transition-colors duration-300"
        >
          <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial mb-4">{t('transfer.transferDetails')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('transfer.amount')}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={transferData.amount}
                    onChange={(e) => setTransferData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder={t('transfer.enterAmount')}
                    className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 pr-16 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary">
                    {transferData.currency}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('transfer.currency')}</label>
                <select
                  value={transferData.currency}
                  onChange={(e) => setTransferData(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full bg-white dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                >
                  <option value="EUR" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('transfer.eur')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('transfer.purpose')}</label>
                <select
                  value={transferData.purpose}
                  onChange={(e) => setTransferData(prev => ({ ...prev, purpose: e.target.value }))}
                  className="w-full bg-white dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                >
                  <option value="" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('transfer.selectPurpose')}</option>
                  <option value="business-payment" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('transfer.businessPayment')}</option>
                  <option value="salary" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('transfer.salary')}</option>
                  <option value="family-support" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('transfer.familySupport')}</option>
                  <option value="investment" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('transfer.investment')}</option>
                  <option value="loan-repayment" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('transfer.loanRepayment')}</option>
                  <option value="other" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('transfer.other')}</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {/* Recipient Summary */}
              <div className="bg-lime-accent/10 border border-lime-accent/30 rounded-xl p-4">
                <h4 className="font-medium text-light-text dark:text-dark-text mb-3">{t('transfer.recipientSummary')}</h4>
                {recipientType === 'saved' && selectedRecipientData ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <RecipientAvatar
                        name={selectedRecipientData.name}
                        avatarUrl={selectedRecipientData.avatar_url}
                        size="sm"
                      />
                      <span className="font-medium text-light-text dark:text-dark-text">{selectedRecipientData.name}</span>
                      <span>{selectedRecipientData.flag}</span>
                    </div>
                    {selectedRecipientData.iban && (
                      <p className="text-light-text-secondary dark:text-dark-text-secondary font-mono">{selectedRecipientData.iban}</p>
                    )}
                    {selectedRecipientData.bankName && (
                      <p className="text-light-text-secondary dark:text-dark-text-secondary">{selectedRecipientData.bankName}</p>
                    )}
                  </div>
                ) : recipientType === 'new' && newRecipientData.name ? (
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-light-text dark:text-dark-text">{newRecipientData.name}</p>
                    {newRecipientData.iban && (
                      <p className="text-light-text-secondary dark:text-dark-text-secondary font-mono">{newRecipientData.iban}</p>
                    )}
                    {newRecipientData.bankName && (
                      <p className="text-light-text-secondary dark:text-dark-text-secondary">{newRecipientData.bankName}</p>
                    )}
                  </div>
                ) : null}
              </div>

              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('transfer.notesOptional')}</label>
                <textarea
                  value={transferData.notes}
                  onChange={(e) => setTransferData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder={t('transfer.notesPlaceholder')}
                  rows={3}
                  className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300 resize-none"
                />
              </div>

              {(newRecipientData.name && !recipients.some(r => r.name.toLowerCase() === newRecipientData.name.toLowerCase())) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-3 p-3 bg-lime-accent/5 border border-lime-accent/20 rounded-xl"
                >
                  <input
                    type="checkbox"
                    id="saveNewRecipient"
                    checked={saveRecipient}
                    onChange={(e) => setSaveRecipient(e.target.checked)}
                    className="w-4 h-4 text-lime-accent bg-light-glass dark:bg-dark-glass border-light-border dark:border-dark-border rounded focus:ring-lime-accent/50"
                  />
                  <label htmlFor="saveNewRecipient" className="text-sm text-light-text dark:text-dark-text cursor-pointer">
                    {t('transfer.saveRecipient')}
                  </label>
                </motion.div>
              )}
            </div>
          </div>

          {/* Transfer Summary */}
          {transferData.amount && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl"
            >
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3">{t('transfer.transferSummary')}</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 dark:text-blue-300">{t('transfer.amount')}:</span>
                  <p className="font-bold text-blue-800 dark:text-blue-200">
                    {parseFloat(transferData.amount).toLocaleString()} {transferData.currency}
                  </p>
                </div>
                <div>
                  <span className="text-blue-600 dark:text-blue-300">{t('transfer.fees')}:</span>
                  <p className="font-medium text-blue-800 dark:text-blue-200">{selectedMethodData?.fees(transferData.amount, transferData.currency)}</p>
                </div>
                <div>
                  <span className="text-blue-600 dark:text-blue-300">{t('transfer.processingTime')}:</span>
                  <p className="font-medium text-blue-800 dark:text-blue-200">{selectedMethodData?.processingTime}</p>
                </div>
                <div>
                  <span className="text-blue-600 dark:text-blue-300">{t('transfer.chooseTransferMethod')}:</span>
                  <p className="font-medium text-blue-800 dark:text-blue-200">{selectedMethodData?.name}</p>
                </div>
              </div>
            </motion.div>
          )}

          <div className="flex justify-end mt-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleOperation}
              disabled={!transferData.amount || !transferData.purpose}
              className="flex items-center space-x-2 bg-lime-accent text-light-base dark:text-dark-base px-8 py-3 rounded-xl font-medium hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
              <span>{t('transfer.sendTransfer')}</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Withdraw Money - Details */}
      {operationType === 'withdraw' && selectedMethod && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-light-surface/80 to-light-glass dark:from-dark-surface/80 dark:to-dark-glass border border-light-border dark:border-dark-border rounded-2xl p-6 shadow-glass transition-colors duration-300"
        >
          <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial mb-4">
            {selectedMethod === 'western-union' ? t('transfer.withdrawalDetailsWU') : t('transfer.withdrawalDetailsAgents')}
          </h3>

          <div className="space-y-6">
            {isAgentWithdrawal ? (
              <>
                {/* Country Info */}
                <div className="bg-lime-accent/10 border border-lime-accent/30 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-lime-accent rounded-full"></div>
                    <p className="text-sm text-light-text dark:text-dark-text">
                      <strong>{t('transfer.registeredCountry')}</strong> {getCountryName(profile?.country)}
                    </p>
                  </div>
                  <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-2">
                    {t('transfer.withdrawalCountryRestriction')}
                  </p>
                </div>

                {/* Amount Input */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('transfer.amount')}</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={withdrawalData.amount}
                        onChange={(e) => setWithdrawalData(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder={t('transfer.enterAmount')}
                        className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 pr-16 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                      />
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary">
                        {withdrawalData.currency}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Agents List */}
                <div className="md:col-span-2">
                  <h4 className="text-lg font-medium text-light-text dark:text-dark-text mb-4">{t('transfer.availableAgentsIn')} {getCountryName(profile?.country)}</h4>
                  {agentsLoading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-lime-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-light-text-secondary dark:text-dark-text-secondary">{t('transfer.loadingAgents')}</p>
                    </div>
                  ) : agents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {agents.map((agent, index) => (
                        <motion.div
                          key={agent.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setSelectedAgent(agent.id)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            selectedAgent === agent.id ? 'border-lime-accent/50 bg-lime-accent/5' : 'border-light-border dark:border-dark-border hover:border-lime-accent/30'
                          }`}
                        >
                          <div className="flex items-start gap-4 mb-4">
                            {agent.avatar_url && (
                              <img
                                src={agent.avatar_url}
                                alt={agent.name}
                                className="w-16 h-16 rounded-full object-cover border-2 border-lime-accent/30"
                              />
                            )}
                            <div className="flex-1">
                              <h5 className="text-lg font-bold text-light-text dark:text-dark-text mb-1">{agent.name}</h5>
                              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                                {t('transfer.agentCode')}: {agent.code} • {agent.city}
                              </p>
                            </div>
                            {selectedAgent === agent.id && <CheckCircle className="w-5 h-5 text-lime-accent flex-shrink-0" />}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                              <span className="text-lime-accent">📍</span>
                              <span>{agent.country}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                              <span className="text-lime-accent">📞</span>
                              <span>{agent.phone || 'غير متوفر'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                              <span className="text-lime-accent">📊</span>
                              <span>{agent.total_transactions || 0} {t('transfer.transactions')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm font-bold text-lime-accent mt-3">
                              <span>💰</span>
                              <span>{t('transfer.maxWithdrawalAgents')} {(agent.max_transaction_amount || 0).toLocaleString()} EUR</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                      <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">{t('transfer.noAgentsAvailable')}</h4>
                      <p className="text-sm text-orange-600 dark:text-orange-300">
                        {t('transfer.maxWithdrawalAgents')} {(selectedMethodData?.maxAmount || 0).toLocaleString()} EUR
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">{t('transfer.wuInstructionsTitle')}</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {t('transfer.wuInstructionsDesc')}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('transfer.amount')}</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={withdrawalData.amount}
                        onChange={(e) => setWithdrawalData(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder={t('transfer.enterAmount')}
                        className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 pr-16 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                      />
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary">
                        {withdrawalData.currency}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('transfer.currency')}</label>
                    <select
                      value={withdrawalData.currency}
                      onChange={(e) => setWithdrawalData(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full bg-white dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                    >
                      <option value="EUR" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('transfer.eur')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('transfer.recipientNameWithdrawal')}</label>
                    <input
                      type="text"
                      value={withdrawalData.recipientName}
                      onChange={(e) => setWithdrawalData(prev => ({ ...prev, recipientName: e.target.value }))}
                      placeholder={t('transfer.recipientNameWithdrawalPlaceholder')}
                      className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('transfer.recipientPhoneWithdrawal')}</label>
                    <input
                      type="tel"
                      value={withdrawalData.recipientPhone}
                      onChange={(e) => setWithdrawalData(prev => ({ ...prev, recipientPhone: e.target.value }))}
                      placeholder="+961 70 123 456"
                      className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('transfer.pickupLocation')}</label>
                    <input
                      type="text"
                      value={getCountryName(profile?.country)}
                      disabled
                      className="w-full bg-light-glass/50 dark:bg-dark-glass/50 border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text opacity-70 cursor-not-allowed"
                    />
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-2">
                      {t('transfer.pickupLocationNote')}
                    </p>
                  </div>
                </div>

                {/* WhatsApp Support */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">{t('topup.needHelp')}</p>
                    </div>
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href="https://wa.me/212779449889?text=مرحباً%2C%20لدي%20استفسار%20بخصوص%20سحب%20الأموال%20عبر%20ويسترن%20يونيون"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm">{t('topup.whatsapp')}</span>
                    </motion.a>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Withdrawal Summary */}
          {withdrawalData.amount && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl"
            >
              <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-3">{t('transfer.withdrawalSummary')}</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-orange-600 dark:text-orange-300">{t('transfer.amount')}:</span>
                  <p className="font-bold text-orange-800 dark:text-orange-200">
                    {parseFloat(withdrawalData.amount).toLocaleString()} {withdrawalData.currency}
                  </p>
                </div>
                <div>
                  <span className="text-orange-600 dark:text-orange-300">{t('transfer.fees')}:</span>
                  <p className="font-medium text-orange-800 dark:text-orange-200">
                    {selectedMethodData?.fees(withdrawalData.amount, withdrawalData.currency)}
                  </p>
                </div>
                <div>
                  <span className="text-orange-600 dark:text-orange-300">{t('transfer.processingTime')}:</span>
                  <p className="font-medium text-orange-800 dark:text-orange-200">{selectedMethodData?.processingTime}</p>
                </div>
                <div>
                  <span className="text-orange-600 dark:text-orange-300">{t('transfer.withdrawalMethodLabel')}:</span>
                  <p className="font-medium text-orange-800 dark:text-orange-200">{selectedMethodData?.name}</p>
                </div>
              </div>
            </motion.div>
          )}

          <div className="flex justify-end mt-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleOperation}
              disabled={
                !withdrawalData.amount ||
                (selectedMethod === 'western-union' && !withdrawalData.recipientName) ||
                (selectedMethod === 'agents' && agents.length === 0)
              }
              className="flex items-center space-x-2 bg-lime-accent text-light-base dark:text-dark-base px-8 py-3 rounded-xl font-medium hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownLeft className="w-5 h-5" />
              <span>{t('transfer.confirmWithdrawal')}</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Withdrawal Success Modal with WhatsApp */}
      {withdrawalSuccess && successfulAgentData && (
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
                {t('transfer.withdrawalSuccessTitle')}
              </h3>
              <p className="text-light-text-secondary dark:text-dark-text-secondary mb-2">
                {t('transfer.withdrawalRequestMessage', { amount: withdrawalData.amount, currency: withdrawalData.currency })}
              </p>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">
                {t('common.transaction')}: {operationReference}
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
                  onClick={handleCloseWithdrawalSuccess}
                  className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border text-light-text dark:text-dark-text px-6 py-3 rounded-xl font-medium hover:bg-light-border dark:hover:bg-dark-border transition-all"
                >
                  {t('common.close')}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};