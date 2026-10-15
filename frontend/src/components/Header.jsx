import { useState } from 'react';
import { CalendarDays, ChevronLeft, Moon, Sun } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const pageMeta = {
  '/': { title: 'داشبورد', description: 'خلاصه‌ای از وضعیت روزانه کسب‌وکار شما' },
  '/suppliers': { title: 'شیرآوران و دریافت شیر', description: 'مدیریت شیرآوران و ثبت دریافت روزانه شیر' },
  '/expenses': { title: 'مدیریت مصارف', description: 'ثبت و بررسی هزینه‌های روزانه لبنیات' },
  '/sales': { title: 'مدیریت فروشات', description: 'ثبت فروش‌ها و پیگیری درآمد روزانه' },
  '/products': { title: 'محصولات', description: 'مدیریت فهرست محصولات و تصاویر آن‌ها' },
  '/settings': { title: 'تنظیمات لبنیات', description: 'اطلاعات و هویت بصری کسب‌وکار خود را مدیریت کنید' },
};

const formatDate = (date) =>
  new Intl.DateTimeFormat('fa-IR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);

export default function Header({ isDarkMode, onToggleDarkMode }) {
  const location = useLocation();
  const [dateLabel] = useState(() => formatDate(new Date()));
  const page = pageMeta[location.pathname] || pageMeta['/'];

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-400">
            <Link to="/" className="transition hover:text-emerald-700">خانه</Link>
            <ChevronLeft className="h-3 w-3" />
            <span className="truncate text-emerald-700">{page.title}</span>
          </div>
          <h1 className="truncate text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{page.title}</h1>
          <p className="mt-1 hidden text-sm text-slate-500 sm:block">{page.description}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 sm:flex">
            <CalendarDays className="h-4 w-4 text-emerald-700" />
            <span>{dateLabel}</span>
          </div>
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label={isDarkMode ? 'فعال‌کردن حالت روشن' : 'فعال‌کردن حالت تاریک'}
            title={isDarkMode ? 'حالت روشن' : 'حالت تاریک'}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/15"
          >
            {isDarkMode ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </div>
    </header>
  );
}
