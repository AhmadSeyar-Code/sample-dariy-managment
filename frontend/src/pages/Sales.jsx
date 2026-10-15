import { useEffect, useState } from 'react';
import { Plus, ReceiptText } from 'lucide-react';
import { api } from '../api/axios';
import DataTable from '../components/DataTable';
import FormField from '../components/FormField';

const formatCurrency = (value) => `${new Intl.NumberFormat('fa-IR').format(Number(value || 0))} افغانی`;

export default function Sales() {
  const today = new Date().toISOString().slice(0, 10);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(today);
  const [form, setForm] = useState({ description: '', quantity: '', totalAmount: '', saleDate: today, notes: '' });

  const fetchSales = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/sales', { params: { from: fromDate || undefined, to: toDate || undefined } });
      setRecords(data.records || []);
    } catch (error) {
      console.error('Sales fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [fromDate, toDate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await api.post('/sales', {
        description: form.description,
        quantity: Number(form.quantity),
        totalAmount: Number(form.totalAmount),
        saleDate: form.saleDate,
        notes: form.notes,
      });
      setForm({ description: '', quantity: '', totalAmount: '', saleDate: today, notes: '' });
      fetchSales();
    } catch (error) {
      alert(error.response?.data?.message || 'ثبت فروش انجام نشد.');
    }
  };

  const total = records.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="panel p-5 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-800">
            <Plus className="h-5 w-5 text-emerald-600" />
            ثبت فروش جدید
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="شرح فروش" name="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            <FormField label="تعداد" type="number" name="quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} min="0" step="0.01" required />
            <FormField label="مبلغ کل فروش (افغانی)" type="number" name="totalAmount" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} min="0" step="0.01" required />
            <FormField label="تاریخ فروش" type="date" name="saleDate" value={form.saleDate} onChange={(e) => setForm({ ...form, saleDate: e.target.value })} required />
            <label className="block text-sm font-medium text-slate-700">
              <span className="mb-2 block">یادداشت</span>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="field-control resize-y" rows="3" />
            </label>
            <button type="submit" className="btn-primary w-full">ثبت فروش</button>
          </form>
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
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              مجموع فروش: <strong>{formatCurrency(total)}</strong>
            </div>
          </div>

          <div className="mb-3 flex items-center gap-2 text-slate-700">
            <ReceiptText className="h-4 w-4 text-emerald-600" />
            سوابق فروش
          </div>
          <DataTable
            loading={loading}
            emptyMessage="هیچ فروش ثبت‌شده‌ای در این بازه وجود ندارد."
            columns={[
              { key: 'sale_date', label: 'تاریخ' },
              { key: 'description', label: 'شرح' },
              { key: 'quantity', label: 'تعداد' },
              { key: 'total_amount', label: 'مبلغ کل', render: (value) => formatCurrency(value) },
              { key: 'notes', label: 'یادداشت', render: (value) => value || '—' },
            ]}
            rows={records}
          />
        </div>
      </div>
    </div>
  );
}
