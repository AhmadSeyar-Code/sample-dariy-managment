import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, Milk, ShieldCheck, Sparkles } from 'lucide-react';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.email.trim() || !form.password.trim()) {
      setError('لطفاً نام کاربری و رمز عبور را وارد کنید.');
      return;
    }

    if (form.email.trim() !== 'admin@dairy.af' || form.password !== 'admin123') {
      setError('نام کاربری یا رمز عبور درست نیست.');
      return;
    }

    onLogin?.();
    navigate('/');
  };

  return (
    <main dir="rtl" lang="fa" className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3f7f4] px-4 py-8 sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-32 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-24 h-[30rem] w-[30rem] rounded-full bg-lime-100/70 blur-3xl" />

      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_28px_90px_-35px_rgba(15,75,51,0.28)] lg:min-h-[610px] lg:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-14 lg:py-14">
          <div className="mb-9 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
              <Milk className="h-6 w-6" />
            </div>
            <div>
              <div className="font-bold text-slate-800">لبنیات افغان</div>
              <div className="mt-0.5 text-xs text-slate-500">سامانه مدیریت لبنیات</div>
            </div>
          </div>

          <div className="mb-8">
            <p className="mb-3 text-sm font-semibold text-emerald-700">خوش آمدید</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">ورود به حساب کاربری</h1>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              برای مدیریت روزانه کسب‌وکار خود، مشخصات ورودتان را وارد کنید.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block text-sm font-semibold text-slate-700">
              <span className="mb-2.5 block">نام کاربری یا ایمیل</span>
              <span className="relative block">
                <Mail aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  autoComplete="username"
                  name="email"
                  type="text"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="نام کاربری خود را وارد کنید"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pr-12 pl-4 text-right font-normal text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
              </span>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              <span className="mb-2.5 block">رمز عبور</span>
              <span className="relative block">
                <LockKeyhole aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  autoComplete="current-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="رمز عبور خود را وارد کنید"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pr-12 pl-12 text-right font-normal text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور'}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </span>
            </label>

            {error ? (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3.5 font-bold text-white shadow-lg shadow-emerald-700/20 transition hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-xl hover:shadow-emerald-700/25 focus:outline-none focus:ring-4 focus:ring-emerald-500/25"
            >
              ورود امن به سامانه
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            </button>
          </form>

          <div className="mt-7 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            ورود شما به‌صورت امن محافظت می‌شود
          </div>
        </div>

        <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 p-10 text-white lg:flex lg:p-12">
          <div aria-hidden="true" className="absolute -left-24 -top-20 h-72 w-72 rounded-full border border-white/10" />
          <div aria-hidden="true" className="absolute -left-12 -top-8 h-48 w-48 rounded-full border border-white/10" />
          <div aria-hidden="true" className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-emerald-400/10 blur-2xl" />

          <div className="relative flex items-center gap-2 text-sm font-medium text-emerald-100">
            <Sparkles className="h-4 w-4" />
            مدیریت هوشمند، کار روزانه آسان‌تر
          </div>

          <div className="relative py-10">
            <div className="mb-7 flex h-24 w-24 items-center justify-center rounded-[2rem] border border-white/15 bg-white/10 shadow-2xl shadow-emerald-950/20 backdrop-blur">
              <Milk className="h-12 w-12 text-emerald-100" strokeWidth={1.5} />
            </div>
            <h2 className="max-w-sm text-4xl font-extrabold leading-[1.35]">
              همه بخش‌های لبنیات، در یک نگاه
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-emerald-100/80">
              خرید شیر، فروش، محصولات و مصارف روزانه را یکجا و با نظم مدیریت کنید.
            </p>
          </div>

          <div className="relative flex items-center justify-between border-t border-white/15 pt-5 text-xs text-emerald-100/70">
            <span>سامانه مدیریت لبنیات افغان</span>
            <span>نسخه مدیریتی</span>
          </div>
        </aside>
      </section>

      <p className="absolute bottom-3 text-center text-[11px] text-slate-400">
        © لبنیات افغان — سامانه مدیریت روزانه
      </p>
    </main>
  );
}
