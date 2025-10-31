# KYC Verification System - Setup Guide

## Overview
نظام التحقق من الهوية (KYC) متكامل مع لوحة تحكم إدارية منفصلة لمراجعة طلبات المستخدمين.

## Features المنفذة

### For Users (للعملاء)
- ✅ رفع المستندات (الهوية الوطنية، جواز السفر، صورة شخصية)
- ✅ متابعة حالة الطلب (pending, under_review, approved, rejected)
- ✅ إشعارات تلقائية عند تغيير حالة الطلب
- ✅ إمكانية إعادة التقديم بعد الرفض
- ✅ حظر الميزات الحساسة حتى الموافقة (التحويلات، البطاقات، الشحن)
- ✅ شريط تنبيه واضح أعلى اللوحة للمستخدمين غير المحققين

### For Admins (للمسؤولين)
- ✅ لوحة تحكم إدارية منفصلة على `/admin.html`
- ✅ مراجعة جميع الطلبات مع الفلترة والبحث
- ✅ عرض الصور بجانب بعضها للمقارنة
- ✅ الموافقة/الرفض مع كتابة ملاحظات
- ✅ سجل تدقيق كامل (Audit Log)
- ✅ إحصائيات شاملة عن الطلبات

## Database Schema

### Firebase Firestore Collections:
1. **kyc_submissions** - طلبات التحقق
2. **admin_allowed_emails** - المسؤولين المصرح لهم
3. **admin_access_audit_log** - سجل التدقيق
4. **notifications** - الإشعارات

### Storage:
- **Firebase Storage** - تخزين آمن للوثائق في `kyc-documents/`
- ⚠️ **هام**: يجب إعداد Firebase Storage قبل الاستخدام (راجع FIREBASE_STORAGE_SETUP.md)

## How to Access Admin Panel

### 1. Local Development
```bash
npm run dev
```
ثم افتح: `http://localhost:5173/admin.html`

### 2. Production
بعد البناء والنشر، افتح: `https://your-domain.com/admin.html`

## Setting Up Admin Users

### Method 1: Firebase Console (الطريقة الموصى بها)
قم بإضافة بريد المسؤول في مجموعة `admin_allowed_emails`:

1. افتح Firebase Console
2. انتقل إلى Firestore Database
3. أنشئ مجموعة `admin_allowed_emails`
4. أضف مستند بمعرف = البريد الإلكتروني للمسؤول
5. أضف الحقول:
   - `active`: true
   - `added_date`: timestamp
   - `added_by`: "system"

### Method 2: Admin Panel UI
بعد تسجيل الدخول كمسؤول، استخدم واجهة إدارة المسؤولين لإضافة مسؤولين جدد.

للتفاصيل الكاملة، راجع `ADMIN_EMAIL_SETUP.md`

## Admin Roles
- **reviewer** - يمكنه مراجعة والموافقة/الرفض
- **supervisor** - مراجع مع صلاحيات إضافية
- **super_admin** - جميع الصلاحيات بما في ذلك إدارة المسؤولين

## User Flow

### For New Users:
1. التسجيل في التطبيق
2. التحقق من البريد الإلكتروني
3. التحقق من رقم الهاتف (اختياري)
4. الدخول للوحة التحكم - يرى شريط تنبيه للتحقق من الهوية
5. يمكن رؤية اللوحة لكن الميزات الحساسة محظورة
6. رفع مستندات KYC عبر النموذج
7. انتظار المراجعة (24-48 ساعة)
8. استلام إشعار بالموافقة/الرفض
9. الوصول الكامل بعد الموافقة

### For Admins:
1. تسجيل الدخول عبر `/admin.html`
2. مشاهدة لوحة التحكم مع الإحصائيات
3. فلترة الطلبات حسب الحالة
4. فتح طلب للمراجعة
5. مشاهدة جميع المستندات
6. الموافقة أو الرفض مع كتابة الملاحظات
7. يتلقى المستخدم إشعار تلقائي

## Security Features

### RLS Policies:
- ✅ المستخدمون يرون طلباتهم فقط
- ✅ المسؤولون يرون جميع الطلبات
- ✅ لا يمكن حذف الوثائق (audit trail)
- ✅ المستخدمون يرفعون للمجلد الخاص بهم فقط

### Storage Policies:
- ✅ Private bucket (ليس عام)
- ✅ حد أقصى 5MB للملف
- ✅ أنواع الملفات: صور فقط (JPEG, PNG, WebP)
- ✅ تنظيم حسب user_id

## Status Flow

```
pending → under_review → approved
                ↓
            rejected → (can resubmit)
```

## Notifications

### Auto-sent notifications:
- ✅ عند استلام الطلب (submission_received)
- ✅ عند بدء المراجعة (under_review)
- ✅ عند الموافقة (approved)
- ✅ عند الرفض (rejected)

## Files Structure

```
src/
├── components/
│   ├── KYCUpload.tsx              # نموذج رفع المستندات
│   ├── KYCStatus.tsx              # عرض حالة التحقق
│   ├── KYCVerificationBanner.tsx  # شريط التنبيه العلوي
│   └── KYCBlockedOverlay.tsx      # تغطية الميزات المقفلة
├── hooks/
│   ├── useKYCSubmission.ts        # إدارة طلبات المستخدم
│   └── useKYCNotifications.ts     # إدارة الإشعارات
├── admin/
│   ├── AdminApp.tsx               # تطبيق اللوحة الإدارية
│   ├── components/
│   │   ├── AdminLogin.tsx         # تسجيل دخول المسؤولين
│   │   ├── AdminDashboard.tsx     # اللوحة الرئيسية
│   │   └── KYCReviewModal.tsx     # نافذة المراجعة التفصيلية
│   └── hooks/
│       └── useKYCSubmissions.ts   # إدارة جميع الطلبات
└── firebase.ts                    # إعداد Firebase
```

## Environment Variables Required

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_APP_ID=your_app_id
```

## Important Notes

1. **Firebase Storage**: ⚠️ **يجب إعداد Firebase Storage أولاً** - راجع `FIREBASE_STORAGE_SETUP.md`
2. **Admin Access**: يجب إضافة البريد الإلكتروني للمسؤول في مجموعة `admin_allowed_emails` - راجع `ADMIN_EMAIL_SETUP.md`
3. **Firebase**: يُستخدم للمصادقة، قاعدة البيانات (Firestore)، والتخزين (Storage)
4. **Security Rules**: قواعد الأمان محددة في `firestore.rules`
5. **Audit Trail**: جميع الأنشطة مسجلة في `admin_access_audit_log`

## Testing

### Test User Flow:
1. أنشئ حساب جديد
2. أكمل التحقق من البريد والهاتف
3. حاول الوصول لميزة محظورة (مثل التحويلات)
4. سترى overlay يطلب منك التحقق
5. اضغط "تحقق الآن" وارفع المستندات
6. تأكد من ظهور الشريط العلوي

### Test Admin Flow:
1. سجل دخول كمسؤول على `/admin.html`
2. شاهد الإحصائيات
3. افتح طلب للمراجعة
4. وافق أو ارفض
5. تأكد من استلام المستخدم للإشعار

## Future Enhancements (اختياري)

- [ ] OCR لاستخراج البيانات من الوثائق
- [ ] Face recognition للتحقق من الصورة الشخصية
- [ ] تكامل مع خدمات التحقق من الهوية
- [ ] تقارير متقدمة للمسؤولين
- [ ] نظام Roles أكثر تعقيداً

---

## Support

للمساعدة أو الأسئلة، يرجى مراجعة الوثائق أو التواصل مع فريق التطوير.
