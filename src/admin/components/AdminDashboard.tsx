import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Eye,
  Moon,
  Sun,
  AlertTriangle,
  Settings,
  DollarSign,
  Shield,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Star,
  UserCheck,
  UserX,
  UserMinus,
  Wallet
} from 'lucide-react';
import { User } from 'firebase/auth';
import { auth } from '../../firebase';
import { useKYCSubmissions } from '../hooks/useKYCSubmissions';
import { useTopUpSubmissions } from '../hooks/useTopUpSubmissions';
import { KYCReviewModal } from './KYCReviewModal';
import { TopUpReviewModal } from './TopUpReviewModal';
import { AdminEmailManagement } from './AdminEmailManagement';
import { useTheme } from '../../contexts/ThemeContext';
import { useAdminCheck, logAdminAccess } from '../hooks/useAdminCheck';
import { useAgentsManagement } from '../../agents/hooks/useAgentsManagement';
import { AddAgentModal } from '../../agents/components/AddAgentModal';
import { EditAgentModal } from '../../agents/components/EditAgentModal';
import { useAgentTransactionsAdmin } from '../hooks/useAgentTransactions';

interface AdminDashboardProps {
  user: User;
}

type TabType = 'kyc' | 'topups' | 'agents' | 'agent-transactions';

export function AdminDashboard({ user }: AdminDashboardProps) {
  const { submissions: kycSubmissions, loading: kycLoading, stats: kycStats, updateSubmissionStatus: updateKYCStatus } = useKYCSubmissions();
  const { submissions: topUpSubmissions, loading: topUpLoading, stats: topUpStats, updateSubmissionStatus: updateTopUpStatus } = useTopUpSubmissions();
  const { agents, loading: agentsLoading, deleteAgent, changeAgentStatus } = useAgentsManagement();
  const { submissions: agentTransactions, loading: agentTransactionsLoading, stats: agentTransactionsStats, updateSubmissionStatus: updateAgentTransactionStatus } = useAgentTransactionsAdmin();
  const [activeTab, setActiveTab] = useState<TabType>('kyc');
  const [selectedKYCSubmission, setSelectedKYCSubmission] = useState<string | null>(null);
  const [selectedTopUpSubmission, setSelectedTopUpSubmission] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmailManagement, setShowEmailManagement] = useState(false);
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [cancellingTransactionId, setCancellingTransactionId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, error: adminError } = useAdminCheck(user);

  useEffect(() => {
    if (!isAdmin && !adminError) {
      return;
    }

    if (!isAdmin && adminError) {
      const logout = async () => {
        if (user.email) {
          await logAdminAccess(user.email, 'access_denied', 'Admin access revoked during session');
        }
        await auth.signOut();
      };
      logout();
    }
  }, [isAdmin, adminError, user]);

  const handleLogout = async () => {
    try {
      if (user.email) {
        await logAdminAccess(user.email, 'logout', 'User logged out');
      }
      await auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleApproveTopUp = async (submissionId: string) => {
    if (!user.email) return;
    await updateTopUpStatus(submissionId, 'approved', user.email);
  };

  const handleRejectTopUp = async (submissionId: string, reason: string) => {
    if (!user.email) return;
    await updateTopUpStatus(submissionId, 'rejected', user.email, reason);
  };

  const handleDeleteAgent = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الوكيل؟')) {
      await deleteAgent(id);
    }
  };

  const handleStatusChange = async (id: string, status: 'active' | 'inactive' | 'suspended') => {
    await changeAgentStatus(id, status);
  };

  const handleCancelTransaction = async () => {
    if (!cancellingTransactionId || !user.email) return;

    if (!cancellationReason.trim()) {
      alert('الرجاء إدخال سبب الإلغاء');
      return;
    }

    await updateAgentTransactionStatus(cancellingTransactionId, 'cancelled', user.email, cancellationReason);
    setCancellingTransactionId(null);
    setCancellationReason('');
  };

  const currentSubmissions = activeTab === 'agents' ? [] : activeTab === 'agent-transactions' ? agentTransactions : (activeTab === 'kyc' ? kycSubmissions : topUpSubmissions);
  const currentStats = activeTab === 'agents' ? { total: 0, pending: 0, approved: 0, rejected: 0 } : activeTab === 'agent-transactions' ? agentTransactionsStats : (activeTab === 'kyc' ? kycStats : topUpStats);
  const currentLoading = activeTab === 'agents' ? agentsLoading : activeTab === 'agent-transactions' ? agentTransactionsLoading : (activeTab === 'kyc' ? kycLoading : topUpLoading);

  const filteredSubmissions = currentSubmissions.filter((submission: any) => {
    const matchesFilter = filterStatus === 'all' || submission.status === filterStatus;
    const matchesSearch =
      (submission.user_id || submission.userId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || agent.status === filterStatus;
    const matchesCountry = filterCountry === 'all' || agent.country === filterCountry;
    return matchesSearch && matchesStatus && matchesCountry;
  });

  const countries = Array.from(new Set(agents.map(agent => agent.country)));

  const agentStats = {
    total: agents.length,
    active: agents.filter(a => a.status === 'active').length,
    inactive: agents.filter(a => a.status === 'inactive').length,
    suspended: agents.filter(a => a.status === 'suspended').length
  };

  const statCards = activeTab === 'agent-transactions' ? [
    {
      title: 'إجمالي المعاملات',
      value: agentTransactionsStats.total,
      icon: Wallet,
      color: 'blue',
      bgGradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'قيد المعالجة',
      value: agentTransactionsStats.pending,
      icon: Clock,
      color: 'amber',
      bgGradient: 'from-amber-500 to-orange-500'
    },
    {
      title: 'مكتملة',
      value: agentTransactionsStats.completed,
      icon: CheckCircle,
      color: 'green',
      bgGradient: 'from-green-500 to-emerald-500'
    },
    {
      title: 'ملغية/فاشلة',
      value: agentTransactionsStats.cancelled + agentTransactionsStats.failed,
      icon: XCircle,
      color: 'red',
      bgGradient: 'from-red-500 to-rose-500'
    }
  ] : activeTab === 'agents' ? [
    {
      title: 'إجمالي الوكلاء',
      value: agentStats.total,
      icon: Users,
      color: 'blue',
      bgGradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'نشط',
      value: agentStats.active,
      icon: UserCheck,
      color: 'green',
      bgGradient: 'from-green-500 to-emerald-500'
    },
    {
      title: 'غير نشط',
      value: agentStats.inactive,
      icon: UserMinus,
      color: 'amber',
      bgGradient: 'from-amber-500 to-orange-500'
    },
    {
      title: 'موقوف',
      value: agentStats.suspended,
      icon: UserX,
      color: 'red',
      bgGradient: 'from-red-500 to-rose-500'
    }
  ] : [
    {
      title: 'إجمالي الطلبات',
      value: currentStats.total,
      icon: Users,
      color: 'blue',
      bgGradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'قيد الانتظار',
      value: currentStats.pending,
      icon: Clock,
      color: 'amber',
      bgGradient: 'from-amber-500 to-orange-500'
    },
    {
      title: 'تمت الموافقة',
      value: currentStats.approved,
      icon: CheckCircle,
      color: 'green',
      bgGradient: 'from-green-500 to-emerald-500'
    },
    {
      title: 'مرفوضة',
      value: currentStats.rejected,
      icon: XCircle,
      color: 'red',
      bgGradient: 'from-red-500 to-rose-500'
    }
  ];

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'قيد المعالجة', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    under_review: { label: 'قيد المراجعة', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    approved: { label: 'موافق عليه', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
    rejected: { label: 'مرفوض', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
    completed: { label: 'مكتملة', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
    cancelled: { label: 'ملغية', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
    failed: { label: 'فاشلة', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
    active: { label: 'نشط', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
    inactive: { label: 'غير نشط', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    suspended: { label: 'موقوف', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' }
  };

  if (adminError) {
    return (
      <div className="min-h-screen bg-light-base dark:bg-dark-base flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-8 max-w-md text-center"
        >
          <AlertTriangle className="w-16 h-16 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-2">
            تم رفض الوصول
          </h2>
          <p className="text-red-800 dark:text-red-200 mb-6">
            {adminError}
          </p>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
          >
            العودة لصفحة تسجيل الدخول
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-base dark:bg-dark-base">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-lime-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-lime-accent/3 rounded-full blur-3xl"></div>
      </div>

      <header className="sticky top-0 z-40 bg-light-surface/80 dark:bg-dark-surface/80 backdrop-blur-xl border-b border-light-border dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">
                لوحة التحكم الإدارية
              </h1>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                مرحباً، {user.email}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowEmailManagement(!showEmailManagement)}
                className={`p-2 hover:bg-light-base dark:hover:bg-dark-base rounded-full transition-colors ${
                  showEmailManagement ? 'bg-lime-accent/20' : ''
                }`}
                title="إدارة المسؤولين"
              >
                <Settings className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-light-base dark:hover:bg-dark-base rounded-full transition-colors"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                ) : (
                  <Moon className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                )}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {showEmailManagement ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <AdminEmailManagement currentUser={user} />
          </motion.div>
        ) : (
          <>
            <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
              <button
                onClick={() => {
                  setActiveTab('kyc');
                  setFilterStatus('all');
                  setSearchQuery('');
                  setFilterCountry('all');
                }}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                  activeTab === 'kyc'
                    ? 'bg-lime-accent text-dark-text shadow-lg'
                    : 'bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text border border-light-border dark:border-dark-border hover:border-lime-accent/50'
                }`}
              >
                <Shield className="w-5 h-5" />
                التحقق من الهوية (KYC)
              </button>
              <button
                onClick={() => {
                  setActiveTab('topups');
                  setFilterStatus('all');
                  setSearchQuery('');
                  setFilterCountry('all');
                }}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                  activeTab === 'topups'
                    ? 'bg-lime-accent text-dark-text shadow-lg'
                    : 'bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text border border-light-border dark:border-dark-border hover:border-lime-accent/50'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                طلبات التعبئة
              </button>
              <button
                onClick={() => {
                  setActiveTab('agents');
                  setFilterStatus('all');
                  setSearchQuery('');
                  setFilterCountry('all');
                }}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                  activeTab === 'agents'
                    ? 'bg-lime-accent text-dark-text shadow-lg'
                    : 'bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text border border-light-border dark:border-dark-border hover:border-lime-accent/50'
                }`}
              >
                <Users className="w-5 h-5" />
                شبكة الوكلاء
              </button>
              <button
                onClick={() => {
                  setActiveTab('agent-transactions');
                  setFilterStatus('all');
                  setSearchQuery('');
                }}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                  activeTab === 'agent-transactions'
                    ? 'bg-lime-accent text-dark-text shadow-lg'
                    : 'bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text border border-light-border dark:border-dark-border hover:border-lime-accent/50'
                }`}
              >
                <Wallet className="w-5 h-5" />
                معاملات الوكلاء
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                  placeholder="بحث بمعرف المستخدم أو معرف الطلب..."
                  className="w-full pr-11 pl-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent transition-all"
                />
              </div>
              <div className="relative">
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary pointer-events-none" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full sm:w-auto pr-11 pl-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent transition-all appearance-none cursor-pointer"
                >
                  <option value="all">جميع الحالات</option>
                  {activeTab === 'agents' ? (
                    <>
                      <option value="active">نشط</option>
                      <option value="inactive">غير نشط</option>
                      <option value="suspended">موقوف</option>
                    </>
                  ) : (
                    <>
                      <option value="pending">قيد الانتظار</option>
                      {activeTab === 'kyc' && <option value="under_review">قيد المراجعة</option>}
                      <option value="approved">موافق عليه</option>
                      <option value="rejected">مرفوض</option>
                    </>
                  )}
                </select>
              </div>
              {activeTab === 'agents' && countries.length > 0 && (
                <div className="relative">
                  <select
                    value={filterCountry}
                    onChange={(e) => setFilterCountry(e.target.value)}
                    className="w-full sm:w-auto px-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">جميع الدول</option>
                    {countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {activeTab === 'agents' ? (
            <>
              {agentsLoading ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 border-4 border-lime-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-light-text-secondary dark:text-dark-text-secondary">جاري التحميل...</p>
                </div>
              ) : filteredAgents.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-light-text-secondary dark:text-dark-text-secondary">
                    لا يوجد وكلاء
                  </p>
                  <button
                    onClick={() => setShowAddAgentModal(true)}
                    className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-lime-accent hover:opacity-90 text-dark-text rounded-xl font-medium transition-opacity"
                  >
                    <Plus className="w-5 h-5" />
                    إضافة وكيل جديد
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  {filteredAgents.map((agent) => (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-light-base dark:bg-dark-base rounded-xl p-6 border border-light-border dark:border-dark-border hover:border-lime-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-light-text dark:text-dark-text mb-1">
                            {agent.name}
                          </h3>
                          <p className="text-sm font-mono text-light-text-secondary dark:text-dark-text-secondary">
                            {agent.code}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig[agent.status].bg} ${statusConfig[agent.status].color}`}>
                          {statusConfig[agent.status].label}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-lime-accent" />
                          <span className="text-light-text dark:text-dark-text">{agent.country} - {agent.city}</span>
                        </div>
                        {agent.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-lime-accent" />
                            <span className="text-light-text dark:text-dark-text" dir="ltr">{agent.phone}</span>
                          </div>
                        )}
                        {agent.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-lime-accent" />
                            <span className="text-light-text dark:text-dark-text">{agent.email}</span>
                          </div>
                        )}
                        {agent.commission_rate && (
                          <div className="flex items-center gap-2 text-sm">
                            <Star className="w-4 h-4 text-lime-accent" />
                            <span className="text-light-text dark:text-dark-text">عمولة: {agent.commission_rate}%</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-4 border-t border-light-border dark:border-dark-border">
                        <button
                          onClick={() => setEditingAgent(agent.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDeleteAgent(agent.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          حذف
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              {filteredAgents.length > 0 && (
                <div className="p-6 border-t border-light-border dark:border-dark-border">
                  <button
                    onClick={() => setShowAddAgentModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-lime-accent hover:opacity-90 text-dark-text rounded-xl font-medium transition-opacity"
                  >
                    <Plus className="w-5 h-5" />
                    إضافة وكيل جديد
                  </button>
                </div>
              )}
            </>
          ) : currentLoading ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 border-4 border-lime-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-light-text-secondary dark:text-dark-text-secondary">جاري التحميل...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-light-text-secondary dark:text-dark-text-secondary">
                لا توجد طلبات
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-light-base dark:bg-dark-base">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">
                      معرف الطلب
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">
                      معرف المستخدم
                    </th>
                    {(activeTab === 'topups' || activeTab === 'agent-transactions') && (
                      <th className="px-6 py-4 text-right text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">
                        المبلغ
                      </th>
                    )}
                    {activeTab === 'agent-transactions' && (
                      <th className="px-6 py-4 text-right text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">
                        الوكيل
                      </th>
                    )}
                    <th className="px-6 py-4 text-right text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">
                      تاريخ التقديم
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">
                      الحالة
                    </th>
                    {activeTab === 'agent-transactions' && (
                      <th className="px-6 py-4 text-right text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">
                        سبب الإلغاء
                      </th>
                    )}
                    <th className="px-6 py-4 text-right text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">
                      إجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-border dark:divide-dark-border">
                  {filteredSubmissions.map((submission: any) => {
                    const config = statusConfig[submission.status] || {
                      label: submission.status || 'غير معروف',
                      color: 'text-gray-600 dark:text-gray-400',
                      bg: 'bg-gray-100 dark:bg-gray-900/30'
                    };
                    return (
                      <tr key={submission.id} className="hover:bg-light-base dark:hover:bg-dark-base transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono text-light-text dark:text-dark-text">
                            {submission.id.substring(0, 8)}...
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono text-light-text dark:text-dark-text">
                            {(submission.user_id || submission.userId || '').substring(0, 12)}...
                          </span>
                        </td>
                        {(activeTab === 'topups' || activeTab === 'agent-transactions') && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold text-light-text dark:text-dark-text">
                              {submission.amount?.toLocaleString()} {submission.currency}
                            </span>
                          </td>
                        )}
                        {activeTab === 'agent-transactions' && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-light-text dark:text-dark-text">
                              <div className="font-medium">{submission.agent_name || 'N/A'}</div>
                              {submission.agent_phone && (
                                <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                  {submission.agent_phone}
                                </div>
                              )}
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                            {activeTab === 'kyc'
                              ? new Date(submission.submission_date).toLocaleDateString('ar-SA', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })
                              : activeTab === 'agent-transactions'
                              ? submission.created_at?.toDate ? submission.created_at.toDate().toLocaleDateString('ar-SA', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                }) : 'N/A'
                              : submission.createdAt?.toDate().toLocaleDateString('ar-SA', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                            {config.label}
                          </span>
                        </td>
                        {activeTab === 'agent-transactions' && (
                          <td className="px-6 py-4">
                            <span className="text-sm text-light-text dark:text-dark-text">
                              {submission.rejection_reason || (submission.status === 'cancelled' || submission.status === 'failed' ? 'لا يوجد سبب مسجل' : '-')}
                            </span>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {activeTab === 'agent-transactions' ? (
                            <div className="flex gap-2">
                              {submission.status === 'pending' && (
                                <>
                                  <button
                                    onClick={async () => {
                                      if (user.email) {
                                        await updateAgentTransactionStatus(submission.id, 'completed', user.email);
                                      }
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    موافقة
                                  </button>
                                  <button
                                    onClick={() => setCancellingTransactionId(submission.id)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    إلغاء
                                  </button>
                                </>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                if (activeTab === 'kyc') {
                                  setSelectedKYCSubmission(submission.id);
                                } else {
                                  setSelectedTopUpSubmission(submission.id);
                                }
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-lime-accent hover:opacity-90 text-dark-text rounded-lg text-sm font-medium transition-opacity"
                            >
                              <Eye className="w-4 h-4" />
                              مراجعة
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
          </>
        )}
      </main>

      {selectedKYCSubmission && (
        <KYCReviewModal
          submissionId={selectedKYCSubmission}
          onClose={() => setSelectedKYCSubmission(null)}
          onUpdate={updateKYCStatus}
          adminId={user.uid}
        />
      )}

      {selectedTopUpSubmission && (
        <TopUpReviewModal
          submission={topUpSubmissions.find(s => s.id === selectedTopUpSubmission) || null}
          onClose={() => setSelectedTopUpSubmission(null)}
          onApprove={handleApproveTopUp}
          onReject={handleRejectTopUp}
        />
      )}

      {showAddAgentModal && (
        <AddAgentModal
          onClose={() => setShowAddAgentModal(false)}
        />
      )}

      {editingAgent && (
        <EditAgentModal
          agentId={editingAgent}
          onClose={() => setEditingAgent(null)}
        />
      )}

      {/* Cancellation Reason Modal */}
      {cancellingTransactionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-light-surface dark:bg-dark-surface rounded-2xl shadow-2xl max-w-md w-full p-6 border border-light-border dark:border-dark-border"
          >
            <h3 className="text-xl font-bold text-light-text dark:text-dark-text mb-4">
              سبب إلغاء المعاملة
            </h3>
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="الرجاء إدخال سبب الإلغاء..."
              className="w-full bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:border-lime-accent/50 transition-colors duration-300 resize-none"
              rows={4}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleCancelTransaction}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                تأكيد الإلغاء
              </button>
              <button
                onClick={() => {
                  setCancellingTransactionId(null);
                  setCancellationReason('');
                }}
                className="flex-1 bg-light-glass dark:bg-dark-glass border border-light-border dark:border-dark-border text-light-text dark:text-dark-text px-6 py-3 rounded-xl font-medium hover:bg-light-border dark:hover:bg-dark-border transition-colors"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
