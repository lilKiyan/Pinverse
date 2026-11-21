<div align="center">

# 📌 Pinverse

**یک پلتفرم کامل و مدرن اشتراک‌گذاری تصویر با Next.js 16، React 19، TypeScript، Prisma و Tailwind CSS**

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-61dafb)
![Prisma](https://img.shields.io/badge/Prisma-6-2d3748)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8)

</div>

---

## ✨ معرفی

پروژه **Pinverse** یک شبکه‌ی اجتماعی اشتراک‌گذاری تصویر است که با جدیدترین تکنولوژی‌های وب ساخته شده. کاربران می‌توانند پین‌های تصویری ایجاد کنند، آن‌ها را در بردهای شخصی ذخیره کنند، به یکدیگر دنبال کنند، لایک و کامنت بگذارند و پین‌های مرتبط را کشف کنند.

طراحی رابط کاربری کاملاً واکنش‌گرا و مدرن است و شامل انیمیشن‌های نرم و تجربه‌ی کاربری لذت‌بخش می‌باشد.

---

## 🚀 ویژگی‌های کلیدی

- 🔐 **احراز هویت کامل**: ثبت‌نام، ورود، خروج با JWT و کوکی httpOnly
- 📌 **مدیریت پین‌ها**: ایجاد، ویرایش، حذف، نمایش با Infinite Scroll و Masonry Grid
- 📁 **بردهای شخصی**: ساخت، ویرایش، حذف برد و ذخیره‌ی پین در چند برد
- ❤️ **لایک و کامنت**: تعامل اجتماعی روی هر پین
- 👥 **دنبال‌کردن کاربران**: فالو/آنفالو و نمایش آمار دنبال‌کننده‌ها
- 🔍 **جستجوی زنده**: پیشنهاد نتایج هنگام تایپ و صفحه‌ی نتایج کامل
- 🖼️ **آپلود تصویر**: ذخیره‌سازی فایل در `public/uploads` با اعتبارسنجی فرمت
- 🌙 **طراحی مدرن**: Tailwind CSS، افکت‌های شیشه‌ای، انیمیشن‌های سفارشی
- 📱 **کاملاً واکنش‌گرا**: از موبایل تا دسکتاپ
- ⚡ **Infinite Scroll**: بارگذاری خودکار پین‌ها با IntersectionObserver
- 🛡️ **امنیت**: محافظت از مسیرها با proxy، کنترل مالکیت منابع و رمزنگاری bcrypt

---

## 🛠️ تکنولوژی‌ها

| دسته | تکنولوژی |
|------|-----------|
| فریم‌ورک | Next.js 16 (App Router) |
| زبان | TypeScript |
| UI | React 19 + Tailwind CSS 4 |
| State Management | Zustand |
| دیتابیس | SQLite + Prisma ORM 6 |
| احراز هویت | JWT + bcryptjs |
| آیکون‌ها | react-icons / lucide-react |
| استایل | Tailwind + CSS Modules |

---
## 📦 نصب و راه‌اندازی

### پیش‌نیازها

- Node.js 18+
- npm یا yarn

### مراحل نصب

1. **دریافت پروژه**
   ```bash
   git clone https://github.com/your-username/pinterest-clone.git
   cd pinterest-clone
