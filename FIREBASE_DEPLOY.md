# رفع النظام على Firebase

## المتطلبات الأساسية
- Node.js 20+
- حساب Firebase مع مشروع `mds1-31961`

## تثبيت Firebase CLI (مرة واحدة فقط)
```bash
npm install -g firebase-tools
firebase login
```

## إعداد الأسرار في Firebase (مرة واحدة فقط)
```bash
firebase functions:secrets:set NEON_DATABASE_URL
# أدخل: postgresql://neondb_owner:...

firebase functions:secrets:set DATABASE_URL
# أدخل نفس قيمة NEON_DATABASE_URL

firebase functions:secrets:set SESSION_SECRET
# أدخل: أي نص عشوائي طويل مثل abc123xyz
```

## الرفع الكامل (Frontend + Backend)
```bash
npm run deploy:firebase
```

## الرفع المنفصل
```bash
# رفع الواجهة فقط
npm run deploy:hosting

# رفع الباكند (Functions) فقط
npm run deploy:functions
```

## ملاحظات
- **قاعدة البيانات**: النظام يستخدم Neon PostgreSQL — لا حاجة لتغييرها
- **الملفات المرفوعة**: عند الرفع على Firebase Functions، الملفات المؤقتة تُخزن في `/tmp` (لا تدوم بعد إعادة تشغيل الوظيفة)
- **المصادقة**: النظام يستخدم مصادقة محلية مع bcrypt — لا تعتمد على Firebase Auth
