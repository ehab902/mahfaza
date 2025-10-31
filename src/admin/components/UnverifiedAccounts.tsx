import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  AlertCircle,
  Eye
} from 'lucide-react';
import { useUnverifiedAccounts, UnverifiedAccount } from '../hooks/useUnverifiedAccounts';
import { ManualKYCReviewModal } from './ManualKYCReviewModal';

interface UnverifiedAccountsProps {
  adminId: string;
  adminEmail: string;
}

type FilterType = 'all' | 'emailVerified' | 'phoneVerified' | 'bothVerified';

export function UnverifiedAccounts({ adminId, adminEmail }: UnverifiedAccountsProps) {
  const { accounts, loading, stats, refresh } = useUnverifiedAccounts();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedAccount, setSelectedAccount] = useState<UnverifiedAccount | null>(null);

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (account.phone?.includes(searchQuery) || false);

    if (filterType === 'all') return matchesSearch;
    if (filterType === 'emailVerified') return matchesSearch && account.email_verified;
    if (filterType === 'phoneVerified') return matchesSearch && account.phone_verified;
    if (filterType === 'bothVerified') return matchesSearch && account.email_verified && account.phone_verified;

    return matchesSearch;
  });

  const statCards = [
    {
      title: 'إجمالي الحسابات غير المحققة',
      value: stats.total,
      icon: Users,
      color: 'blue',
      bgGradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'البريد الإلكتروني موثق',
      value: stats.emailVerified,
      icon: Mail,
      color: 'green',
      bgGradient: 'from-green-500 to-emerald-500'
    },
    {
      title: 'الهاتف موثق',
      value: stats.phoneVerified,
      icon: Phone,
      color: 'amber',
      bgGradient: 'from-amber-500 to-orange-500'
    },
    {
      title: 'كلاهما موثق',
      value: stats.bothVerified,
      icon: CheckCircle,
      color: 'purple',
      bgGradient: 'from-purple-500 to-pink-500'
    }
  ];

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-16 h-16 border-4 border-lime-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-light-surface dark:bg-dark-surface rounded-2xl p-6 border border-light-border dark:border-dark-border shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.bgGradient} rounded-xl flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
                  {stat.title}
                </h3>
                <p className="text-3xl font-bold text-light-text dark:text-dark-text">
                  {stat.value}
                </p>
              </motion.div>
            );
          })}
        </div>

        <div className="bg-light-surface dark:bg-dark-surface rounded-2xl border border-light-border dark:border-dark-border shadow-lg overflow-hidden">
          <div className="p-6 border-b border-light-border dark:border-dark-border">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث بالاسم أو البريد الإلكتروني أو الهاتف..."
                  className="w-full pr-11 pl-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent transition-all"
                />
              </div>
              <div className="relative">
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary pointer-events-none" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as FilterType)}
                  className="w-full sm:w-auto pr-11 pl-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent transition-all appearance-none cursor-pointer"
                >
                  <option value="all">جميع الحسابات</option>
                  <option value="emailVerified">البريد موثق فقط</option>
                  <option value="phoneVerified">الهاتف موثق فقط</option>
                  <option value="bothVerified">كلاهما موثق</option>
                </select>
              </div>
            </div>
          </div>

          {filteredAccounts.length === 0 ? (
            <div className="p-12 text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <AlertCircle className="w-12 h-12 text-light-text-secondary dark:text-dark-text-secondary mx-auto mb-4" />
                <p className="text-light-text-secondary dark:text-dark-text-secondary">
                  {searchQuery || filterType !== 'all'
                    ? 'لا توجد حسابات تطابق البحث'
                    : 'جميع الحسابات لديها طلبات KYC'}
                </p>
              </motion.div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-light-base dark:bg-dark-base">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">
                      الاسم
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">
                      البريد الإلكتروني
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">
                      الهاتف
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">
                      تاريخ التسجيل
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">
                      إجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-border dark:divide-dark-border">
                  {filteredAccounts.map((account, index) => (
                    <motion.tr
                      key={account.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-light-base dark:hover:bg-dark-base transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-light-text dark:text-dark-text">
                          {account.first_name} {account.last_name}
                        </div>
                        {account.company && (
                          <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                            {account.company}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-light-text dark:text-dark-text break-all">
                            {account.email}
                          </span>
                          {account.email_verified && (
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {account.phone ? (
                            <>
                              <span className="text-sm text-light-text dark:text-dark-text" dir="ltr">
                                {account.phone}
                              </span>
                              {account.phone_verified && (
                                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                              -
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {account.email_verified && (
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                              <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                              <span className="text-xs text-green-700 dark:text-green-300">
                                بريد موثق
                              </span>
                            </div>
                          )}
                          {account.phone_verified && (
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                              <CheckCircle className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              <span className="text-xs text-blue-700 dark:text-blue-300">
                                هاتف موثق
                              </span>
                            </div>
                          )}
                          {!account.email_verified && !account.phone_verified && (
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                              <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              <span className="text-xs text-amber-700 dark:text-amber-300">
                                غير موثقة
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                          <Calendar className="w-4 h-4" />
                          {new Date(account.created_at).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedAccount(account)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-lime-accent hover:opacity-90 text-dark-text rounded-lg text-sm font-medium transition-opacity"
                        >
                          <Eye className="w-4 h-4" />
                          تحقق يدوياً
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedAccount && (
        <ManualKYCReviewModal
          account={selectedAccount}
          onClose={() => {
            setSelectedAccount(null);
            setTimeout(() => {
              refresh();
            }, 500);
          }}
          onSuccess={() => {
            setTimeout(() => {
              refresh();
            }, 500);
          }}
          adminId={adminId}
          adminEmail={adminEmail}
        />
      )}
    </>
  );
}
