import { useEffect, useState } from 'react';
import { CalendarDays, CircleDollarSign, DollarSign, PiggyBank, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { api } from '../api/axios';
import StatCard from '../components/StatCard';

const formatNumber = (value) => new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 }).format(Number(value || 0));
const formatCurrency = (value) => `${formatNumber(value)} افغانی`;

export default function Dashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState({
    totalMilkKg: 0,
    milkPurchaseCost: 0,
    totalExpenses: 0,
    totalSales: 0,
    profit: 0,
    loss: 0,
    dailyResult: 0,
  });

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/dashboard', { params: { date: selectedDate } });
      setDashboard(data);
    } catch (error) {
      console.error('Dashboard fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedDate]);

  return (
    <div className="space-y-6">
      <div className="panel p-4 sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">نمایش آمار روزانه</div>
              <div className="mt-0.5 text-xs text-slate-500">تاریخ مورد نظر را برای گزارش انتخاب کنید</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="field-control sm:w-auto"
            />
            <button
              type="button"
              onClick={fetchDashboard}
              className="btn-primary"
            >
              <RefreshCw className="h-4 w-4" />
              تازه‌سازی
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="کل شیر دریافت‌شده" value={loading ? '...' : `${formatNumber(dashboard.totalMilkKg)} کیلوگرم`} icon={PiggyBank} accent="emerald" />
        <StatCard label="کل فروش" value={loading ? '...' : formatCurrency(dashboard.totalSales)} icon={CircleDollarSign} accent="blue" />
        <StatCard label="هزینه خرید شیر" value={loading ? '...' : formatCurrency(dashboard.milkPurchaseCost)} icon={DollarSign} accent="orange" />
        <StatCard label="کل مصارف" value={loading ? '...' : formatCurrency(dashboard.totalExpenses)} icon={TrendingDown} accent="red" />
        <StatCard label="سود روزانه" value={loading ? '...' : formatCurrency(dashboard.profit)} icon={TrendingUp} accent="emerald" />
        <StatCard label="زیان روزانه" value={loading ? '...' : formatCurrency(dashboard.loss)} icon={TrendingDown} accent="red" />
      </div>

      <div className="panel p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-extrabold text-slate-900">خلاصه مالی</h2>
          <p className="mt-1 text-sm text-slate-500">مقایسه فروش، سود و زیان در روز انتخاب‌شده</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="text-sm text-slate-500">نتیجه روزانه</div>
            <div className="mt-2 text-2xl font-bold text-slate-800">{loading ? '...' : formatCurrency(dashboard.dailyResult)}</div>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
            <div className="text-sm text-emerald-700">سود</div>
            <div className="mt-2 text-2xl font-bold text-emerald-800">{loading ? '...' : formatCurrency(dashboard.profit)}</div>
          </div>
          <div className="rounded-xl border border-red-100 bg-red-50/70 p-4">
            <div className="text-sm text-red-700">زیان</div>
            <div className="mt-2 text-2xl font-bold text-red-800">{loading ? '...' : formatCurrency(dashboard.loss)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
