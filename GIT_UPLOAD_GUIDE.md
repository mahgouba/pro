# دليل رفع الملفات إلى GitHub

## الخطوات المطلوبة:

### 1. تحضير المشروع
```bash
# إنشاء مستودع Git محلي
git init

# إضافة جميع الملفات
git add .

# إنشاء أول commit
git commit -m "Initial commit: Arabic inventory management system with specifications"
```

### 2. إنشاء مستودع على GitHub
1. اذهب إلى https://github.com
2. انقر على "New repository"
3. اختر اسم المستودع: `arabic-inventory-system`
4. اختر "Private" أو "Public" حسب الحاجة
5. لا تضع أي ملفات (README, .gitignore, license)

### 3. ربط المستودع المحلي بـ GitHub
```bash
# استبدل USERNAME بـ اسم المستخدم الخاص بك
git remote add origin https://github.com/USERNAME/arabic-inventory-system.git

# رفع الملفات إلى الفرع الرئيسي
git branch -M main
git push -u origin main
```

### 4. ملفات مهمة يجب التحقق منها:
- ✅ `package.json` - تحتوي على جميع التبعيات
- ✅ `shared/schema.ts` - قاعدة البيانات والمخططات
- ✅ `server/` - خادم Express مع APIs
- ✅ `client/` - تطبيق React
- ✅ `replit.md` - توثيق المشروع
- ✅ `.gitignore` - تأكد من استثناء node_modules

### 5. متغيرات البيئة المطلوبة:
بعد رفع الملفات، ستحتاج إلى إعداد متغيرات البيئة:

```env
DATABASE_URL=your_postgresql_connection_string
OPENAI_API_KEY=your_openai_api_key
```

### 6. تشغيل المشروع محلياً:
```bash
# تثبيت التبعيات
npm install

# تشغيل التطبيق
npm run dev
```

## المميزات الرئيسية المدمجة:

### ✅ إدارة المخزون
- إضافة وتعديل وحذف المركبات
- البحث والتصفية المتقدمة
- إحصائيات تفصيلية

### ✅ إدارة المواصفات
- نظام إدارة المواصفات الشامل
- مشاركة المركبات مع المواصفات التفصيلية
- واجهة عربية متكاملة

### ✅ نظام المستخدمين
- تسجيل الدخول والخروج
- صلاحيات مختلفة (أدمن / مستخدم)
- إدارة المستخدمين

### ✅ المساعد الصوتي
- معالجة الأوامر الصوتية
- تكامل مع OpenAI GPT-4
- دعم اللغة العربية

### ✅ واجهة متجاوبة
- تصميم متجاوب لجميع الأجهزة
- دعم الوضع الليلي
- واجهة عربية بـ RTL

## ملاحظات مهمة:
- المشروع يستخدم PostgreSQL كقاعدة بيانات
- تأكد من تحديث `DATABASE_URL` في البيئة المحلية
- API Key الخاص بـ OpenAI مطلوب للمساعد الصوتي
- جميع النصوص باللغة العربية مع دعم RTL