# سیستم مدیریت لبنیات

این پروژه نسخه اول از یک سامانه مدیریت لبنیات است که با React، Tailwind CSS، Node.js، Express و MySQL ساخته شده است. رابط کاربری به زبان فارسی و با جهت راست‌به‌چپ طراحی شده است.

## نیازمندی‌ها

- Node.js 18 یا بالاتر
- MySQL 8 یا سازگار
- npm

## 1) ساخت پایگاه داده

1. MySQL را اجرا کنید.
2. فایل SQL را اجرا کنید:

```bash
mysql -u root -p < backend/database.sql
```

یا با استفاده از ابزار MySQL Workbench یا phpMyAdmin.

## 2) تنظیم متغیرهای محیطی

کپی‌برداری از فایل نمونه:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

نمونه محتوا:

```env
# backend/.env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=dairy_management
PORT=5000
FRONTEND_URL=http://localhost:5173
```

```env
# frontend/.env
VITE_API_URL=http://localhost:5000/api
```

## 3) نصب وابستگی‌های Backend

```bash
cd backend
npm install
```

## 4) اجرای Backend

```bash
cd backend
npm run dev
```

یا:

```bash
cd backend
npm start
```

آدرس پیش‌فرض: http://localhost:5000

## 5) نصب وابستگی‌های Frontend

```bash
cd frontend
npm install
```

## 6) اجرای Frontend

```bash
cd frontend
npm run dev
```

آدرس پیش‌فرض: http://localhost:5173

## 7) تست API

### سلامت سرور

```bash
curl http://localhost:5000/api/health
```

### نمونه درخواست‌ها

```bash
curl http://localhost:5000/api/settings
curl http://localhost:5000/api/suppliers
curl http://localhost:5000/api/milk?from=2025-01-01&to=2025-01-31
curl http://localhost:5000/api/expenses?from=2025-01-01&to=2025-01-31
curl http://localhost:5000/api/sales?from=2025-01-01&to=2025-01-31
curl "http://localhost:5000/api/dashboard?date=2025-01-15"
```

## 8) مشکلات رایج

- خطای اتصال به MySQL: نام کاربری، رمز عبور و نام دیتابیس را بررسی کنید.
- اجرای API بدون اتصال DB: سرور به‌صورت امن در حالت بدون دیتابیس شروع می‌شود اما بعضی endpointها به پایگاه داده وابسته‌اند.
- خطای CORS: مطمئن شوید FRONTEND_URL در backend/.env درست تنظیم شده باشد.
- خطای آپلود تصویر: فرمت‌های مجاز JPEG، PNG و WebP و حجم کمتر از 3 مگابایت هستند.

## 9) ویژگی‌های پیاده‌سازی شده

- داشبورد روزانه با محاسبه سود و زیان
- ثبت شیرآوران و سوابق شیر
- ثبت هزینه‌ها و فروش‌ها
- مدیریت تنظیمات لبنیات و آپلود لوگو
- مدیریت محصولات و آپلود تصویر محصول
- رابط کاربری فارسی و واکنش‌گرا

## 10) محدودیت‌ها

- در نسخه اول، احراز هویت وجود ندارد.
- سیستم موجودی کالا پیشرفته وجود ندارد.
- حسابداری کامل به‌صورت حرفه‌ای در این نسخه پیاده‌سازی نشده است.

## 11) اپلیکیشن مستقل Android

اپ بومی Android در پوشه `android-mobile` قرار دارد. نسخه فعلی به سرور یا اینترنت نیاز ندارد و داده‌ها را در پایگاه داده SQLite روی همان موبایل ذخیره می‌کند؛ دیتابیس آن جدا از سیستم وب است. فایل APK برای نصب مستقیم در `android-mobile/app/build/outputs/apk/debug/app-debug.apk` ساخته می‌شود. برای جزئیات ساخت و نصب، `android-mobile/README.md` را ببینید.

---

اگر MySQL در محیط شما در دسترس نباشد، اجرای کامل پایگاه داده و تست‌های آن ممکن است نیاز به فعال‌سازی سرور MySQL داشته باشد.
