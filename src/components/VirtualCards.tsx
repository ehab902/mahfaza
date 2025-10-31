import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Plus, Eye, EyeOff, Lock, Unlock, Settings, Trash2, Copy, Wifi, CheckCircle } from 'lucide-react';
import { useVirtualCards, CreateCardData } from '../hooks/useVirtualCards';
import { useLanguage } from '../contexts/LanguageContext';
import { useUserProfile } from '../hooks/useUserProfile';

export const VirtualCards: React.FC = () => {
  const { cards, loading, error, createCard, updateCardStatus, deleteCard } = useVirtualCards();
  const { profile } = useUserProfile();
  const { t } = useLanguage();
  const [showCardDetails, setShowCardDetails] = useState<{ [key: string]: boolean }>({});
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCardData, setNewCardData] = useState({
    name: '',
    card_type: 'multi-use' as 'multi-use' | 'single-use',
    limit: '',
    currency: 'EUR',
    card_brand: 'visa' as 'visa' | 'mastercard',
    card_tier: 'classic' as 'platinum' | 'gold' | 'classic'
  });

  const toggleCardDetails = (cardId: string) => {
    setShowCardDetails(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const handleCreateCard = async () => {
    if (newCardData.name && newCardData.limit) {
      setIsCreating(true);
      
      const cardData: CreateCardData = {
        name: newCardData.name,
        card_type: newCardData.card_type,
        spending_limit: parseInt(newCardData.limit),
        currency: newCardData.currency,
        card_brand: newCardData.card_brand,
        card_tier: newCardData.card_tier
      };
      
      const success = await createCard(cardData);
      
      if (success) {
        setShowCreateForm(false);
        setNewCardData({ name: '', card_type: 'multi-use', limit: '', currency: 'EUR', card_brand: 'visa', card_tier: 'classic' });
      }
      
      setIsCreating(false);
    }
  };

  const handleToggleCardStatus = async (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (card) {
      const newStatus = card.status === 'active' ? 'frozen' : 'active';
      await updateCardStatus(cardId, newStatus);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400';
      case 'frozen':
        return 'bg-blue-500/20 text-blue-400';
      case 'expired':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return t('common.active');
      case 'frozen':
        return t('common.frozen');
      case 'expired':
        return t('common.expired');
      default:
        return t('common.unknown');
    }
  };

  const getProgressBarColor = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return 'bg-blue-400';
      case 'gold':
        return 'bg-amber-400';
      case 'classic':
        return 'bg-gray-400';
      default:
        return 'bg-lime-accent';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return 'text-blue-300';
      case 'gold':
        return 'text-amber-300';
      case 'classic':
        return 'text-gray-300';
      default:
        return 'text-blue-300';
    }
  };

  const getTierText = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return 'PLATINUM';
      case 'gold':
        return 'GOLD';
      case 'classic':
        return 'CLASSIC';
      default:
        return 'CLASSIC';
    }
  };

  // Contactless Icon
  const ContactlessIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
    <svg className={`w-6 h-6 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2a10 10 0 0 1 10 10"></path>
      <path d="M12 2a10 10 0 0 0-10 10"></path>
      <path d="M12 6a6 6 0 0 1 6 6"></path>
      <path d="M12 6a6 6 0 0 0-6 6"></path>
      <path d="M12 10a2 2 0 0 1 2 2"></path>
      <path d="M12 10a2 2 0 0 0-2 2"></path>
    </svg>
  );

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-light-text dark:text-dark-text font-editorial">{t('cards.title')}</h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">{t('cards.subtitle')}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-full aspect-[1.6/1] bg-light-glass dark:bg-dark-glass rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-light-text dark:text-dark-text font-editorial">{t('cards.title')}</h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">{t('cards.subtitle')}</p>
          </div>
        </div>
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            {t('common.retry')}
          </button>
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
        <div>
          <h2 className="text-3xl font-bold text-light-text dark:text-dark-text font-editorial">{t('cards.title')}</h2>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">{t('cards.subtitle')}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-lime-accent to-lime-accent/80 text-light-base dark:text-dark-base px-6 py-3 rounded-xl font-medium hover:shadow-glow transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>{t('cards.createNew')}</span>
        </motion.button>
      </motion.div>

      {/* Empty State */}
      {cards.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="w-16 h-16 text-light-text-secondary dark:text-dark-text-secondary mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-light-text dark:text-dark-text mb-2">{t('cards.noCards')}</h3>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6">{t('cards.noCardsDesc')}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-lime-accent to-lime-accent/80 text-light-base dark:text-dark-base px-6 py-3 rounded-xl font-medium hover:shadow-glow transition-all"
          >
            {t('cards.createNew')}
          </motion.button>
        </div>
      )}

      {/* Cards Grid */}
      {cards.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="relative"
          >
            {/* Card Container */}
            <div className="relative w-full aspect-[1.6/1]">
              <div 
                className={`absolute inset-0 bg-gradient-to-br ${card.gradient} rounded-2xl overflow-hidden transform-gpu border`}
                style={{
                  borderColor: `${card.accent_color}30`,
                  boxShadow: `0 10px 30px ${card.accent_color}20`,
                  backgroundImage: `url(${card.image_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundBlendMode: 'overlay'
                }}
              >
                {/* Overlay for better text readability */}
                <div className="absolute inset-0 bg-black/50 rounded-2xl">
                </div>
                
                {/* Card Content */}
                <div className="relative z-10 p-5 h-full flex flex-col justify-between text-white">
                  {/* Top Section */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div 
                        className="text-lg font-bold mb-1 drop-shadow-lg"
                        style={{ 
                          color: card.accent_color,
                          textShadow: `0 2px 8px rgba(0,0,0,0.9), 0 0 20px ${card.accent_color}60, 0 4px 12px rgba(0,0,0,0.8)`
                        }}
                      >
                        TRADEHUB
                      </div>
                      <span 
                        className="px-2 py-1 rounded text-xs font-medium drop-shadow-md" 
                        style={{
                          background: `${card.accent_color}20`,
                          color: card.accent_color,
                          border: `1px solid ${card.accent_color}40`,
                          textShadow: `0 1px 4px rgba(0,0,0,0.8)`
                        }}
                      >
                        {getTierText(card.card_tier)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleCardDetails(card.id)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors backdrop-blur-sm"
                      >
                        {showCardDetails[card.id] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </motion.button>
                    </div>
                  </div>

                  {/* Card Number */}
                  <div className="flex-1 flex flex-col justify-center space-y-3">
                    <div className="text-center">
                      <p 
                        className="font-mono text-xl tracking-widest leading-relaxed drop-shadow-lg" 
                        style={{ 
                          fontFamily: 'Courier New, monospace',
                          color: '#FFFFFF',
                          textShadow: `0 4px 12px rgba(0,0,0,0.95), 0 0 30px ${card.accent_color}40, 0 2px 4px rgba(0,0,0,0.8)`
                        }}
                      >
                        {showCardDetails[card.id] ? card.card_number : '•••• •••• •••• ••••'}
                      </p>
                    </div>

                    {/* Card Details Row */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="space-y-1">
                        <p
                          className="font-medium truncate max-w-[140px] uppercase text-base drop-shadow-md"
                          style={{
                            color: '#FFFFFF',
                            textShadow: `0 1px 6px rgba(0,0,0,0.8), 0 0 12px ${card.accent_color}30`
                          }}
                        >
                          {profile?.first_name && profile?.last_name
                            ? `${profile.first_name} ${profile.last_name}`.toUpperCase()
                            : 'CARDHOLDER'}
                        </p>
                      </div>
                      <div className="text-center space-y-1">
                        <p 
                          className="text-xs uppercase drop-shadow-sm" 
                          style={{ 
                            color: card.accent_color,
                            textShadow: '0 1px 3px rgba(0,0,0,0.8)'
                          }}
                        >
                          EXP
                        </p>
                        <p 
                          className="font-mono drop-shadow-md" 
                          style={{
                            color: '#FFFFFF',
                            textShadow: `0 1px 6px rgba(0,0,0,0.8), 0 0 12px ${card.accent_color}30`
                          }}
                        >
                          {showCardDetails[card.id] ? card.expiry_date : '••/••'}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p 
                          className="text-xs uppercase drop-shadow-sm" 
                          style={{ 
                            color: card.accent_color,
                            textShadow: '0 1px 3px rgba(0,0,0,0.8)'
                          }}
                        >
                          CVV
                        </p>
                        <p 
                          className="font-mono drop-shadow-md" 
                          style={{
                            color: '#FFFFFF',
                            textShadow: `0 1px 6px rgba(0,0,0,0.8), 0 0 12px ${card.accent_color}30`
                          }}
                        >
                          {showCardDetails[card.id] ? card.cvv : '•••'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom section with contactless and brand */}
                  <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between">
                    <div 
                      className="flex items-center space-x-2 text-xs drop-shadow-md" 
                      style={{ 
                        color: card.accent_color,
                        textShadow: `0 1px 6px rgba(0,0,0,0.8), 0 0 15px ${card.accent_color}50, 0 2px 4px rgba(0,0,0,0.9)`
                      }}
                    >
                      <ContactlessIcon className="w-5 h-5" />
                      <span>CONTACTLESS</span>
                    </div>
                    <div 
                      className="text-2xl font-bold drop-shadow-lg" 
                      style={{ 
                        color: '#FFFFFF',
                        textShadow: `0 2px 8px rgba(0,0,0,0.9), 0 0 20px ${card.accent_color}40, 0 4px 12px rgba(0,0,0,0.8)` 
                      }}
                    >
                      {card.card_brand === 'visa' ? 'VISA' : (
                        <div className="flex items-center space-x-1">
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-red-500 rounded-full opacity-90"></div>
                            <div className="w-4 h-4 bg-yellow-400 rounded-full -ml-2 opacity-90"></div>
                          </div>
                          <span 
                            className="text-sm font-bold ml-1 drop-shadow-md"
                            style={{
                              color: card.accent_color,
                              textShadow: `0 1px 6px rgba(0,0,0,0.8), 0 0 12px ${card.accent_color}60`
                            }}
                          >
                            mastercard
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Info Below */}
            <div className="mt-4 space-y-3 p-4 bg-light-surface/50 dark:bg-dark-surface/50 backdrop-blur-sm border border-light-border dark:border-dark-border rounded-2xl shadow-glass transition-colors duration-300">
              {/* Card Name and Status */}
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-light-text dark:text-dark-text">{card.name}</h3>
                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(card.status)}`}>
                  {getStatusText(card.status)}
                </span>
              </div>

              {/* Balance and Limit */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{t('cards.availableBalance')}</span>
                <span className="font-bold" style={{ color: card.accent_color }}>{card.balance.toLocaleString()} {card.currency}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('cards.used')}</span>
                  <span className="text-light-text dark:text-dark-text">{card.spent_amount.toLocaleString()} / {card.spending_limit.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-dark-glass rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(card.spent_amount / card.spending_limit) * 100}%` }}
                    transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                    className={`h-2 rounded-full ${getProgressBarColor(card.card_tier)}`}
                  />
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex items-center space-x-2 pt-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleToggleCardStatus(card.id)}
                  className="flex-1 flex items-center justify-center space-x-2 bg-light-glass dark:bg-dark-glass px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors text-sm"
                >
                  {card.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  <span>{card.status === 'active' ? t('cards.freeze') : t('cards.unfreeze')}</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 bg-light-glass dark:bg-dark-glass rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => deleteCard && deleteCard(card.id)}
                  className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      )}

      {/* Create New Card Modal */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreateForm(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-light-text dark:text-dark-text font-editorial mb-6">{t('cards.createNew')}</h3>
            
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('cards.cardName')}</label>
                <input
                  type="text"
                  value={newCardData.name}
                  onChange={(e) => setNewCardData({...newCardData, name: e.target.value})}
                  placeholder={t('cards.cardNamePlaceholder')}
                  className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-lg px-3 py-3 text-sm text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                />
              </div>
              
              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('cards.cardType')}</label>
                <select
                  value={newCardData.card_type}
                  onChange={(e) => setNewCardData({...newCardData, card_type: e.target.value as 'multi-use' | 'single-use'})}
                  className="w-full bg-white dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-lg px-3 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                >
                  <option value="multi-use" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('cards.multiUse')}</option>
                  <option value="single-use" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('cards.singleUse')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('cards.spendingLimit')}</label>
                <input
                  type="number"
                  value={newCardData.limit}
                  onChange={(e) => setNewCardData({...newCardData, limit: e.target.value})}
                  placeholder="5000"
                  className="w-full bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-lg px-3 py-3 text-sm text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                />
              </div>
              
              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('account.currency')}</label>
                <select
                  value={newCardData.currency}
                  onChange={(e) => setNewCardData({...newCardData, currency: e.target.value})}
                  className="w-full bg-white dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-lg px-3 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                >
                  <option value="EUR" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Euro (€)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('cards.cardBrand')}</label>
                <select
                  value={newCardData.card_brand}
                  onChange={(e) => setNewCardData({...newCardData, card_brand: e.target.value as 'visa' | 'mastercard'})}
                  className="w-full bg-white dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-lg px-3 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                >
                  <option value="visa" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Visa</option>
                  <option value="mastercard" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Mastercard</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('cards.cardTier')}</label>
                <select
                  value={newCardData.card_tier}
                  onChange={(e) => setNewCardData({...newCardData, card_tier: e.target.value as 'platinum' | 'gold' | 'classic'})}
                  className="w-full bg-white dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-lg px-3 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-lime-accent/50 transition-colors duration-300"
                >
                  <option value="classic" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Classic</option>
                  <option value="gold" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Gold</option>
                  <option value="platinum" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Platinum</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateCard}
                disabled={isCreating}
                className="flex-1 bg-gradient-to-r from-lime-accent to-lime-accent/80 text-light-base dark:text-dark-base px-4 py-2 rounded-lg font-medium hover:shadow-glow transition-all text-sm"
              >
                {isCreating ? t('cards.creating') : t('cards.createCard')}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border rounded-lg text-sm text-light-text dark:text-dark-text hover:bg-red-500/10 hover:text-red-400 transition-all"
              >
                {t('common.cancel')}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};