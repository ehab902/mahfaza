import { useEffect, useRef } from 'react';
import { useKYCSubmission, KYCSubmission } from './useKYCSubmission';
import { useToast } from '../contexts/ToastContext';

export function useKYCStatusMonitor() {
  const { submission, loading } = useKYCSubmission();
  const toast = useToast();
  const previousStatusRef = useRef<string | null>(null);
  const hasShownInitialRef = useRef(false);

  useEffect(() => {
    if (loading || !submission) {
      return;
    }

    if (!hasShownInitialRef.current) {
      hasShownInitialRef.current = true;
      previousStatusRef.current = submission.status;
      return;
    }

    const previousStatus = previousStatusRef.current;
    const currentStatus = submission.status;

    if (previousStatus && previousStatus !== currentStatus) {
      switch (currentStatus) {
        case 'under_review':
          toast.info(
            'طلبك قيد المراجعة',
            'فريقنا يقوم الآن بمراجعة مستنداتك. سنرسل لك إشعاراً عند الانتهاء.',
            6000
          );
          break;

        case 'approved':
          toast.success(
            'مبروك! تم قبول طلبك',
            'تم التحقق من هويتك بنجاح. يمكنك الآن الوصول لجميع ميزات المنصة.',
            8000
          );
          break;

        case 'rejected':
          const reason = submission.rejection_reason || 'لم يتم تقديم سبب محدد';
          toast.error(
            'تم رفض طلب التحقق',
            `السبب: ${reason}. يرجى مراجعة سبب الرفض وإعادة التقديم.`,
            10000
          );
          break;

        case 'pending':
          if (previousStatus === 'rejected') {
            toast.info(
              'تم استلام الطلب الجديد',
              'شكراً لإعادة التقديم. سنراجع مستنداتك خلال 24-48 ساعة.',
              6000
            );
          }
          break;
      }

      previousStatusRef.current = currentStatus;
    }
  }, [submission, loading, toast]);

  return { submission, loading };
}
