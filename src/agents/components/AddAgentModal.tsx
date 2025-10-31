import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, RefreshCw } from 'lucide-react';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { AvatarUpload } from '../../components/AvatarUpload';
import { uploadAgentAvatar } from '../../utils/imageUpload';

interface AddAgentModalProps {
  onClose: () => void;
}

export function AddAgentModal({ onClose }: AddAgentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    country: '',
    city: '',
    phone: '',
    commission_rate: '',
    max_transaction_amount: '',
    total_transactions: '0',
    status: 'active' as 'active' | 'inactive' | 'suspended'
  });
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string>('');

  const generateCode = () => {
    const prefix = formData.country.slice(0, 2).toUpperCase() || 'AG';
    const random = Math.floor(1000 + Math.random() * 9000);
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}${random}${timestamp}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setAvatarError('');

    try {
      let avatarUrl = '';

      if (avatarFile) {
        setUploadingAvatar(true);
        const uploadResult = await uploadAgentAvatar(avatarFile, formData.code || 'temp');
        setUploadingAvatar(false);

        if (!uploadResult.success) {
          setAvatarError(uploadResult.error || 'فشل رفع الصورة');
          setSaving(false);
          return;
        }

        avatarUrl = uploadResult.url || '';
      }

      await addDoc(collection(db, 'agents'), {
        ...formData,
        avatar_url: avatarUrl,
        commission_rate: formData.commission_rate ? parseFloat(formData.commission_rate) : 0,
        max_transaction_amount: formData.max_transaction_amount ? parseFloat(formData.max_transaction_amount) : 0,
        total_transactions: formData.total_transactions ? parseInt(formData.total_transactions) : 0,
        rating: 5.0,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      });
      onClose();
    } catch (error) {
      console.error('Error adding agent:', error);
      alert('فشل في إضافة الوكيل');
    } finally {
      setSaving(false);
      setUploadingAvatar(false);
    }
  };

  const handleImageSelect = (file: File) => {
    setAvatarFile(file);
    setAvatarError('');
  };

  const handleImageRemove = () => {
    setAvatarFile(null);
    setAvatarError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-light-surface dark:bg-dark-surface rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-light-border dark:border-dark-border"
      >
        <div className="sticky top-0 bg-light-surface dark:bg-dark-surface border-b border-light-border dark:border-dark-border p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-light-text dark:text-dark-text">
            إضافة وكيل جديد
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-light-base dark:hover:bg-dark-base rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex justify-center mb-6">
            <AvatarUpload
              onImageSelect={handleImageSelect}
              onImageRemove={handleImageRemove}
              uploading={uploadingAvatar}
              agentName={formData.name}
            />
          </div>

          {avatarError && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl text-red-700 dark:text-red-300 text-sm text-center">
              {avatarError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                الاسم *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                الكود *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="flex-1 px-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, code: generateCode() })}
                  className="px-4 py-3 bg-lime-accent/10 hover:bg-lime-accent/20 border border-lime-accent/50 text-lime-accent rounded-xl transition-colors flex items-center gap-2"
                  title="توليد كود تلقائي"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                الدولة *
              </label>
              <input
                type="text"
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                المدينة *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                الهاتف
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                الحد الأقصى للمعاملة
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.max_transaction_amount}
                onChange={(e) => setFormData({ ...formData, max_transaction_amount: e.target.value })}
                className="w-full px-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent"
                placeholder="مثال: 10000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                عدد المعاملات
              </label>
              <input
                type="number"
                value={formData.total_transactions}
                onChange={(e) => setFormData({ ...formData, total_transactions: e.target.value })}
                className="w-full px-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                نسبة العمولة (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.commission_rate}
                onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                className="w-full px-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                الحالة
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent"
              >
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
                <option value="suspended">موقوف</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-lime-accent hover:opacity-90 disabled:opacity-50 text-dark-text rounded-xl font-medium transition-opacity"
            >
              <Save className="w-5 h-5" />
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border text-light-text dark:text-dark-text rounded-xl font-medium transition-colors hover:bg-light-border dark:hover:bg-dark-border"
            >
              إلغاء
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
