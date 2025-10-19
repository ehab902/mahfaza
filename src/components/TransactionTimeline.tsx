import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, ShoppingBag, Coffee, Plane, Briefcase, Search } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import { useLanguage } from '../contexts/LanguageContext';

const categoryColors = {
  Business: 'bg-blue-500/20 text-blue-400',
  Income: 'bg-lime-accent/20 text-lime-accent',
  Travel: 'bg-purple-500/20 text-purple-400',
  Shopping: 'bg-orange-500/20 text-orange-400',
  Food: 'bg-pink-500/20 text-pink-400',
};

export const TransactionTimeline: React.FC = () => {
  const { transactions, loading, error } = useTransactions(); // Get all transactions
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [limitCount, setLimitCount] = React.useState(10);

  const filteredTransactions = transactions.filter(transaction =>
    (transaction.recipient && transaction.recipient.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (transaction.sender && transaction.sender.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (transaction.description && transaction.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ).slice(0, limitCount);

  // Show loading state
  if (loading) {
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
      >
        <h2 className="text-3xl font-bold text-light-text dark:text-dark-text font-editorial">{t('transactions.title')}</h2>
        <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">{t('transactions.subtitle')}</p>
      </motion.div>

      {/* Search Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-light-surface/50 dark:bg-dark-surface/50 backdrop-blur-sm border border-light-border dark:border-dark-border rounded-xl p-4 transition-colors duration-300"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
          <input
            type="text"
            placeholder={t('transactions.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text placeholder-light-text-secondary dark:placeholder-dark-text-secondary focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
          />
        </div>
      </motion.div>
      {/* Transaction List */}
      <div className="bg-light-surface/50 dark:bg-dark-surface/50 backdrop-blur-sm border border-light-border dark:border-dark-border rounded-2xl p-6 shadow-glass transition-colors duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-light-text dark:text-dark-text font-editorial">
            {t('transactions.recent')}
          </h3>
          <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            {filteredTransactions.length} {t('transactions.transaction')}
          </span>
        </div>
        
        <div className="space-y-4">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.01, x: 5 }}
              className="flex items-center space-x-4 p-4 rounded-xl hover:bg-light-glass dark:hover:bg-dark-glass transition-all group relative duration-300"
            >
              {/* Transaction Icon */}
              <div className={`p-3 rounded-full ${transaction.type === 'sent' ? 'bg-red-500/20' : 'bg-lime-accent/20'}`}>
                {transaction.type === 'sent' || transaction.type === 'withdrawal' ? (
                  <ArrowUpRight className={`w-5 h-5 ${transaction.type === 'sent' ? 'text-red-400' : 'text-lime-accent'}`} />
                ) : (
                  <ArrowDownLeft className="w-5 h-5 text-lime-accent" />
                )}
              </div>

              {/* Transaction Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="font-medium text-light-text dark:text-dark-text font-editorial truncate">
                    {transaction.recipient || transaction.sender || t('common.unknown')}
                  </p>
                  <span className="text-lg">{transaction.country_flag || (transaction as any).flag || '🏦'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    {transaction.location || t('transactions.unknownLocation')}
                  </p>
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">•</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    transaction.category ? categoryColors[transaction.category as keyof typeof categoryColors] || 'bg-gray-500/20 text-gray-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {transaction.category || t('transactions.general')}
                  </span>
                </div>
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                  {transaction.description || t('transactions.noDescription')}
                </p>
              </div>

              {/* Amount and Time */}
              <div className="text-right">
                <motion.p
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                  className={`font-bold font-editorial text-lg ${
                    transaction.amount > 0 ? 'text-lime-accent' : 'text-light-text dark:text-dark-text'
                  }`}
                >
                  {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()} €
                </motion.p>
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                  {transaction.created_at ? 
                    new Date(transaction.created_at.toDate ? transaction.created_at.toDate() : transaction.created_at).toLocaleDateString('ar-AE') :
                    new Date().toLocaleDateString('ar-AE')
                  }
                </p>
              </div>

              {/* Hover effect line */}
              <motion.div
                initial={{ width: 0 }}
                whileHover={{ width: '100%' }}
                className="absolute bottom-0 left-0 h-px bg-lime-accent/30"
              />
            </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <Search className="w-12 h-12 text-light-text-secondary dark:text-dark-text-secondary mx-auto mb-4 opacity-50" />
              <p className="text-light-text-secondary dark:text-dark-text-secondary">
                {searchTerm ? t('transactions.noSearchResults') : t('transactions.noTransactions')}
              </p>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">{t('transactions.tryOtherKeywords')}</p>
            </motion.div>
          )}
        </div>

        {/* View More Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setLimitCount(prev => prev === 10 ? 50 : 10)}
          className="w-full mt-6 py-3 bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text hover:border-lime-accent/30 hover:text-lime-accent transition-all font-medium duration-300"
        >
          {limitCount === 10 ? t('transactions.viewMore') : t('transactions.viewLess')}
        </motion.button>
        
        {error && (
          <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
        )}
      </div>
    </div>
  );
};