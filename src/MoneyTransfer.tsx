import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, ArrowDownLeft, Globe, ArrowRight, CheckCircle, Clock, AlertCircle, Copy, Search, Wallet, Users, MessageCircle, User } from 'lucide-react';
import { useTransactions, CreateTransactionData } from '../hooks/useTransactions';

interface Recipient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  iban?: string;
  bankName?: string;
  country: string;
  flag: string;
  type: 'individual' | 'business';
  avatar: string;
  lastUsed?: string;
}

interface TransferMethod {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  processingTime: string;
  fees: string;
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
  fees: string;
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
}

const transferMethods: TransferMethod[] = [
  {
    id: 'swift-transfer',
    name: 'تحويل سويفت',
    icon: Globe,
    description: 'تحويلات دولية آمنة عبر شبكة SWIFT العالمية',
    processingTime: '3-7 أيام عمل',
    fees: '25 AED + 0.3%',
    minAmount: 500,
    maxAmount: 1000000,
    currencies: ['USD', 'EUR', 'GBP', 'AED'],
    status: 'available'
  },
  {
    id: 'instant-transfer',
    name: 'تحويل فوري',
    icon: Send,
    description: 'تحويل فوري لحسابات TradeHub الأخرى',
    processingTime: 'فوري - خلال دقائق',
    fees: 'مجاني',
    minAmount: 10,
    maxAmount: 100000,
    currencies: ['AED', 'USD', 'EUR'],
    status: 'available'
  }
];

const withdrawalMethods: WithdrawalMethod[] = [
  {
    id: 'western-union',
    name: 'ويسترن يونيون',
    icon: Wallet,
    description: 'سحب نقدي من أي فرع ويسترن يونيون حول العالم',
    processingTime: 'فوري - 30 دقيقة',
    fees: '2.5% + 15 AED',
    minAmount: 100,
    maxAmount: 50000,
    status: 'available'
  },
  {
    id: 'agents',
    name: 'شبكة الوكلاء',
    icon: Users,
    description: 'سحب نقدي من خلال شبكة وكلائنا المعتمدين',
    processingTime: 'فوري - 15 دقيقة',
    fees: '1.5% + 10 AED',
    minAmount: 50,
    maxAmount: 25000,
    status: 'available'
  }
];

const savedRecipients: Recipient[] = [
  {
    id: '1',
    name: 'أحمد محمد الخوري',
    email: 'ahmed.khoury@email.com',
    phone: '+971 50 123 4567',
    iban: 'AE070331234567890123456',
    bankName: 'Emirates NBD',
    country: 'UAE',
    flag: '🇦🇪',
    type: 'individual',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    lastUsed: '2024-01-10'
  },
  {
    id: '2',
    name: 'شركة الإمارات للتجارة',
    email: 'finance@emirates-trade.com',
    iban: 'AE070331987654321098765',
    bankName: 'ADCB Bank',
    country: 'UAE',
    flag: '🇦🇪',
    type: 'business',
    avatar: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    lastUsed: '2024-01-08'
  },
  {
    id: '3',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    phone: '+1 555 123 4567',
    iban: 'GB29NWBK60161331926819',
    bankName: 'Barclays Bank',
    country: 'UK',
    flag: '🇬🇧',
    type: 'individual',
    avatar: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    lastUsed: '2024-01-05'
  }
];

// بيانات الوكلاء حسب البلد
const agentsByCountry = {
  lebanon: [
    {
      id: '1',
      name: 'أحمد محمد الخوري',
      country: 'لبنان',
      city: 'بيروت',
      area: 'الحمرا',
      phone: '+961 1 234 567',
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      rating: 4.8,
      workingHours: '9:00 ص - 8:00 م'
    },
    {
      id: '2',
      name: 'فاطمة علي حسن',
      country: 'لبنان',
      city: 'طرابلس',
      area: 'الميناء',
      phone: '+961 6 345 678',
      avatar: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      rating: 4.9,
      workingHours: '8:00 ص - 7:00 م'
    }
  ],
  syria: [
    {
      id: '3',
      name: 'عبد الله أحمد',
      country: 'سوريا',
      city: 'دمشق',
      area: 'المزة',
      phone: '+963 11 234 567',
      avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      rating: 4.6,
      workingHours: '9:00 ص - 7:00 م'
    }
  ],
  jordan: [
    {
      id: '4',
      name: 'خالد محمود',
      country: 'الأردن',
      city: 'عمان',
      area: 'وسط البلد',
      phone: '+962 6 234 567',
      avatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      rating: 4.7,
      workingHours: '9:00 ص - 9:00 م'
    }
  ]
};

export const MoneyTransfer: React.FC = () => {
  const { createTransaction } = useTransactions();
  const [operationType, setOperationType] = useState<'send' | 'withdraw'>('send');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [recipientType, setRecipientType] = useState<'saved' | 'new'>('saved');
  const [isProcessing, setIsProcessing] = useState(false);
  const [operationComplete, setOperationComplete] = useState(false);
  const [operationReference, setOperationReference] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [userCountry] = useState('lebanon'); // يمكن جلبه من ملف المستخدم

  const [transferData, setTransferData] = useState({
    amount: '',
    currency: 'AED',
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
    currency: 'AED',
    purpose: '',
    notes: '',
    pickupLocation: '',
    recipientName: '',
    recipientPhone: '',
    recipientId: ''
  });

  // دالة شرطية للتحقق مما إذا كان التحويل هو تحويل سويفت
  const isSwiftTransfer = selectedMethod === 'swift-transfer';

  const filteredRecipients = savedRecipients.filter(recipient =>
    recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipient.iban?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentAgents = agentsByCountry[userCountry as keyof typeof agentsByCountry] || [];
  const selectedMethodData = operationType === 'send' 
    ? transferMethods.find(m => m.id === selectedMethod)
    : withdrawalMethods.find(m => m.id === selectedMethod);
  const selectedRecipientData = savedRecipients.find(r => r.id === selectedRecipient);

  const generateOperationReference = () => {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const prefix = operationType === 'send' ? 'TH' : 'WD';
    return `${prefix}${timestamp}${random}`;
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

    setIsProcessing(true);
    // حفظ المستلم/المرسل الجديد إذا كان مطلوباً
    if (saveRecipient) {
      const newContact = {
        id: Date.now().toString(),
        name: activeTab === 'send' ? transferData.recipientName : transferData.senderName,
        account: transferData.accountNumber || '',
        iban: transferData.iban || '',
        phone: transferData.phone || '',
        country: transferData.country,
        flag: transferData.country === 'UAE' ? '🇦🇪' : 
              transferData.country === 'USA' ? '🇺🇸' : 
              transferData.country === 'UK' ? '🇬🇧' : 
              transferData.country === 'Germany' ? '🇩🇪' : '🌍'
      };
      
      setSavedRecipients(prev => [...prev, newContact]);
      
      // إشعار بالحفظ
      await createNotification({
        type: 'success',
        title: 'تم حفظ جهة الاتصال',
        message: `تم حفظ ${newContact.name} في قائمة جهات الاتصال المحفوظة`,
        description: 'تم حفظ جهة الاتصال'
      });
    }

    
    try {
      const reference = generateOperationReference();
      setOperationReference(reference);

      if (operationType === 'send') {
        // إرسال الأموال
        let recipientInfo = '';
        let location = '';
        let flag = '';
        
        if (recipientType === 'saved' && selectedRecipientData) {
          recipientInfo = selectedRecipientData.name;
          location = selectedRecipientData.country;
          flag = selectedRecipientData.flag;
        } else if (recipientType === 'new') {
          recipientInfo = newRecipientData.name;
          location = newRecipientData.country;
          flag = '🏦';
        }

        const transactionData: CreateTransactionData = {
          type: 'sent',
          amount: -parseFloat(transferData.amount),
          currency: transferData.currency,
          recipient: recipientInfo,
          location: location,
          country_flag: flag,
          category: 'Transfer',
          description: transferData.purpose || 'Money transfer',
          reference: reference
        };

        await createTransaction(transactionData);
      } else {
        // سحب الأموال
        const transactionData: CreateTransactionData = {
          type: 'withdrawal',
          amount: -parseFloat(withdrawalData.amount),
          currency: withdrawalData.currency,
          recipient: withdrawalData.recipientName || 'Cash Withdrawal',
          location: withdrawalData.pickupLocation || userCountry,
          country_flag: '💰',
          category: 'Withdrawal',
          description: `${selectedMethod === 'western-union' ? 'Western Union' : 'Agent Network'} withdrawal`,
          reference: reference
        };

        await createTransaction(transactionData);
      }

      setTimeout(() => {
        setIsProcessing(false);
        setOperationComplete(true);
      }, 3000);

    } catch (error) {
      console.error('Operation error:', error);
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setSelectedMethod(null);
    setSelectedRecipient(null);
    setRecipientType('saved');
    setSelectedAgent(null);
    setTransferData({ amount: '', currency: 'AED', purpose: '', notes: '' });
    setWithdrawalData({ amount: '', currency: 'AED', purpose: '', notes: '', pickupLocation: '', recipientName: '', recipientPhone: '', recipientId: '' });
    setNewRecipientData({ name: '', email: '', phone: '', iban: '', bankName: '', country: 'UAE', type: 'individual', swiftCode: '' });
    setOperationComplete(false);
    setOperationReference('');
    setSearchTerm('');
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
            {operationType === 'send' ? 'تم إرسال التحويل بنجاح!' : 'تم طلب السحب بنجاح!'}
          </h2>
          
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6">
            {operationType === 'send' 
              ? 'تم معالجة طلب التحويل وإرساله بنجاح'
              : 'تم معالجة طلب السحب وسيكون جاهزاً للاستلام قريباً'
            }
          </p>

          <div className="bg-light-surface/50 dark:bg-dark-surface/50 backdrop-blur-sm border border-light-border dark:border-dark-border rounded-xl p-6 max-w-md mx-auto mb-8">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-light-text-secondary dark:text-dark-text-secondary">رقم المرجع:</span>
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
                <span className="text-light-text-secondary dark:text-dark-text-secondary">المبلغ:</span>
                <span className="font-bold text-light-text dark:text-dark-text">
                  {parseFloat(operationType === 'send' ? transferData.amount : withdrawalData.amount).toLocaleString()} {operationType === 'send' ? transferData.currency : withdrawalData.currency}
                </span>
              </div>
              
              {operationType === 'send' ? (
                <div className="flex justify-between">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">المستلم:</span>
                  <span className="font-medium text-light-text dark:text-dark-text">
                    {recipientType === 'saved' && selectedRecipientData ? selectedRecipientData.name : newRecipientData.name}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">طريقة السحب:</span>
                  <span className="font-medium text-light-text dark:text-dark-text">
                    {selectedMethod === 'western-union' ? 'ويسترن يونيون' : 'شبكة الوكلاء'}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-light-text-secondary dark:text-dark-text-secondary">وقت المعالجة:</span>
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
              {operationType === 'send' ? 'إرسال تحويل جديد' : 'طلب سحب جديد'}
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
            {operationType === 'send' ? 'جاري معالجة التحويل...' : 'جاري معالجة طلب السحب...'}
          </h2>
          
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6">
            {operationType === 'send' 
              ? 'يرجى الانتظار، جاري معالجة طلب التحويل'
              : 'يرجى الانتظار، جاري معالجة طلب السحب'
            }
          </p>

          <div className="bg-light-surface/50 dark:bg-dark-surface/50 backdrop-blur-sm border border-light-border dark:border-dark-border rounded-xl p-4 max-w-sm mx-auto">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-lime-accent animate-pulse" />
              <span className="text-sm text-light-text dark:text-dark-text">
                وقت المعالجة المتوقع: {selectedMethodData?.processingTime}
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
        <h2 className="text-3xl font-bold text-light-text dark:text-dark-text font-editorial">إرسال وسحب الأموال</h2>
        <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">إرسال الأموال للآخرين أو سحب نقدي من حسابك</p>
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
            <span>إرسال الأموال</span>
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
            <span>سحب الأموال</span>
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
          {operationType === 'send' ? 'اختر طريقة التحويل' : 'اختر طريقة السحب'}
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
                      {method.status === 'available' ? 'متاح' : 'صيانة'}
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
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">وقت المعالجة:</span>
                  <span className="text-light-text dark:text-dark-text">{method.processingTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">الرسوم:</span>
                  <span className="text-light-text dark:text-dark-text">{method.fees}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">الحد الأدنى/الأقصى:</span>
                  <span className="text-light-text dark:text-dark-text">
                    {method.minAmount.toLocaleString()} - {method.maxAmount.toLocaleString()} AED
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
          <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial mb-4">اختر المستلم</h3>
          
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
              المستلمون المحفوظون
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
              مستلم جديد
            </motion.button>
          </div>

          {recipientType === 'saved' ? (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                <input
                  type="text"
                  placeholder="البحث في المستلمين..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                />
              </div>

              {/* Recipients List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRecipients.map((recipient, index) => (
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
                      <img
                        src={recipient.avatar}
                        alt={recipient.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">

                  {/* خيار حفظ المستلم الجديد */}
                  {(transferData.recipientName && 
                    !savedRecipients.some(r => r.name.toLowerCase() === transferData.recipientName.toLowerCase())) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center space-x-3 p-3 bg-lime-accent/5 border border-lime-accent/20 rounded-xl"
                    >
                      <input
                        type="checkbox"
                        id="saveRecipient"
                        checked={saveRecipient}
                        onChange={(e) => setSaveRecipient(e.target.checked)}
                        className="w-4 h-4 text-lime-accent bg-light-glass dark:bg-dark-glass border-light-border dark:border-dark-border rounded focus:ring-lime-accent/50"
                      />
                      <label htmlFor="saveRecipient" className="text-sm text-light-text dark:text-dark-text cursor-pointer">
                        حفظ هذا المستلم في قائمة المستلمين المحفوظين
                      </label>
                    </motion.div>
                  )}

                  {/* خيار حفظ المرسل الجديد */}
                  {(transferData.senderName && 
                    !savedRecipients.some(r => r.name.toLowerCase() === transferData.senderName.toLowerCase())) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center space-x-3 p-3 bg-lime-accent/5 border border-lime-accent/20 rounded-xl"
                    >
                      <input
                        type="checkbox"
                        id="saveSender"
                        checked={saveRecipient}
                        onChange={(e) => setSaveRecipient(e.target.checked)}
                        className="w-4 h-4 text-lime-accent bg-light-glass dark:bg-dark-glass border-light-border dark:border-dark-border rounded focus:ring-lime-accent/50"
                      />
                      <label htmlFor="saveSender" className="text-sm text-light-text dark:text-dark-text cursor-pointer">
                        حفظ هذا المرسل في قائمة المرسلين المحفوظين
                      </label>
                    </motion.div>
                  )}
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
                              {recipient.type === 'business' ? 'شركة' : 'فرد'}
                            </span>
                            {recipient.lastUsed && (
                              <span className="text-xs">آخر استخدام: {new Date(recipient.lastUsed).toLocaleDateString('ar-AE')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">اسم المستلم</label>
                <input
                  type="text"
                  value={newRecipientData.name}
                  onChange={(e) => setNewRecipientData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="أدخل اسم المستلم"
                  className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                />
              </div>
              
              {isSwiftTransfer && (
                <div>
                  <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">نوع المستلم</label>
                  <select
                    value={newRecipientData.type}
                    onChange={(e) => setNewRecipientData(prev => ({ ...prev, type: e.target.value as 'individual' | 'business' }))}
                    className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                  >
                    <option value="individual">فرد</option>
                    <option value="business">شركة</option>
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">رقم الآيبان</label>
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
                    <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">اسم البنك</label>
                    <input
                      type="text"
                      value={newRecipientData.bankName}
                      onChange={(e) => setNewRecipientData(prev => ({ ...prev, bankName: e.target.value }))}
                      placeholder="أدخل اسم البنك"
                      className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">كود السويفت</label>
                    <input
                      type="text"
                      value={newRecipientData.swiftCode}
                      onChange={(e) => setNewRecipientData(prev => ({ ...prev, swiftCode: e.target.value }))}
                      placeholder="SWIFT/BIC Code"
                      className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={newRecipientData.email}
                      onChange={(e) => setNewRecipientData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="example@email.com"
                      className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">رقم الهاتف</label>
                    <input
                      type="tel"
                      value={newRecipientData.phone}
                      onChange={(e) => setNewRecipientData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+971 50 123 4567"
                      className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">الدولة</label>
                    <select
                      value={newRecipientData.country}
                      onChange={(e) => setNewRecipientData(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                    >
                      <option value="UAE">الإمارات العربية المتحدة</option>
                      <option value="SA">المملكة العربية السعودية</option>
                      <option value="QA">قطر</option>
                      <option value="KW">الكويت</option>
                      <option value="BH">البحرين</option>
                      <option value="OM">عمان</option>
                      <option value="US">الولايات المتحدة</option>
                      <option value="UK">المملكة المتحدة</option>
                      <option value="DE">ألمانيا</option>
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
          <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial mb-4">تفاصيل التحويل</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">المبلغ</label>
                <div className="relative">
                  <input
                    type="number"
                    value={transferData.amount}
                    onChange={(e) => setTransferData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="أدخل المبلغ"
                    className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 pr-16 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary">
                    {transferData.currency}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">العملة</label>
                <select
                  value={transferData.currency}
                  onChange={(e) => setTransferData(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                >
                  {selectedMethodData?.currencies?.map(currency => (
                    <option key={currency} value={currency}>
                      {currency === 'AED' ? 'درهم إماراتي (AED)' :
                       currency === 'USD' ? 'دولار أمريكي (USD)' :
                       currency === 'EUR' ? 'يورو (EUR)' :
                       currency === 'GBP' ? 'جنيه إسترليني (GBP)' : currency}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">الغرض من التحويل</label>
                <select
                  value={transferData.purpose}
                  onChange={(e) => setTransferData(prev => ({ ...prev, purpose: e.target.value }))}
                  className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                >
                  <option value="">اختر الغرض</option>
                  <option value="business-payment">دفعة تجارية</option>
                  <option value="salary">راتب</option>
                  <option value="family-support">دعم عائلي</option>
                  <option value="investment">استثمار</option>
                  <option value="loan-repayment">سداد قرض</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Recipient Summary */}
              <div className="bg-lime-accent/10 border border-lime-accent/30 rounded-xl p-4">
                <h4 className="font-medium text-light-text dark:text-dark-text mb-3">ملخص المستلم:</h4>
                {recipientType === 'saved' && selectedRecipientData ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <img src={selectedRecipientData.avatar} alt="" className="w-8 h-8 rounded-full" />
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
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">ملاحظات (اختياري)</label>
                <textarea
                  value={transferData.notes}
                  onChange={(e) => setTransferData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="أي ملاحظات إضافية..."
                  rows={3}
                  className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Transfer Summary */}
          {transferData.amount && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl"
            >
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3">ملخص التحويل:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 dark:text-blue-300">المبلغ:</span>
                  <p className="font-bold text-blue-800 dark:text-blue-200">
                    {parseFloat(transferData.amount).toLocaleString()} {transferData.currency}
                  </p>
                </div>
                <div>
                  <span className="text-blue-600 dark:text-blue-300">الرسوم:</span>
                  <p className="font-medium text-blue-800 dark:text-blue-200">{selectedMethodData?.fees}</p>
                </div>
                <div>
                  <span className="text-blue-600 dark:text-blue-300">وقت المعالجة:</span>
                  <p className="font-medium text-blue-800 dark:text-blue-200">{selectedMethodData?.processingTime}</p>
                </div>
                <div>
                  <span className="text-blue-600 dark:text-blue-300">طريقة التحويل:</span>
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
              <span>إرسال التحويل</span>
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
            {selectedMethod === 'western-union' ? 'تفاصيل السحب - ويسترن يونيون' : 'تفاصيل السحب - شبكة الوكلاء'}
          </h3>
          
          {selectedMethod === 'western-union' ? (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">التعليمات:</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  بعد تأكيد الطلب، ستحصل على رقم مرجع (MTCN) يمكنك استخدامه لسحب الأموال من أي فرع ويسترن يونيون.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">المبلغ</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={withdrawalData.amount}
                      onChange={(e) => setWithdrawalData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="أدخل المبلغ"
                      className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 pr-16 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary">
                      {withdrawalData.currency}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">العملة</label>
                  <select
                    value={withdrawalData.currency}
                    onChange={(e) => setWithdrawalData(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                  >
                    <option value="AED">درهم إماراتي (AED)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                    <option value="EUR">يورو (EUR)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">اسم المستلم</label>
                  <input
                    type="text"
                    value={withdrawalData.recipientName}
                    onChange={(e) => setWithdrawalData(prev => ({ ...prev, recipientName: e.target.value }))}
                    placeholder="اسم الشخص الذي سيستلم الأموال"
                    className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">رقم هاتف المستلم</label>
                  <input
                    type="tel"
                    value={withdrawalData.recipientPhone}
                    onChange={(e) => setWithdrawalData(prev => ({ ...prev, recipientPhone: e.target.value }))}
                    placeholder="+961 70 123 456"
                    className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                  />
                </div>

                <div>
                  <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">مكان الاستلام</label>
                  <select
                    value={withdrawalData.pickupLocation}
                    onChange={(e) => setWithdrawalData(prev => ({ ...prev, pickupLocation: e.target.value }))}
                    className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                  >
                    <option value="">اختر مكان الاستلام</option>
                    <option value="lebanon">لبنان</option>
                    <option value="syria">سوريا</option>
                    <option value="jordan">الأردن</option>
                    <option value="egypt">مصر</option>
                  </select>
                </div>
              </div>

              {/* WhatsApp Support */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">تحتاج مساعدة؟ تواصل معنا</p>
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
                    <span className="text-sm">واتساب</span>
                  </motion.a>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Country Info */}
              <div className="bg-lime-accent/10 border border-lime-accent/30 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-lime-accent rounded-full"></div>
                  <p className="text-sm text-light-text dark:text-dark-text">
                    <strong>بلد الإقامة المسجل:</strong> {userCountry === 'lebanon' ? 'لبنان' : userCountry === 'syria' ? 'سوريا' : 'الأردن'}
                  </p>
                </div>
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-2">
                  يمكنك السحب من الوكلاء في بلد إقامتك المسجل فقط لضمان الأمان
                </p>
              </div>

              {/* Amount Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">المبلغ</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={withdrawalData.amount}
                      onChange={(e) => setWithdrawalData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="أدخل المبلغ"
                      className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 pr-16 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary">
                      {withdrawalData.currency}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">العملة</label>
                  <select
                    value={withdrawalData.currency}
                    onChange={(e) => setWithdrawalData(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                  >
                    <option value="AED">درهم إماراتي (AED)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                    <option value="EUR">يورو (EUR)</option>
                  </select>
                </div>
              </div>

              {/* Agents List */}
              {currentAgents.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="font-medium text-light-text dark:text-dark-text">الوكلاء المتاحين في {userCountry === 'lebanon' ? 'لبنان' : userCountry === 'syria' ? 'سوريا' : 'الأردن'}:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentAgents.map((agent) => (
                      <motion.div
                        key={agent.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setSelectedAgent(agent.id)}
                        className={`p-4 border rounded-xl cursor-pointer transition-all ${
                          selectedAgent === agent.id
                            ? 'border-lime-accent/50 bg-lime-accent/5'
                            : 'border-light-border dark:border-dark-border hover:border-lime-accent/30'
                        }`}
                      >
                        <div className="flex items-start space-x-4">
                          <img
                            src={agent.avatar}
                            alt={agent.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-light-text dark:text-dark-text truncate">{agent.name}</h5>
                              {selectedAgent === agent.id && (
                                <CheckCircle className="w-5 h-5 text-lime-accent flex-shrink-0" />
                              )}
                            </div>
                            <div className="space-y-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                              <p>{agent.city} - {agent.area}</p>
                              <p className="flex items-center space-x-2">
                                <span>{agent.phone}</span>
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs">⭐ {agent.rating}</span>
                                <span className="text-xs">{agent.workingHours}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
                </div>
              ) : (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6 text-center">
                  <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-3" />
                  <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">لا توجد وكلاء متاحون</h4>
                  <p className="text-sm text-orange-600 dark:text-orange-300">
                    عذراً، لا يوجد وكلاء معتمدون في {userCountry === 'lebanon' ? 'لبنان' : userCountry === 'syria' ? 'سوريا' : 'الأردن'} حالياً.
                  </p>
                </div>
              )}

              {/* Contact Agent Button */}
              {selectedAgent && withdrawalData.amount && (
                <div className="flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const selectedAgentData = currentAgents.find(a => a.id === selectedAgent);
                      if (selectedAgentData && withdrawalData.amount) {
                        const whatsappUrl = `https://wa.me/${selectedAgentData.phone.replace(/\s/g, '').replace('+', '')}?text=مرحباً%2C%20${selectedAgentData.name}%20أريد%20سحب%20مبلغ%20${withdrawalData.amount}%20${withdrawalData.currency}%20عبر%20TradeHub`;
                        window.open(whatsappUrl, '_blank');
                      }
                    }}
                    className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-yellow-500 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-yellow-600 transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>تأكيد السحب عبر الواتساب</span>
                  </motion.button>
                </div>
              )}
            </div>
          )}

          {/* Withdrawal Summary */}
          {withdrawalData.amount && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl"
            >
              <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-3">ملخص السحب:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-orange-600 dark:text-orange-300">المبلغ:</span>
                  <p className="font-bold text-orange-800 dark:text-orange-200">
                    {parseFloat(withdrawalData.amount).toLocaleString()} {withdrawalData.currency}
                  </p>
                </div>
                <div>
                  <span className="text-orange-600 dark:text-orange-300">الرسوم:</span>
                  <p className="font-medium text-orange-800 dark:text-orange-200">{selectedMethodData?.fees}</p>
                </div>
                <div>
                  <span className="text-orange-600 dark:text-orange-300">وقت المعالجة:</span>
                  <p className="font-medium text-orange-800 dark:text-orange-200">{selectedMethodData?.processingTime}</p>
                </div>
                <div>
                  <span className="text-orange-600 dark:text-orange-300">طريقة السحب:</span>
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
                (selectedMethod === 'agents' && !selectedAgent)
              }
              className="flex items-center space-x-2 bg-lime-accent text-light-base dark:text-dark-base px-8 py-3 rounded-xl font-medium hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownLeft className="w-5 h-5" />
              <span>تأكيد السحب</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};