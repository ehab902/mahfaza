import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, FileText, CheckCircle, AlertCircle, X, Eye } from 'lucide-react';
import { auth } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { useKYCSubmission } from '../hooks/useKYCSubmission';
import { useToast } from '../contexts/ToastContext';

interface KYCUploadProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

type UploadStep = 'id_type_selection' | 'national_id_front' | 'national_id_back' | 'passport' | 'selfie' | 'review';
type IDType = 'national_id' | 'passport' | null;

export function KYCUpload({ onSuccess, onCancel }: KYCUploadProps) {
  const [currentStep, setCurrentStep] = useState<UploadStep>('id_type_selection');
  const [selectedIDType, setSelectedIDType] = useState<IDType>(null);
  const [nationalIdFrontFile, setNationalIdFrontFile] = useState<File | null>(null);
  const [nationalIdBackFile, setNationalIdBackFile] = useState<File | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [previewUrls, setPreviewUrls] = useState<{
    national_id_front?: string;
    national_id_back?: string;
    passport?: string;
    selfie?: string;
  }>({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const nationalIdFrontInputRef = useRef<HTMLInputElement>(null);
  const nationalIdBackInputRef = useRef<HTMLInputElement>(null);
  const passportInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const { createSubmission, updateSubmission, submission } = useKYCSubmission();
  const toast = useToast();

  const getSteps = () => {
    const baseSteps = [{ id: 'id_type_selection', title: 'اختر الوثيقة', icon: FileText }];

    if (selectedIDType === 'national_id') {
      return [
        ...baseSteps,
        { id: 'national_id_front', title: 'الوجه الأمامي', icon: FileText },
        { id: 'national_id_back', title: 'الوجه الخلفي', icon: FileText },
        { id: 'selfie', title: 'صورة شخصية', icon: Camera },
        { id: 'review', title: 'المراجعة', icon: CheckCircle }
      ];
    } else if (selectedIDType === 'passport') {
      return [
        ...baseSteps,
        { id: 'passport', title: 'جواز السفر', icon: FileText },
        { id: 'selfie', title: 'صورة شخصية', icon: Camera },
        { id: 'review', title: 'المراجعة', icon: CheckCircle }
      ];
    }

    return baseSteps;
  };

  const steps = getSteps();

  const handleFileSelect = (file: File, type: 'national_id_front' | 'national_id_back' | 'passport' | 'selfie') => {
    if (file.size > 5 * 1024 * 1024) {
      setError('حجم الملف يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار صورة صالحة');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrls(prev => ({ ...prev, [type]: reader.result as string }));
    };
    reader.readAsDataURL(file);

    switch (type) {
      case 'national_id_front':
        setNationalIdFrontFile(file);
        break;
      case 'national_id_back':
        setNationalIdBackFile(file);
        break;
      case 'passport':
        setPassportFile(file);
        break;
      case 'selfie':
        setSelfieFile(file);
        break;
    }

    setError(null);
  };

  const uploadToStorage = async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `kyc-documents/${path}/${fileName}`;

    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  };

  const handleSubmit = async () => {
    try {
      setUploading(true);
      setError(null);

      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      if (selectedIDType === 'national_id') {
        if (!nationalIdFrontFile || !nationalIdBackFile || !selfieFile) {
          throw new Error('يرجى رفع جميع المستندات المطلوبة');
        }
      } else if (selectedIDType === 'passport') {
        if (!passportFile || !selfieFile) {
          throw new Error('يرجى رفع جميع المستندات المطلوبة');
        }
      } else {
        throw new Error('يرجى اختيار نوع الوثيقة');
      }

      toast.info('جاري رفع المستندات', 'يرجى الانتظار...');

      let nationalIdUrl = '';
      let passportUrl = '';
      const selfieUrl = await uploadToStorage(selfieFile!, `${user.uid}/selfie`);

      if (selectedIDType === 'national_id') {
        const [frontUrl, backUrl] = await Promise.all([
          uploadToStorage(nationalIdFrontFile!, `${user.uid}/national_id_front`),
          uploadToStorage(nationalIdBackFile!, `${user.uid}/national_id_back`)
        ]);
        nationalIdUrl = `${frontUrl}|${backUrl}`;
      } else if (selectedIDType === 'passport') {
        passportUrl = await uploadToStorage(passportFile!, `${user.uid}/passport`);
      }

      if (submission && submission.status === 'rejected') {
        await updateSubmission(nationalIdUrl, passportUrl, selfieUrl);
        toast.success(
          'تم إعادة إرسال المستندات بنجاح!',
          'طلبك الآن في قائمة الانتظار. سيتم مراجعته خلال 24-48 ساعة.',
          7000
        );
      } else {
        await createSubmission(nationalIdUrl, passportUrl, selfieUrl);
        toast.success(
          'تم رفع المستندات بنجاح!',
          'طلب التحقق من الهوية في قائمة الانتظار. سنراجعه خلال 24-48 ساعة وسنرسل لك إشعاراً عند الانتهاء.',
          7000
        );
      }

      setUploadSuccess(true);

      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      console.error('Error submitting KYC:', err);
      const errorMessage = err.message || 'حدث خطأ أثناء رفع المستندات';
      setError(errorMessage);
      toast.error('فشل رفع المستندات', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 'id_type_selection') {
      if (selectedIDType === 'national_id') {
        setCurrentStep('national_id_front');
      } else if (selectedIDType === 'passport') {
        setCurrentStep('passport');
      }
    } else {
      const currentSteps = steps.map(s => s.id as UploadStep);
      const currentIndex = currentSteps.indexOf(currentStep);
      if (currentIndex < currentSteps.length - 1) {
        setCurrentStep(currentSteps[currentIndex + 1]);
      }
    }
  };

  const handleBack = () => {
    const currentSteps = steps.map(s => s.id as UploadStep);
    const currentIndex = currentSteps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(currentSteps[currentIndex - 1]);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'id_type_selection':
        return selectedIDType !== null;
      case 'national_id_front':
        return nationalIdFrontFile !== null;
      case 'national_id_back':
        return nationalIdBackFile !== null;
      case 'passport':
        return passportFile !== null;
      case 'selfie':
        return selfieFile !== null;
      case 'review':
        if (selectedIDType === 'national_id') {
          return nationalIdFrontFile && nationalIdBackFile && selfieFile;
        } else if (selectedIDType === 'passport') {
          return passportFile && selfieFile;
        }
        return false;
      default:
        return false;
    }
  };

  const renderUploadSection = (
    type: 'national_id_front' | 'national_id_back' | 'passport' | 'selfie',
    title: string,
    description: string,
    icon: React.ElementType,
    inputRef: React.RefObject<HTMLInputElement>
  ) => {
    const file = type === 'national_id_front' ? nationalIdFrontFile :
                 type === 'national_id_back' ? nationalIdBackFile :
                 type === 'passport' ? passportFile : selfieFile;
    const previewUrl = previewUrls[type];
    const Icon = icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-lime-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon className="w-10 h-10 text-lime-accent" />
          </div>
          <h3 className="text-2xl font-bold text-light-text dark:text-dark-text">{title}</h3>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">{description}</p>
        </div>

        {previewUrl ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt={title}
              className="w-full h-64 object-cover rounded-2xl border-2 border-lime-accent/20"
            />
            <button
              onClick={() => {
                if (type === 'national_id_front') setNationalIdFrontFile(null);
                if (type === 'national_id_back') setNationalIdBackFile(null);
                if (type === 'passport') setPassportFile(null);
                if (type === 'selfie') setSelfieFile(null);
                setPreviewUrls(prev => ({ ...prev, [type]: undefined }));
              }}
              className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-light-border dark:border-dark-border rounded-2xl p-12 text-center cursor-pointer hover:border-lime-accent transition-colors"
          >
            <Upload className="w-12 h-12 text-light-text-secondary dark:text-dark-text-secondary mx-auto mb-4" />
            <p className="text-light-text dark:text-dark-text font-medium mb-2">
              انقر لرفع الصورة
            </p>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              PNG, JPG حتى 5MB
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file, type);
          }}
          className="hidden"
        />

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            متطلبات الصورة:
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• الصورة واضحة وغير مشوشة</li>
            <li>• جميع البيانات والنصوص قابلة للقراءة</li>
            <li>• الوثيقة سارية المفعول</li>
            <li>• حجم الملف أقل من 5 ميجابايت</li>
          </ul>
        </div>
      </motion.div>
    );
  };

  const renderIDTypeSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <div className="w-20 h-20 bg-lime-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-10 h-10 text-lime-accent" />
        </div>
        <h3 className="text-2xl font-bold text-light-text dark:text-dark-text">اختر نوع الوثيقة</h3>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          يرجى اختيار نوع الوثيقة التي ترغب في التحقق بها
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setSelectedIDType('national_id')}
          className={`p-6 rounded-2xl border-2 transition-all ${
            selectedIDType === 'national_id'
              ? 'border-lime-accent bg-lime-accent/10'
              : 'border-light-border dark:border-dark-border hover:border-lime-accent/50'
          }`}
        >
          <FileText className={`w-12 h-12 mx-auto mb-4 ${
            selectedIDType === 'national_id' ? 'text-lime-accent' : 'text-light-text-secondary dark:text-dark-text-secondary'
          }`} />
          <h4 className="text-xl font-bold text-light-text dark:text-dark-text mb-2">
            الهوية الوطنية
          </h4>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            صورتين: الوجه الأمامي والخلفي
          </p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setSelectedIDType('passport')}
          className={`p-6 rounded-2xl border-2 transition-all ${
            selectedIDType === 'passport'
              ? 'border-lime-accent bg-lime-accent/10'
              : 'border-light-border dark:border-dark-border hover:border-lime-accent/50'
          }`}
        >
          <FileText className={`w-12 h-12 mx-auto mb-4 ${
            selectedIDType === 'passport' ? 'text-lime-accent' : 'text-light-text-secondary dark:text-dark-text-secondary'
          }`} />
          <h4 className="text-xl font-bold text-light-text dark:text-dark-text mb-2">
            جواز السفر
          </h4>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            صورة واحدة فقط
          </p>
        </motion.button>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>ملاحظة:</strong> يمكنك اختيار إحدى الوثيقتين للتحقق من هويتك
        </p>
      </div>
    </motion.div>
  );

  const renderReview = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <div className="w-20 h-20 bg-lime-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Eye className="w-10 h-10 text-lime-accent" />
        </div>
        <h3 className="text-2xl font-bold text-light-text dark:text-dark-text">مراجعة المستندات</h3>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          تأكد من صحة جميع المستندات قبل الإرسال
        </p>
      </div>

      <div className="grid gap-4">
        {selectedIDType === 'national_id' && (
          <>
            {previewUrls.national_id_front && (
              <div className="space-y-2">
                <h4 className="font-semibold text-light-text dark:text-dark-text">الهوية الوطنية - الوجه الأمامي</h4>
                <img
                  src={previewUrls.national_id_front}
                  alt="National ID Front"
                  className="w-full h-48 object-cover rounded-xl border border-light-border dark:border-dark-border"
                />
              </div>
            )}
            {previewUrls.national_id_back && (
              <div className="space-y-2">
                <h4 className="font-semibold text-light-text dark:text-dark-text">الهوية الوطنية - الوجه الخلفي</h4>
                <img
                  src={previewUrls.national_id_back}
                  alt="National ID Back"
                  className="w-full h-48 object-cover rounded-xl border border-light-border dark:border-dark-border"
                />
              </div>
            )}
          </>
        )}
        {selectedIDType === 'passport' && previewUrls.passport && (
          <div className="space-y-2">
            <h4 className="font-semibold text-light-text dark:text-dark-text">جواز السفر</h4>
            <img
              src={previewUrls.passport}
              alt="Passport"
              className="w-full h-48 object-cover rounded-xl border border-light-border dark:border-dark-border"
            />
          </div>
        )}
        {previewUrls.selfie && (
          <div className="space-y-2">
            <h4 className="font-semibold text-light-text dark:text-dark-text">الصورة الشخصية</h4>
            <img
              src={previewUrls.selfie}
              alt="Selfie"
              className="w-full h-48 object-cover rounded-xl border border-light-border dark:border-dark-border"
            />
          </div>
        )}
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
        <p className="text-sm text-amber-900 dark:text-amber-100">
          <strong>تنبيه:</strong> سيتم مراجعة المستندات خلال 24-48 ساعة. تأكد من صحة جميع البيانات قبل الإرسال.
        </p>
      </div>
    </motion.div>
  );

  if (uploadSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-light-surface dark:bg-dark-surface rounded-3xl shadow-2xl max-w-md w-full p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-16 h-16 text-green-500" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-light-text dark:text-dark-text mb-4"
          >
            تم بنجاح!
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-light-text-secondary dark:text-dark-text-secondary mb-2"
          >
            تم رفع مستنداتك بنجاح
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-6"
          >
            طلبك الآن <span className="font-bold text-blue-500">بانتظار المراجعة</span>
            <br />
            سنراجع مستنداتك خلال 24-48 ساعة
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex gap-2 justify-center"
          >
            <div className="w-2 h-2 bg-lime-accent rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-lime-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-lime-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-light-surface dark:bg-dark-surface rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-light-surface dark:bg-dark-surface border-b border-light-border dark:border-dark-border p-6 z-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-light-text dark:text-dark-text">
              التحقق من الهوية
            </h2>
            {onCancel && (
              <button
                onClick={onCancel}
                className="p-2 hover:bg-light-base dark:hover:bg-dark-base rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-light-text-secondary dark:text-dark-text-secondary" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = steps.findIndex(s => s.id === currentStep) > index;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-lime-accent text-dark-text'
                          : isCompleted
                          ? 'bg-lime-accent/20 text-lime-accent'
                          : 'bg-light-base dark:bg-dark-base text-light-text-secondary dark:text-dark-text-secondary'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary hidden sm:block">
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 transition-colors ${
                        isCompleted ? 'bg-lime-accent' : 'bg-light-border dark:bg-dark-border'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {currentStep === 'id_type_selection' && renderIDTypeSelection()}
            {currentStep === 'national_id_front' &&
              renderUploadSection(
                'national_id_front',
                'الهوية الوطنية - الوجه الأمامي',
                'يرجى رفع صورة واضحة للوجه الأمامي لبطاقة الهوية',
                FileText,
                nationalIdFrontInputRef
              )}
            {currentStep === 'national_id_back' &&
              renderUploadSection(
                'national_id_back',
                'الهوية الوطنية - الوجه الخلفي',
                'يرجى رفع صورة واضحة للوجه الخلفي لبطاقة الهوية',
                FileText,
                nationalIdBackInputRef
              )}
            {currentStep === 'passport' &&
              renderUploadSection(
                'passport',
                'جواز السفر',
                'يرجى رفع صورة واضحة لجواز السفر الخاص بك',
                FileText,
                passportInputRef
              )}
            {currentStep === 'selfie' &&
              renderUploadSection(
                'selfie',
                'صورة شخصية',
                'التقط صورة شخصية واضحة لوجهك للمقارنة مع الوثائق',
                Camera,
                selfieInputRef
              )}
            {currentStep === 'review' && renderReview()}
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </motion.div>
          )}

          <div className="flex gap-3 mt-6">
            {currentStep !== 'id_type_selection' && (
              <button
                onClick={handleBack}
                disabled={uploading}
                className="flex-1 px-6 py-3 bg-light-base dark:bg-dark-base text-light-text dark:text-dark-text rounded-xl font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                رجوع
              </button>
            )}
            {currentStep === 'review' ? (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || uploading}
                className="flex-1 px-6 py-3 bg-lime-accent text-dark-text rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'جاري الإرسال...' : 'إرسال الطلب'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 px-6 py-3 bg-lime-accent text-dark-text rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
