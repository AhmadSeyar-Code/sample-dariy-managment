import { useEffect, useState } from 'react';
import { CircleDollarSign, Plus } from 'lucide-react';
import { api } from '../api/axios';
import DataTable from '../components/DataTable';
import FormField from '../components/FormField';

const formatCurrency = (value) => `${new Intl.NumberFormat('fa-IR').format(Number(value || 0))} افغانی`;

export default function Expenses() {
  const today = new Date().toISOString().slice(0, 10);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(today);
  const [form, setForm] = useState({ title: '', category: '', amount: '', expenseDate: today, notes: '' });

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/expenses', { params: { from: fromDate || undefined, to: toDate || undefined } });
      setRecords(data.records || []);
    } catch (error) {
      console.error('Expenses fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [fromDate, toDate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await api.post('/expenses', {
        title: form.title,
        category: form.category,
        amount: Number(form.amount),
        expenseDate: form.expenseDate,
        notes: form.notes,
      });
      setForm({ title: '', category: '', amount: '', expenseDate: today, notes: '' });
      fetchExpenses();
    } catch (error) {
      alert(error.response?.data?.message || 'ثبت هزینه انجام نشد.');
    }
  };

  const total = records.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="panel p-5 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-800">
            <Plus className="h-5 w-5 text-emerald-600" />
            ثبت مصارف
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="عنوان هزینه" name="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <FormField label="دسته‌بندی" name="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="مثلا برق، حمل‌ونقل" required />
            <FormField label="مبلغ (افغانی)" type="number" name="amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} min="0" step="0.01" required />
            <FormField label="تاریخ هزینه" type="date" name="expenseDate" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} required />
            <label className="block text-sm font-medium text-slate-700">
              <span className="mb-2 block">یادداشت</span>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="field-control resize-y" rows="3" />
            </label>
            <button type="submit" className="btn-primary w-full">ثبت هزینه</button>
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
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              مجموع مصارف: <strong>{formatCurrency(total)}</strong>
            </div>
          </div>

          <div className="mb-3 flex items-center gap-2 text-slate-700">
            <CircleDollarSign className="h-4 w-4 text-emerald-600" />
            لیست مصارف
          </div>
          <DataTable
            loading={loading}
            emptyMessage="هیچ هزینه‌ای در این بازه ثبت نشده است."
            columns={[
              { key: 'expense_date', label: 'تاریخ' },
              { key: 'title', label: 'عنوان' },
              { key: 'category', label: 'دسته‌بندی' },
              { key: 'amount', label: 'مبلغ', render: (value) => formatCurrency(value) },
              { key: 'notes', label: 'یادداشت', render: (value) => value || '—' },
            ]}
            rows={records}
          />
        </div>
      </div>
    </div>
  );
}
