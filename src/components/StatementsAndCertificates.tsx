import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Calendar, Filter, Search, Eye, Award, Shield } from 'lucide-react';
import { generateAccountStatement, generateBalanceCertificate, generateTaxDeclaration, StatementData, TaxData } from '../utils/pdfGenerator';
import { useDocuments } from '../hooks/useDocuments';
import { useBankAccount } from '../hooks/useBankAccount';
import { useUserProfile } from '../hooks/useUserProfile';
import { useTransactions } from '../hooks/useTransactions';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { useLanguage } from '../contexts/LanguageContext';

const documentTypes = [
  { id: 'all', labelKey: 'statements.allDocuments', icon: FileText },
  { id: 'statement', labelKey: 'statements.statements', icon: FileText },
  { id: 'certificate', labelKey: 'statements.certificates', icon: Award },
  { id: 'tax-document', labelKey: 'statements.taxDocuments', icon: Shield }
];

export const StatementsAndCertificates: React.FC = () => {
  const { documents, loading, error, createDocument } = useDocuments();
  const { account } = useBankAccount();
  const { profile } = useUserProfile();
  const { transactions } = useTransactions(1000); // Get all transactions for statements and tax calculations
  const [user] = useAuthState(auth);
  const { t } = useLanguage();
  
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');

  // Generate years array from account creation year to current year
  const currentYear = new Date().getFullYear();
  const accountCreationYear = account?.created_at
    ? new Date(account.created_at.toDate ? account.created_at.toDate() : account.created_at).getFullYear()
    : currentYear;
  const startYear = Math.min(accountCreationYear, currentYear);
  const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i);

  // Get user display name
  const getUserDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile?.first_name) {
      return profile.first_name;
    }
    if (user?.displayName) {
      return user.displayName;
    }
    if (user?.email) {
      const emailParts = user.email.split('@');
      return emailParts[0];
    }
    return 'مستخدم';
  };

  // Calculate tax data from transactions
  const calculateTaxData = (year: string): TaxData => {
    if (!account) {
      return {
        accountNumber: '',
        accountHolder: getUserDisplayName(),
        year,
        totalDeposits: 0,
        totalWithdrawals: 0,
        averageBalance: 0,
        vatTransactions: 0,
        currency: 'EUR'
      };
    }

    const yearTransactions = transactions.filter(t => {
      const txDate = t.created_at ? new Date(t.created_at.toDate ? t.created_at.toDate() : t.created_at) : new Date();
      return txDate.getFullYear().toString() === year;
    });

    const deposits = yearTransactions
      .filter(t => t.type === 'deposit' || t.type === 'received')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const withdrawals = yearTransactions
      .filter(t => t.type === 'withdrawal' || t.type === 'sent')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const vatTransactions = yearTransactions.filter(t => Math.abs(t.amount) >= 1000).length;

    return {
      accountNumber: account.iban,
      accountHolder: getUserDisplayName(),
      year,
      totalDeposits: deposits,
      totalWithdrawals: withdrawals,
      averageBalance: account.balance,
      vatTransactions,
      currency: account.currency
    };
  };

  const handleCustomRequest = async () => {
    if (!selectedDocumentType) return;
    
    if (!account) {
      console.error('No account data available');
      return;
    }

    let title = '';
    let description = '';
    
    switch (selectedDocumentType) {
      case 'monthly-statement':
        title = t('statements.monthlyStatement');
        description = `${t('statements.monthlyStatement')} ${selectedMonth} ${selectedYear}`;
        break;
      case 'certificate':
        title = t('statements.balanceCertificate');
        description = t('statements.balanceCertificate');
        break;
      case 'tax-document':
        title = t('statements.taxDocument');
        description = `${t('statements.taxDocument')} ${selectedYear}`;
        break;
    }

    // Create document in database
    await createDocument({
      type: selectedDocumentType === 'monthly-statement' ? 'statement' : selectedDocumentType as 'certificate' | 'tax-document',
      title,
      description,
      ...(selectedDocumentType !== 'certificate' && selectedMonth && selectedYear && {
        period: `${selectedMonth} ${selectedYear}`
      })
    });

    // Generate PDF
    if (selectedDocumentType === 'certificate') {
      await generateBalanceCertificate(account.iban, account.balance, account.currency);
    } else if (selectedDocumentType === 'tax-document') {
      const taxData = calculateTaxData(selectedYear || currentYear.toString());
      await generateTaxDeclaration(taxData);
    } else {
      // For all other types, generate statement
      // Convert transactions to the format expected by PDF generator
      const transactionData = transactions.map(t => ({
        date: t.created_at ? new Date(t.created_at.toDate ? t.created_at.toDate() : t.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        description: t.description || `${t.type === 'sent' ? 'Payment to' : 'Payment from'} ${t.recipient || t.sender || 'Unknown'}`,
        amount: t.amount,
        balance: account.balance, // This should ideally be calculated based on transaction history
        reference: t.reference || `TXN${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      }));

      const sampleData: StatementData = {
        accountNumber: account.iban,
        accountHolder: getUserDisplayName(),
        period: selectedMonth && selectedYear ? `${selectedMonth} ${selectedYear}` : `December ${currentYear}`,
        balance: account.balance,
        currency: account.currency,
        transactions: transactionData
      };
      await generateAccountStatement(sampleData);
    }

    // Reset form
    setSelectedDocumentType('');
    setSelectedMonth('');
    setSelectedYear('');
    setPurpose('');
    setNotes('');
  };

  const handleDownloadStatement = async () => {
    if (!account) {
      console.error('No account data available');
      return;
    }

    // Convert transactions to the format expected by PDF generator
    const transactionData = transactions.map(t => ({
      date: t.created_at ? new Date(t.created_at.toDate ? t.created_at.toDate() : t.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      description: t.description || `${t.type === 'sent' ? 'Payment to' : 'Payment from'} ${t.recipient || t.sender || 'Unknown'}`,
      amount: t.amount,
      balance: account.balance, // This should ideally be calculated based on transaction history
      reference: t.reference || `TXN${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    }));

    const sampleData: StatementData = {
      accountNumber: account.iban,
      accountHolder: getUserDisplayName(),
      period: `December ${currentYear}`,
      balance: account.balance,
      currency: account.currency,
      transactions: transactionData
    };
    
    await generateAccountStatement(sampleData);
  };

  const handleDownloadCertificate = async () => {
    if (!account) {
      console.error('No account data available');
      return;
    }
    await generateBalanceCertificate(account.iban, account.balance, 'EUR');
  };
  
  const handleDownloadTaxDeclaration = async () => {
    if (!account) {
      console.error('No account data available');
      return;
    }
    const taxData = calculateTaxData(currentYear.toString());
    await generateTaxDeclaration(taxData);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-lime-accent/20 text-lime-accent';
      case 'processing':
        return 'bg-orange-500/20 text-orange-400';
      case 'expired':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready':
        return t('statements.readyToDownload');
      case 'processing':
        return t('common.processing');
      case 'expired':
        return t('common.expired');
      default:
        return t('common.unknown');
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'statement':
        return FileText;
      case 'certificate':
        return Award;
      case 'tax-document':
        return Shield;
      default:
        return FileText;
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesType = selectedType === 'all' || doc.type === selectedType;
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold text-light-text dark:text-dark-text font-editorial">{t('statements.title')}</h2>
        <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">{t('statements.subtitle')}</p>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-lime-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">{t('common.loading')}</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Quick Request Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gradient-to-r from-light-surface/80 to-light-glass dark:from-dark-surface/80 dark:to-dark-glass border border-light-border dark:border-dark-border rounded-2xl p-6 shadow-glass transition-colors duration-300"
      >
        <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial mb-4">{t('statements.requestNew')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-col items-center space-y-2 p-4 bg-light-glass dark:bg-dark-glass rounded-xl hover:bg-lime-accent/10 transition-colors"
          >
            <FileText className="w-8 h-8 text-lime-accent" />
            <span className="text-sm font-medium text-light-text dark:text-dark-text">{t('statements.accountStatement')}</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-col items-center space-y-2 p-4 bg-light-glass dark:bg-dark-glass rounded-xl hover:bg-lime-accent/10 transition-colors"
          >
            <Award className="w-8 h-8 text-lime-accent" />
            <span className="text-sm font-medium text-light-text dark:text-dark-text">{t('statements.balanceCertificate')}</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-col items-center space-y-2 p-4 bg-light-glass dark:bg-dark-glass rounded-xl hover:bg-lime-accent/10 transition-colors"
          >
            <Shield className="w-8 h-8 text-lime-accent" />
            <span className="text-sm font-medium text-light-text dark:text-dark-text">{t('statements.taxDocument')}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-light-surface/50 dark:bg-dark-surface/50 backdrop-blur-sm border border-light-border dark:border-dark-border rounded-xl p-6 transition-colors duration-300"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
          {/* Document Type Filter */}
          <div className="flex items-center space-x-2 overflow-x-auto">
            {documentTypes.map((type) => (
              <motion.button
                key={type.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedType(type.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                  selectedType === type.id
                    ? 'bg-lime-accent/20 text-lime-accent border border-lime-accent/30'
                    : 'bg-light-glass dark:bg-dark-glass text-light-text dark:text-dark-text hover:bg-lime-accent/10'
                }`}
              >
                <type.icon className="w-4 h-4" />
                <span className="text-sm">{t(type.labelKey)}</span>
              </motion.button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
            <input
              type="text"
              placeholder={t('statements.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
            />
          </div>
        </div>
      </motion.div>

      {/* Documents List */}
      {!loading && (
        <div className="space-y-4">
        {filteredDocuments.map((document, index) => {
          const DocumentIcon = getDocumentIcon(document.type);
          return (
            <motion.div
              key={document.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-light-surface/50 dark:bg-dark-surface/50 backdrop-blur-sm border border-light-border dark:border-dark-border rounded-xl p-6 hover:border-lime-accent/30 transition-all hover:shadow-glow duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-lime-accent/10 rounded-full">
                    <DocumentIcon className="w-6 h-6 text-lime-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-light-text dark:text-dark-text font-editorial">{document.title}</h3>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{document.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                        {document.created_at ? 
                          new Date(document.created_at.toDate ? document.created_at.toDate() : document.created_at).toLocaleDateString('ar-AE') :
                          new Date().toLocaleDateString('ar-AE')
                        }
                      </span>
                      {document.period && (
                        <>
                          <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">•</span>
                          <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{document.period}</span>
                        </>
                      )}
                      <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">•</span>
                      <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{document.file_size || '1.2 MB'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                    {getStatusText(document.status)}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    {document.status === 'ready' && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 bg-light-glass dark:bg-dark-glass rounded-lg hover:bg-lime-accent/10 transition-colors"
                        >
                          <Eye className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={
                            document.type === 'statement' 
                              ? handleDownloadStatement 
                              : document.type === 'certificate'
                              ? handleDownloadCertificate
                              : handleDownloadTaxDeclaration
                          }
                          className="p-2 bg-lime-accent/10 text-lime-accent rounded-lg hover:bg-lime-accent/20 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </motion.button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      )}

      {/* Custom Request Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-gradient-to-r from-light-surface/80 to-light-glass dark:from-dark-surface/80 dark:to-dark-glass border border-light-border dark:border-dark-border rounded-2xl p-6 shadow-glass transition-colors duration-300"
      >
        <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial mb-4">{t('statements.customRequest')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('statements.documentType')}</label>
              <select
                value={selectedDocumentType}
                onChange={(e) => setSelectedDocumentType(e.target.value)}
                className="w-full bg-white dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
              >
                <option value="" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('statements.selectDocumentType')}</option>
                <option value="monthly-statement" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('statements.monthlyStatement')}</option>
                <option value="certificate" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('statements.balanceCertificate')}</option>
                <option value="tax-document" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('statements.taxDocument')}</option>
              </select>
            </div>
            {selectedDocumentType !== 'certificate' && (
            <div className="space-y-4">
            <div>
              <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('statements.requiredMonth')}</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-white dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
              >
                <option value="" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('statements.selectMonth')}</option>
                <option value="january" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('month.january')}</option>
                <option value="february" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('month.february')}</option>
                <option value="march" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('month.march')}</option>
                <option value="april" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('month.april')}</option>
                <option value="may" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('month.may')}</option>
                <option value="june" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('month.june')}</option>
                <option value="july" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('month.july')}</option>
                <option value="august" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('month.august')}</option>
                <option value="september" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('month.september')}</option>
                <option value="october" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('month.october')}</option>
                <option value="november" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('month.november')}</option>
                <option value="december" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('month.december')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('statements.year')}</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-white dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
              >
                <option value="" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('statements.selectYear')}</option>
                {years.map(year => (
                  <option key={year} value={year} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{year}</option>
                ))}
              </select>
            </div>
            </div>
            )}
          </div>
          <div className="space-y-4">
            {selectedDocumentType !== 'certificate' && (
            <div>
              <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('statements.purpose')}</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder={t('statements.purposePlaceholder')}
                className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
              />
            </div>
            )}
          </div>
        </div>
        {selectedDocumentType !== 'certificate' && (
        <div className="mt-6">
          <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('statements.additionalNotes')}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('statements.notesPlaceholder')}
            rows={3}
            className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300 resize-none"
          />
        </div>
        )}
        <div className="flex justify-end mt-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!selectedDocumentType}
            onClick={handleCustomRequest}
            className="bg-lime-accent text-light-base dark:text-dark-base px-6 py-3 rounded-xl font-medium hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('statements.sendRequest')}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};