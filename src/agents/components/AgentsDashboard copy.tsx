import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LogOut,
  Users,
  UserCheck,
  UserX,
  UserMinus,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Moon,
  Sun,
  MapPin,
  Phone,
  Mail,
  Clock,
  DollarSign,
  Star
} from 'lucide-react';
import { User } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAgentsManagement } from '../hooks/useAgentsManagement';
import { AddAgentModal } from './AddAgentModal';
import { EditAgentModal } from './EditAgentModal';
import { useTheme } from '../../contexts/ThemeContext';
import { logAdminAccess } from '../../admin/hooks/useAdminCheck';

interface AgentsDashboardProps {
  user: User;
}

export function AgentsDashboard({ user }: AgentsDashboardProps) {
  const { agents, loading, deleteAgent, changeAgentStatus } = useAgentsManagement();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [deletingAgent, setDeletingAgent] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      if (user.email) {
        await logAdminAccess(user.email, 'logout', 'User logged out from agents panel');
      }
      await auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleDeleteAgent = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الوكيل؟')) {
      const success = await deleteAgent(id);
      if (success) {
        setDeletingAgent(null);
      }
    }
  };

  const handleStatusChange = async (id: string, status: 'active' | 'inactive' | 'suspended') => {
    await changeAgentStatus(id, status);
  };

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

  const stats = {
    total: agents.length,
    active: agents.filter(a => a.status === 'active').length,
    inactive: agents.filter(a => a.status === 'inactive').length,
    suspended: agents.filter(a => a.status === 'suspended').length
  };

  const statCards = [
    {
      title: 'إجمالي الوكلاء',
      value: stats.total,
      icon: Users,
      color: 'blue',
      bgGradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'نشط',
      value: stats.active,
      icon: UserCheck,
      color: 'green',
      bgGradient: 'from-green-500 to-emerald-500'
    },
    {
      title: 'غير نشط',
      value: stats.inactive,
      icon: UserX,
      color: 'amber',
      bgGradient: 'from-amber-500 to-orange-500'
    },
    {
      title: 'معلق',
      value: stats.suspended,
      icon: UserMinus,
      color: 'red',
      bgGradient: 'from-red-500 to-rose-500'
    }
  ];

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: 'نشط', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
    inactive: { label: 'غير نشط', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    suspended: { label: 'معلق', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' }
  };

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
                إدارة الوكلاء
              </h1>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                مرحباً، {user.email}
              </p>
            </div>
            <div className="flex items-center gap-3">
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
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث بالاسم أو الكود أو المدينة..."
                  className="w-full pr-11 pl-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent transition-all"
                />
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary pointer-events-none" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full sm:w-auto pr-11 pl-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">جميع الحالات</option>
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                    <option value="suspended">معلق</option>
                  </select>
                </div>
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
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-lime-accent to-lime-500 text-dark-text rounded-xl font-bold hover:opacity-90 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              إضافة وكيل جديد
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 border-4 border-lime-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-light-text-secondary dark:text-dark-text-secondary">جاري التحميل...</p>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-light-text-secondary dark:text-dark-text-secondary mx-auto mb-4 opacity-50" />
              <p className="text-light-text-secondary dark:text-dark-text-secondary">
                لا توجد وكلاء
              </p>
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
                      الكود
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">
                      الموقع
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">
                      التواصل
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">
                      العمولة
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">
                      إجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-border dark:divide-dark-border">
                  {filteredAgents.map((agent) => {
                    const config = statusConfig[agent.status];
                    return (
                      <tr key={agent.id} className="hover:bg-light-base dark:hover:bg-dark-base transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-lime-accent to-lime-500 rounded-full flex items-center justify-center">
                              <span className="text-dark-text font-bold">
                                {agent.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-light-text dark:text-dark-text">
                                {agent.name}
                              </p>
                              <div className="flex items-center gap-1 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                <Star className="w-3 h-3 fill-current text-amber-500" />
                                <span>{agent.rating.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono text-light-text dark:text-dark-text">
                            {agent.code}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                              <p className="text-light-text dark:text-dark-text">{agent.city}</p>
                              <p className="text-light-text-secondary dark:text-dark-text-secondary">{agent.country}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2 text-light-text-secondary dark:text-dark-text-secondary">
                              <Phone className="w-3 h-3" />
                              <span className="font-mono">{agent.phone}</span>
                            </div>
                            {agent.email && (
                              <div className="flex items-center gap-2 text-light-text-secondary dark:text-dark-text-secondary">
                                <Mail className="w-3 h-3" />
                                <span className="text-xs">{agent.email}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm text-light-text dark:text-dark-text">
                            <DollarSign className="w-4 h-4" />
                            <span>{agent.commission_rate}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={agent.status}
                            onChange={(e) => handleStatusChange(agent.id, e.target.value as any)}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color} border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-lime-accent`}
                          >
                            <option value="active">نشط</option>
                            <option value="inactive">غير نشط</option>
                            <option value="suspended">معلق</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingAgent(agent.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="تعديل"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAgent(agent.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showAddModal && (
        <AddAgentModal onClose={() => setShowAddModal(false)} />
      )}

      {editingAgent && (
        <EditAgentModal
          agentId={editingAgent}
          onClose={() => setEditingAgent(null)}
        />
      )}
    </div>
  );
}
