import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Zap, Globe, TrendingUp, CreditCard, BarChart3, Lock } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

export function LandingApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('LandingApp - Auth State:', user);
      setIsAuthenticated(!!user);
      setIsLoading(false);
      
      // إذا كان المستخدم مسجلاً، انقله مباشرة للتطبيق
      if (user) {
        console.log('User is authenticated, redirecting to app...');
        window.location.href = '/app.html';
      }
    });

    return () => unsubscribe();
  }, []);

  // إذا كان يتحقق من المصادقة، اعرض تحميل
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg z-50 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                TradeHub
              </span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/app.html"
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all"
              >
                تسجيل الدخول
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                منصة التمويل التجاري
                <span className="block bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  الذكية والآمنة
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                حلول مصرفية رقمية متكاملة للتجار والشركات مع خدمات تحويل الأموال، الحسابات المصرفية، والبطاقات الافتراضية
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="/app.html"
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/50 transition-all flex items-center gap-2 group"
                >
                  ابدأ الآن
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </a>
                <button className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-semibold hover:shadow-lg border-2 border-gray-200 dark:border-gray-700 transition-all">
                  اكتشف المزيد
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-gradient-to-br from-blue-600 to-cyan-500 rounded-3xl p-8 shadow-2xl">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between text-white">
                    <div>
                      <p className="text-sm opacity-80">الرصيد المتاح</p>
                      <p className="text-3xl font-bold">$125,430.50</p>
                    </div>
                    <CreditCard className="w-12 h-12 opacity-60" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="bg-white/10 rounded-xl p-4">
                      <p className="text-white/70 text-sm mb-1">المعاملات اليوم</p>
                      <p className="text-white text-xl font-bold">+$12,430</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4">
                      <p className="text-white/70 text-sm mb-1">معاملات نشطة</p>
                      <p className="text-white text-xl font-bold">24</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl opacity-20 blur-xl"
              />
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl opacity-20 blur-xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              لماذا TradeHub؟
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              منصة متكاملة بميزات استثنائية لإدارة أعمالك المالية
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'أمان متقدم',
                description: 'حماية متعددة المستويات مع تشفير من الدرجة المصرفية وحماية بياناتك'
              },
              {
                icon: Zap,
                title: 'تحويلات فورية',
                description: 'حول الأموال محلياً ودولياً بسرعة وبأقل الرسوم'
              },
              {
                icon: CreditCard,
                title: 'بطاقات افتراضية',
                description: 'أنشئ بطاقات افتراضية للدفع الآمن عبر الإنترنت'
              },
              {
                icon: BarChart3,
                title: 'تقارير تفصيلية',
                description: 'تتبع معاملاتك وحلل أداءك المالي بسهولة'
              },
              {
                icon: Globe,
                title: 'معاملات دولية',
                description: 'ادعم أكثر من 50 عملة مع أسعار صرف تنافسية'
              },
              {
                icon: Lock,
                title: 'KYC معتمد',
                description: 'نظام تحقق من الهوية معتمد وآمن وسريع'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-cyan-500">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { number: '50K+', label: 'مستخدم نشط' },
              { number: '$2B+', label: 'حجم المعاملات' },
              { number: '150+', label: 'دولة مدعومة' },
              { number: '99.9%', label: 'وقت التشغيل' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-white"
              >
                <p className="text-5xl font-bold mb-2">{stat.number}</p>
                <p className="text-xl text-white/90">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-gray-900 to-blue-900 dark:from-blue-900 dark:to-gray-900 rounded-3xl p-12 shadow-2xl"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              جاهز لبدء رحلتك المالية؟
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              انضم لآلاف التجار الذين يثقون في TradeHub لإدارة أعمالهم المالية
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/app.html"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/50 transition-all flex items-center gap-2 group"
              >
                افتح حسابك الآن
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">TradeHub</span>
              </div>
              <p className="text-sm">
                منصة التمويل التجاري الذكية والآمنة
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">المنتجات</h4>
              <ul className="space-y-2 text-sm">
                <li>الحسابات المصرفية</li>
                <li>البطاقات الافتراضية</li>
                <li>التحويلات الدولية</li>
                <li>تمويل التجارة</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">الشركة</h4>
              <ul className="space-y-2 text-sm">
                <li>من نحن</li>
                <li>اتصل بنا</li>
                <li>الوظائف</li>
                <li>الأخبار</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">الدعم</h4>
              <ul className="space-y-2 text-sm">
                <li>مركز المساعدة</li>
                <li>سياسة الخصوصية</li>
                <li>الشروط والأحكام</li>
                <li>الأمان</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2024 TradeHub. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}