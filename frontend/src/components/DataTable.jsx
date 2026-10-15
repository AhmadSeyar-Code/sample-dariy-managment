export default function DataTable({ columns, rows, loading, emptyMessage }) {
  if (loading) {
    return (
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5" aria-live="polite">
        <div className="h-9 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-11 animate-pulse rounded-lg bg-slate-50" />
        <div className="h-11 animate-pulse rounded-lg bg-slate-50" />
        <span className="sr-only">در حال بارگذاری...</span>
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-5 py-12 text-center">
        <p className="text-sm font-semibold text-slate-600">{emptyMessage}</p>
        <p className="mt-1 text-xs text-slate-400">با ثبت مورد جدید، اطلاعات در این فهرست نمایش داده می‌شود.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/80">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-right text-xs text-slate-500">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className="whitespace-nowrap px-4 py-3.5 font-bold">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.id || rowIndex} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
              {columns.map((column) => (
                <td key={`${row.id || rowIndex}-${column.key}`} className="whitespace-nowrap px-4 py-3.5 align-middle text-slate-700">
                  {column.render ? column.render(row[column.key], row) : row[column.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
