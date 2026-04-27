# دليل النشر - Deployment Guide

## متطلبات النشر - Deployment Requirements

### 1. متغيرات البيئة - Environment Variables
يجب أن تكون متغيرات البيئة التالية متوفرة في بيئة النشر:

```env
DATABASE_URL=postgresql://username:password@host:port/database
PGHOST=your-db-host
PGPORT=5432
PGUSER=your-username
PGPASSWORD=your-password
PGDATABASE=your-database-name
NODE_ENV=production
```

### 2. إعداد قاعدة البيانات - Database Setup
- تأكد من أن قاعدة البيانات PostgreSQL متاحة ويمكن الوصول إليها
- قم بتشغيل المايجريشن قبل النشر: `npm run db:push`

### 3. خطوات النشر - Deployment Steps

#### في Replit:
1. تأكد من أن قاعدة البيانات مُعدة في Database tab
2. تحقق من أن متغيرات البيئة متزامنة في Secrets
3. انقر على Deploy في لوحة التحكم
4. اختر نوع النشر المناسب (Reserved VM أو Autoscale)

#### للنشر الخارجي:
1. قم بإعداد قاعدة البيانات PostgreSQL
2. أضف متغيرات البيئة المطلوبة
3. قم بتشغيل: `npm run build` (إذا لزم الأمر)
4. قم بتشغيل: `npm start`

### 4. التحقق من النشر - Deployment Verification
- تحقق من أن الخادم يعمل على المنفذ الصحيح
- تأكد من أن قاعدة البيانات متصلة
- اختبر تسجيل الدخول بالمستخدمين الافتراضيين

### 5. استكشاف الأخطاء - Troubleshooting
- إذا فشل الاتصال بقاعدة البيانات، تحقق من DATABASE_URL
- تأكد من أن المنفذ 5000 متاح
- راجع سجلات الخادم للأخطاء

## الأمان - Security
- لا تشارك متغيرات البيئة الحساسة
- استخدم HTTPS في بيئة الإنتاج
- قم بتحديث كلمات المرور الافتراضية

## الدعم - Support
للمساعدة في النشر، راجع:
- وثائق Replit: https://docs.replit.com/hosting/deployments
- دعم PostgreSQL: https://www.postgresql.org/docs/