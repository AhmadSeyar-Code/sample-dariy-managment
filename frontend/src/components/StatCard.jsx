export default function StatCard({ label, value, icon: Icon, accent = 'emerald' }) {
  const accentMap = {
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    orange: 'bg-orange-50 text-orange-700',
    red: 'bg-red-50 text-red-700',
    violet: 'bg-violet-50 text-violet-700',
  };

  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_18px_-12px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-18px_rgba(15,23,42,0.3)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-sm font-medium text-slate-500">{label}</span>
          <div className="mt-3 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{value}</div>
        </div>
        <div className={`rounded-xl p-2.5 transition group-hover:scale-105 ${accentMap[accent] || accentMap.emerald}`}>
          {Icon ? <Icon className="h-5 w-5" strokeWidth={1.8} /> : null}
        </div>
      </div>
    </div>
  );
}
