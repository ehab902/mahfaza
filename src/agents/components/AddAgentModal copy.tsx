import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Loader } from 'lucide-react';
import { useAgentsManagement, CreateAgentData } from '../hooks/useAgentsManagement';

interface AddAgentModalProps {
  onClose: () => void;
}

export function AddAgentModal({ onClose }: AddAgentModalProps) {
  const { addAgent } = useAgentsManagement();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateAgentData>({
    name: '',
    code: '',
    country: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    working_hours: '',
    status: 'active',
    commission_rate: 2.5,
    max_transaction_amount: 10000,
    min_transaction_amount: 10,
    supported_currencies: ['USD', 'EUR']
  });

  const currencies = ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'JOD', 'KWD'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleCurrencyChange = (currency: string) => {
    setFormData(prev => {
      const currencies = prev.supported_currencies || [];
      if (currencies.includes(currency)) {
        return {
          ...prev,
          supported_currencies: currencies.filter(c => c !== currency)
        };
      } else {
        return {
          ...prev,
          supported_currencies: [...currencies, currency]
        };
      }
    });
  };

  const generateCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    setFormData(prev => ({ ...prev, code: `AG${timestamp}${random}` }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.name || !formData.code || !formData.country || !formData.city) {
        throw new Error('يرجى ملء جميع الحقول المطلوبة');
      }

      if (formData.supported_currencies.length === 0) {
        throw new Error('يرجى اختيار عملة واحدة على الأقل');
      }

      const result = await addAgent(formData);

      if (result) {
        onClose();
      } else {
        throw new Error('فشل في إضافة الوكيل');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إضافة الوكيل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-light-surface dark:bg-dark-surface rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-light-surface dark:bg-dark-surface border-b border-light-border dark:border-dark-border p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-light-text dark:text-dark-text">
            إضافة وكيل جديد
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-light-base dark:hover:bg-dark-base rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                اسم الوكيل <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent"
                placeholder="أدخل اسم الوكيل"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                كود الوكيل <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  required
                  className="flex-1 px-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent font-mono"
                  placeholder="AG123456ABCD"
                />
                <button
                  type="button"
                  onClick={generateCode}
                  className="px-4 py-3 bg-lime-accent hover:opacity-90 text-dark-text rounded-xl font-medium transition-opacity"
                >
                  توليد
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                الدولة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent"
                placeholder="مثال: السعودية"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                المدينة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent"
                placeholder="مثال: الرياض"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                العنوان <span className="text-red-500">*</span>
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                rows={2}
                className="w-full px-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent resize-none"
                placeholder="أدخل العنوان الكامل"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                رقم الهاتف <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent"
                placeholder="+966 XX XXX XXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent"
                placeholder="agent@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                ساعات العمل <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="working_hours"
                value={formData.working_hours}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent"
                placeholder="مثال: 9:00 ص - 9:00 م"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                الحالة
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent"
              >
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
                <option value="suspended">معلق</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                نسبة العمولة (%)
              </label>
              <input
                type="number"
                name="commission_rate"
                value={formData.commission_rate}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
                className="w-full px-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                الحد الأدنى للمعاملة
              </label>
              <input
                type="number"
                name="min_transaction_amount"
                value={formData.min_transaction_amount}
                onChange={handleChange}
                min="0"
                step="1"
                className="w-full px-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                الحد الأقصى للمعاملة
              </label>
              <input
                type="number"
                name="max_transaction_amount"
                value={formData.max_transaction_amount}
                onChange={handleChange}
                min="0"
                step="1"
                className="w-full px-4 py-3 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-xl text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-lime-accent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                العملات المدعومة <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {currencies.map((currency) => (
                  <label
                    key={currency}
                    className="flex items-center gap-2 px-4 py-2 bg-light-base dark:bg-dark-base border border-light-border dark:border-dark-border rounded-lg cursor-pointer hover:border-lime-accent transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.supported_currencies?.includes(currency)}
                      onChange={() => handleCurrencyChange(currency)}
                      className="w-4 h-4 text-lime-accent focus:ring-lime-accent rounded"
                    />
                    <span className="text-sm text-light-text dark:text-dark-text">{currency}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-light-border dark:border-dark-border">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-light-base dark:bg-dark-base text-light-text dark:text-dark-text rounded-xl font-medium hover:opacity-80 transition-opacity"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-lime-accent to-lime-500 text-dark-text rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  حفظ الوكيل
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
