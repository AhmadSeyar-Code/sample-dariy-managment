import { useEffect, useState } from 'react';
import { Camera, Save, Trash2 } from 'lucide-react';
import { api, getMediaUrl } from '../api/axios';
import FormField from '../components/FormField';

export default function Settings({ onSettingsUpdated }) {
  const [settings, setSettings] = useState({ dairy_name: '', phone: '', address: '', logo_path: '' });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/settings');
      setSettings(data);
      if (onSettingsUpdated) onSettingsUpdated(data);
    } catch (error) {
      console.error('Settings fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.put('/settings', {
        dairyName: settings.dairy_name,
        phone: settings.phone,
        address: settings.address,
      });
      setSettings(data);
      if (onSettingsUpdated) onSettingsUpdated(data);
      alert('تنظیمات با موفقیت ذخیره شد.');
    } catch (error) {
      alert(error.response?.data?.message || 'ذخیره تنظیمات انجام نشد.');
    }
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);
    try {
      const { data } = await api.post('/settings/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const nextSettings = { ...settings, logo_path: data.logoPath };
      setSettings(nextSettings);
      if (onSettingsUpdated) onSettingsUpdated(nextSettings);
    } catch (error) {
      alert(error.response?.data?.message || 'آپلود لوگو انجام نشد.');
    }
  };

  const handleLogoRemove = async () => {
    try {
      const { data } = await api.delete('/settings/logo');
      const nextSettings = { ...settings, logo_path: data.logoPath };
      setSettings(nextSettings);
      if (onSettingsUpdated) onSettingsUpdated(nextSettings);
    } catch (error) {
      alert(error.response?.data?.message || 'حذف لوگو انجام نشد.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="panel p-5 sm:p-6">
        <div className="mb-6">
          <h2 className="text-lg font-extrabold text-slate-900">اطلاعات کسب‌وکار</h2>
          <p className="mt-1 text-sm text-slate-500">اطلاعاتی که در سامانه نمایش داده می‌شوند را مدیریت کنید.</p>
        </div>
        {loading ? (
          <div className="space-y-4">
            <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="نام لبنیات" name="dairy_name" value={settings.dairy_name || ''} onChange={handleChange} required />
              <FormField label="شماره تماس" name="phone" value={settings.phone || ''} onChange={handleChange} />
            </div>
            <label className="block text-sm font-medium text-slate-700">
              <span className="mb-2 block">آدرس</span>
              <textarea name="address" value={settings.address || ''} onChange={handleChange} className="field-control resize-y" rows="3" />
            </label>
            <button type="submit" className="btn-primary">
              <Save className="h-4 w-4" />
              ذخیره تنظیمات
            </button>
          </form>
        )}
      </div>

      <div className="panel p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
            <Camera className="h-5 w-5 text-emerald-700" />
            هویت بصری
          </h2>
          <p className="mt-1 text-sm text-slate-500">لوگوی لبنیات در سربرگ سامانه نمایش داده می‌شود.</p>
        </div>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <img src={getMediaUrl(settings.logo_path)} alt="لوگوی لبنیات" className="h-24 w-24 rounded-2xl border border-slate-200 bg-slate-50 object-cover p-1" />
          <div>
            <div className="flex flex-wrap gap-3">
            <label className="btn-primary cursor-pointer">آپلود لوگو
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoUpload} />
            </label>
            <button type="button" onClick={handleLogoRemove} className="btn-secondary">
              <Trash2 className="h-4 w-4" />
              حذف لوگو
            </button>
            </div>
            <p className="mt-3 text-xs text-slate-400">فرمت‌های قابل قبول: JPG، PNG یا WebP؛ حداکثر ۳ مگابایت</p>
          </div>
        </div>
      </div>
    </div>
  );
}
