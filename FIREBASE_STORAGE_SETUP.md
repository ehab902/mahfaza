# إعداد Firebase Storage للـ KYC

## نظرة عامة

يستخدم المشروع **Firebase Storage** لتخزين مستندات KYC بشكل آمن ومتكامل مع Firebase Authentication.

## خطوات الإعداد

### 1. تفعيل Firebase Storage

1. اذهب إلى [Firebase Console](https://console.firebase.google.com)
2. اختر مشروعك
3. من القائمة الجانبية، اختر **Storage**
4. اضغط على **Get Started**
5. اختر موقع التخزين (اختر الأقرب لمستخدميك)
6. انقر **Done**

### 2. إعداد قواعد الأمان (Security Rules)

في Firebase Console > Storage > Rules، استبدل القواعد بالتالي:

```
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // KYC Documents - يمكن للمستخدمين رفع ملفاتهم فقط
    match /kyc-documents/{userId}/{document}/{fileName} {
      // السماح للمستخدم برفع ملفاته فقط
      allow write: if request.auth != null && request.auth.uid == userId;

      // السماح للمستخدم بقراءة ملفاته فقط
      allow read: if request.auth != null && request.auth.uid == userId;
    }

    // يمكنك إضافة قواعد للأدمن هنا إذا أردت
    // allow read: if request.auth.token.admin == true;
  }
}
```

### 3. تحديد حجم الملفات (اختياري)

في Firebase Console > Storage > Usage، يمكنك:
- مراقبة استخدام المساحة
- تحديد حد أقصى للتخزين

### 4. التحقق من الإعداد

بعد الإعداد:
1. سجل دخول في التطبيق
2. حاول رفع مستندات KYC
3. يجب أن يعمل الرفع بنجاح
4. تحقق من Firebase Console > Storage لرؤية الملفات المرفوعة

## هيكل المجلدات في Storage

```
kyc-documents/
├── {user_id_1}/
│   ├── national_id/
│   │   └── timestamp_random.jpg
│   ├── passport/
│   │   └── timestamp_random.jpg
│   └── selfie/
│       └── timestamp_random.jpg
├── {user_id_2}/
│   ├── national_id/
│   ├── passport/
│   └── selfie/
...
```

## ميزات الأمان المطبقة

✅ كل مستخدم يمكنه رفع وقراءة ملفاته فقط
✅ أسماء الملفات عشوائية مع timestamp
✅ الملفات منظمة حسب user_id ونوع المستند
✅ يتطلب authentication للوصول

## ملاحظات مهمة

1. **حجم الملفات**: Firebase Storage مجاني حتى 5GB (Spark Plan)
2. **البيانات**: جميع الملفات والبيانات مخزنة في Firebase
3. **URLs**: الروابط في مجموعة kyc_submissions تشير إلى Firebase Storage
4. **الأمان**: تأكد من نشر القواعد الصحيحة قبل الاستخدام في Production

## للأدمن: الوصول للملفات

للسماح للأدمن بقراءة جميع الملفات، أضف هذه القاعدة:

```
match /kyc-documents/{userId}/{document}/{fileName} {
  allow write: if request.auth != null && request.auth.uid == userId;
  allow read: if request.auth != null &&
               (request.auth.uid == userId ||
                request.auth.token.admin == true);
}
```

ثم في Firebase Console، أضف البريد الإلكتروني للمسؤول في مجموعة `admin_allowed_emails`.
للتفاصيل، راجع `ADMIN_EMAIL_SETUP.md`

## استكشاف الأخطاء

### خطأ: "Permission denied"
- تأكد من أن قواعد Storage منشورة بشكل صحيح
- تأكد من أن المستخدم مسجل دخول
- تحقق من Firebase Console > Storage > Rules

### خطأ: "Storage not enabled"
- اذهب إلى Firebase Console
- فعّل Storage من قسم Storage

### خطأ: "Quota exceeded"
- تحقق من استخدام المساحة في Firebase Console
- قد تحتاج للترقية إلى خطة Blaze

---

## مزايا Firebase Storage

✅ تكامل كامل مع Firebase Authentication
✅ قواعد أمان بسيطة وواضحة
✅ أداء ممتاز وسريع
✅ حد مجاني سخي (5GB)
✅ يعمل مباشرة بدون إعدادات معقدة

