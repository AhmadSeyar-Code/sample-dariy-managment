import { NavLink } from 'react-router-dom';
import { BarChart3, Boxes, CircleDollarSign, LogOut, Milk, Settings, Truck, UtensilsCrossed } from 'lucide-react';
import { getMediaUrl } from '../api/axios';

const navItems = [
  { to: '/', label: 'داشبورد', icon: BarChart3 },
  { to: '/suppliers', label: 'شیرآوران و شیر', icon: Truck },
  { to: '/sales', label: 'فروشات', icon: UtensilsCrossed },
  { to: '/expenses', label: 'مصارف', icon: CircleDollarSign },
  { to: '/products', label: 'محصولات', icon: Boxes },
  { to: '/settings', label: 'تنظیمات', icon: Settings },
];

export default function Sidebar({ dairyName, logoPath, onLogout }) {
  return (
    <aside className="border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[270px] lg:shrink-0 lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-l">
      <div className="flex items-center gap-3 px-4 py-4 lg:border-b lg:border-slate-100 lg:px-5 lg:py-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
          {logoPath ? (
            <img src={getMediaUrl(logoPath)} alt="" className="h-full w-full object-cover" />
          ) : (
            <Milk className="h-6 w-6 text-emerald-700" />
          )}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-extrabold text-slate-900">{dairyName || 'لبنیات افغان'}</div>
          <div className="mt-1 text-xs text-slate-500">سامانه مدیریت لبنیات</div>
        </div>
      </div>

      <div className="px-4 pb-3 pt-2 lg:px-4 lg:pb-5 lg:pt-6">
        <p className="mb-2 hidden px-3 text-[11px] font-bold text-slate-400 lg:block">منوی اصلی</p>
        <nav aria-label="منوی اصلی" className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:pb-0">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all lg:w-full ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/10'
                    : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
                }`
              }
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="hidden px-4 lg:mt-auto lg:block lg:pb-5">
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
              <Milk className="h-4 w-4" />
            </span>
            مدیریت یکپارچه
          </div>
          <p className="text-xs leading-6 text-emerald-900/70">ثبت دریافت شیر، فروش و مصارف روزانه در یک سامانه.</p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-[18px] w-[18px]" />
          خروج از حساب
        </button>
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="mx-4 mb-3 flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-700 lg:hidden"
      >
        <LogOut className="h-[18px] w-[18px]" />
        خروج
      </button>
    </aside>
  );
}
