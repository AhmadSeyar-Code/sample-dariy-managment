import { useEffect, useState } from 'react';
import { Plus, Search, ShoppingCart } from 'lucide-react';
import { api } from '../api/axios';
import DataTable from '../components/DataTable';
import FormField from '../components/FormField';

const formatCurrency = (value) => `${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 }).format(Number(value || 0))} افغانی`;

export default function Suppliers() {
  const today = new Date().toISOString().slice(0, 10);
  const [suppliers, setSuppliers] = useState([]);
  const [milkRecords, setMilkRecords] = useState([]);
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '' });
  const [milkForm, setMilkForm] = useState({ supplierId: '', recordDate: today, quantityKg: '', pricePerKg: '', notes: '' });
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(today);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ totalKg: 0, totalCost: 0, count: 0 });

  const fetchSuppliers = async () => {
    try {
      const { data } = await api.get('/suppliers');
      setSuppliers(data);
      if (!selectedSupplierId && data[0]) {
        setSelectedSupplierId(String(data[0].id));
      }
    } catch (error) {
      console.error('Suppliers fetch failed:', error);
    }
  };

  const fetchMilkRecords = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/milk', {
        params: {
          supplierId: selectedSupplierId || undefined,
          from: fromDate || undefined,
          to: toDate || undefined,
        },
      });
      setMilkRecords(data.records || []);
      setSummary({ totalKg: data.totalKg || 0, totalCost: data.totalCost || 0, count: data.count || 0 });
    } catch (error) {
      console.error('Milk fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    fetchMilkRecords();
  }, [selectedSupplierId, fromDate, toDate]);

  const handleSupplierSubmit = async (event) => {
    event.preventDefault();
    if (!supplierForm.name || !supplierForm.phone) {
      alert('نام و شماره تماس شیرآور الزامی است.');
      return;
    }
    try {
      await api.post('/suppliers', supplierForm);
      setSupplierForm({ name: '', phone: '' });
      fetchSuppliers();
    } catch (error) {
      alert(error.response?.data?.message || 'ثبت شیرآور انجام نشد.');
    }
  };

  const handleMilkSubmit = async (event) => {
    event.preventDefault();
    if (!milkForm.supplierId || !milkForm.recordDate || !milkForm.quantityKg || !milkForm.pricePerKg) {
      alert('تمامی فیلدهای مورد نیاز برای ثبت شیر را کامل کنید.');
      return;
    }
    try {
      await api.post('/milk', {
        supplierId: Number(milkForm.supplierId),
        recordDate: milkForm.recordDate,
        quantityKg: Number(milkForm.quantityKg),
        pricePerKg: Number(milkForm.pricePerKg),
        notes: milkForm.notes,
      });
      setMilkForm({ supplierId: milkForm.supplierId, recordDate: today, quantityKg: '', pricePerKg: '', notes: '' });
      fetchMilkRecords();
    } catch (error) {
      alert(error.response?.data?.message || 'ثبت رکورد شیر انجام نشد.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="panel p-5 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-800">
            <Plus className="h-5 w-5 text-emerald-600" />
            ثبت شیرآور جدید
          </h2>
          <form onSubmit={handleSupplierSubmit} className="space-y-4">
            <FormField label="نام شیرآور" name="name" value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} required />
            <FormField label="شماره تماس" name="phone" value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} required />
            <button type="submit" className="btn-primary w-full">ثبت شیرآور</button>
          </form>

          <div className="mt-7 border-t border-slate-100 pt-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">فهرست شیرآوران</h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">{suppliers.length}</span>
            </div>
            <div className="space-y-2">
              {suppliers.map((supplier) => (
                <button
                  key={supplier.id}
                  type="button"
                  onClick={() => setSelectedSupplierId(String(supplier.id))}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-right transition ${
                    Number(selectedSupplierId) === supplier.id ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-slate-50/70 hover:border-slate-200'
                  }`}
                >
                  <span className="truncate text-sm font-semibold text-slate-700">{supplier.name}</span>
                  <span className="shrink-0 text-xs text-slate-500" dir="ltr">{supplier.phone}</span>
                </button>
              ))}
              {!suppliers.length ? <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">هنوز شیرآوری ثبت نشده است.</p> : null}
            </div>
          </div>
        </div>

        <div className="panel p-5 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-800">
            <ShoppingCart className="h-5 w-5 text-emerald-600" />
            ثبت شیر دریافت‌شده
          </h2>
          <form onSubmit={handleMilkSubmit} className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700 md:col-span-2">
              <span className="mb-2 block text-[13px] font-semibold text-slate-700">شیرآور</span>
              <select
                value={milkForm.supplierId}
                onChange={(e) => setMilkForm({ ...milkForm, supplierId: e.target.value })}
                className="field-control"
                required
              >
                <option value="">انتخاب کنید</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </label>
            <FormField label="تاریخ دریافت" type="date" name="recordDate" value={milkForm.recordDate} onChange={(e) => setMilkForm({ ...milkForm, recordDate: e.target.value })} required />
            <FormField label="مقدار به کیلوگرم" type="number" name="quantityKg" value={milkForm.quantityKg} onChange={(e) => setMilkForm({ ...milkForm, quantityKg: e.target.value })} min="0" step="0.01" required />
            <FormField label="قیمت به ازای هر کیلو" type="number" name="pricePerKg" value={milkForm.pricePerKg} onChange={(e) => setMilkForm({ ...milkForm, pricePerKg: e.target.value })} min="0" step="0.01" required />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                <span className="mb-2 block">یادداشت</span>
                <textarea value={milkForm.notes} onChange={(e) => setMilkForm({ ...milkForm, notes: e.target.value })} className="field-control resize-y" rows="3" />
              </label>
            </div>
            <button type="submit" disabled={!suppliers.length} className="btn-primary w-full md:col-span-2">ثبت رکورد شیر</button>
          </form>
        </div>
      </div>

      <div className="panel min-w-0 p-5 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-wrap gap-3">
            <label className="text-sm text-slate-600">
              <span className="mb-2 block">از تاریخ</span>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="field-control sm:w-auto" />
            </label>
            <label className="text-sm text-slate-600">
              <span className="mb-2 block">تا تاریخ</span>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="field-control sm:w-auto" />
            </label>
          </div>
          <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
            <div className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-900">کل شیر: <strong>{summary.totalKg.toFixed(2)} کیلو</strong></div>
            <div className="rounded-xl bg-amber-50 px-3 py-2 text-amber-900">هزینه: <strong>{formatCurrency(summary.totalCost)}</strong></div>
            <div className="rounded-xl bg-slate-100 px-3 py-2 text-slate-700">تعداد: <strong>{summary.count}</strong></div>
          </div>
        </div>

        <div className="mb-3 flex items-center gap-2 text-slate-700">
          <Search className="h-4 w-4 text-emerald-600" />
          سوابق شیر
        </div>
        <DataTable
          loading={loading}
          emptyMessage="هیچ رکوردی برای این بازه زمانی ثبت نشده است."
          columns={[
            { key: 'record_date', label: 'تاریخ' },
            { key: 'supplier_name', label: 'شیرآور' },
            { key: 'quantity_kg', label: 'مقدار (کیلوگرم)' },
            { key: 'price_per_kg', label: 'قیمت هر کیلو' },
            { key: 'total_cost', label: 'هزینه کل', render: (value) => formatCurrency(value) },
            { key: 'notes', label: 'یادداشت', render: (value) => value || '—' },
          ]}
          rows={milkRecords}
        />
      </div>
    </div>
  );
}
