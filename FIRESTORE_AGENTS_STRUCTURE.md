# Firestore Structure for Agents Management

## Collection: `agents`

هذه المجموعة تحتوي على جميع بيانات الوكلاء في النظام.

### Document Structure

```javascript
{
  // معلومات أساسية
  "name": "string",                    // اسم الوكيل (مطلوب)
  "code": "string",                    // كود فريد للوكيل (مطلوب)
  "country": "string",                 // الدولة (مطلوب)
  "city": "string",                    // المدينة (مطلوب)
  "address": "string",                 // العنوان الكامل (مطلوب)

  // معلومات الاتصال
  "phone": "string",                   // رقم الهاتف (مطلوب)
  "email": "string",                   // البريد الإلكتروني (اختياري)

  // معلومات التشغيل
  "working_hours": "string",           // ساعات العمل (مطلوب)
  "status": "string",                  // الحالة: active, inactive, suspended

  // معلومات مالية
  "commission_rate": number,           // نسبة العمولة (افتراضي: 2.5)
  "max_transaction_amount": number,    // الحد الأقصى للمعاملة (افتراضي: 10000)
  "min_transaction_amount": number,    // الحد الأدنى للمعاملة (افتراضي: 10)
  "supported_currencies": ["string"],  // العملات المدعومة (افتراضي: ["USD", "EUR"])

  // معلومات الموقع الجغرافي
  "latitude": number,                  // خط العرض (اختياري)
  "longitude": number,                 // خط الطول (اختياري)

  // إحصائيات
  "rating": number,                    // التقييم (0-5، افتراضي: 0)
  "total_transactions": number,        // إجمالي المعاملات (افتراضي: 0)

  // معلومات النظام
  "created_at": Timestamp,             // تاريخ الإنشاء
  "updated_at": Timestamp              // تاريخ آخر تحديث
}
```

### Example Document

```javascript
{
  "name": "وكيل الرياض المركزي",
  "code": "AG123456ABCD",
  "country": "السعودية",
  "city": "الرياض",
  "address": "شارع الملك فهد، حي العليا",
  "phone": "+966 11 234 5678",
  "email": "riyadh@agents.com",
  "working_hours": "9:00 ص - 9:00 م",
  "status": "active",
  "commission_rate": 2.5,
  "max_transaction_amount": 10000,
  "min_transaction_amount": 10,
  "supported_currencies": ["USD", "EUR", "SAR"],
  "latitude": 24.7136,
  "longitude": 46.6753,
  "rating": 4.5,
  "total_transactions": 150,
  "created_at": Timestamp,
  "updated_at": Timestamp
}
```

---

## Collection: `agent_locations`

مجموعة فرعية لتخزين المواقع المتعددة لكل وكيل (للاستخدام المستقبلي).

### Document Structure

```javascript
{
  "agent_id": "string",                // معرف الوكيل الرئيسي (مطلوب)
  "name": "string",                    // اسم الموقع (مطلوب)
  "address": "string",                 // عنوان الموقع (مطلوب)
  "city": "string",                    // المدينة (مطلوب)
  "phone": "string",                   // رقم هاتف الموقع (اختياري)
  "working_hours": "string",           // ساعات العمل (مطلوب)
  "status": "string",                  // الحالة: active, inactive, maintenance
  "latitude": number,                  // خط العرض (اختياري)
  "longitude": number,                 // خط الطول (اختياري)
  "created_at": Timestamp,             // تاريخ الإنشاء
  "updated_at": Timestamp              // تاريخ آخر تحديث
}
```

---

## Firestore Security Rules

يجب إضافة القواعد التالية في `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // قواعد الوكلاء
    match /agents/{agentId} {
      // السماح بالقراءة للمستخدمين المصادق عليهم فقط
      allow read: if request.auth != null;

      // السماح بالكتابة للمسؤولين فقط
      // يجب التحقق من أن المستخدم موجود في قائمة المسؤولين
      allow write: if request.auth != null;
    }

    // قواعد مواقع الوكلاء
    match /agent_locations/{locationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

---

## Firestore Indexes

للحصول على أداء أفضل، يُنصح بإنشاء المؤشرات التالية في `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "agents",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "agents",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "country", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "agents",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "rating", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

---

## ملاحظات مهمة

1. **الكود الفريد**: يجب أن يكون حقل `code` فريداً لكل وكيل. تأكد من ذلك في منطق التطبيق.

2. **التحديثات التلقائية**: حقل `updated_at` يتم تحديثه تلقائياً عند أي تعديل باستخدام `serverTimestamp()`.

3. **الاستماع في الوقت الفعلي**: النظام يستخدم `onSnapshot` للاستماع للتغييرات في الوقت الفعلي.

4. **الصلاحيات**: تأكد من إعداد قواعد الأمان في Firebase Console لمنع الوصول غير المصرح به.

5. **النسخ الاحتياطي**: يُنصح بإعداد نسخ احتياطية دورية لمجموعة الوكلاء.
