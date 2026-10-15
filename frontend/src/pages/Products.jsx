import { useEffect, useState } from 'react';
import { ImagePlus, PackageOpen, Pencil, Trash2 } from 'lucide-react';
import { api, getMediaUrl } from '../api/axios';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [image, setImage] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products');
      setProducts(data);
    } catch (error) {
      console.error('Products fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', name);
      if (image) formData.append('image', image);

      await api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setName('');
      setImage(null);
      fetchProducts();
    } catch (error) {
      alert(error.response?.data?.message || 'ثبت محصول انجام نشد.');
    }
  };

  const handleEditStart = (product) => {
    setEditingProductId(product.id);
    setEditingName(product.name);
  };

  const handleEditCancel = () => {
    setEditingProductId(null);
    setEditingName('');
  };

  const handleUpdateProduct = async (productId) => {
    const trimmedName = editingName.trim();
    if (!trimmedName) {
      alert('نام محصول نمی‌تواند خالی باشد.');
      return;
    }

    try {
      await api.put(`/products/${productId}`, { name: trimmedName });
      handleEditCancel();
      fetchProducts();
    } catch (error) {
      alert(error.response?.data?.message || 'به‌روزرسانی نام محصول انجام نشد.');
    }
  };

  const handleReplaceImage = async (productId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      await api.post(`/products/${productId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchProducts();
    } catch (error) {
      alert(error.response?.data?.message || 'تغییر تصویر انجام نشد.');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('محصول حذف شود؟')) return;
    try {
      await api.delete(`/products/${productId}`);
      fetchProducts();
    } catch (error) {
      alert(error.response?.data?.message || 'حذف محصول انجام نشد.');
    }
  };

  const handleRemoveImage = async (productId) => {
    try {
      await api.delete(`/products/${productId}/image`);
      fetchProducts();
    } catch (error) {
      alert(error.response?.data?.message || 'حذف تصویر انجام نشد.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="panel p-5 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-800">
          <ImagePlus className="h-5 w-5 text-emerald-600" />
          افزودن محصول جدید
        </h2>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700">
              <span className="mb-2 block text-[13px] font-semibold text-slate-700">نام محصول</span>
              <input required value={name} onChange={(e) => setName(e.target.value)} className="field-control" placeholder="مثلا شیر خام" />
            </label>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700">
              <span className="mb-2 block text-[13px] font-semibold text-slate-700">تصویر محصول <span className="font-normal text-slate-400">(اختیاری)</span></span>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setImage(e.target.files?.[0] || null)} className="field-control file:ml-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-emerald-800" />
            </label>
          </div>
          <button type="submit" className="btn-primary">ثبت محصول</button>
        </form>
      </div>

      <div className="panel p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">فهرست محصولات</h2>
            <p className="mt-1 text-sm text-slate-500">نام و تصویر محصولات لبنیات را مدیریت کنید</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">{products.length} محصول</span>
        </div>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => <div key={item} className="h-64 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        ) : !products.length ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-5 py-12 text-center">
            <PackageOpen className="mx-auto mb-3 h-8 w-8 text-slate-400" />
            <p className="text-sm font-semibold text-slate-600">هنوز محصولی ثبت نشده است.</p>
            <p className="mt-1 text-xs text-slate-400">از فرم بالا برای افزودن اولین محصول استفاده کنید.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <div key={product.id} className="group rounded-2xl border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-slate-200/60">
                <div className="mb-3 overflow-hidden rounded-xl bg-white">
                  {product.image_path ? (
                    <img src={getMediaUrl(product.image_path)} alt={product.name} className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
                  ) : (
                    <div className="flex h-44 items-center justify-center bg-slate-100 text-slate-400">
                      <PackageOpen className="h-10 w-10" />
                    </div>
                  )}
                </div>

                {editingProductId === product.id ? (
                  <div className="mb-3 space-y-2">
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="field-control bg-white"
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => handleUpdateProduct(product.id)} className="btn-primary flex-1">ذخیره</button>
                      <button type="button" onClick={handleEditCancel} className="btn-secondary flex-1">انصراف</button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-slate-800">{product.name}</h3>
                    <button type="button" onClick={() => handleEditStart(product)} className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100">
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer rounded-xl bg-emerald-700 px-3 py-2.5 text-center text-xs font-bold text-white transition hover:bg-emerald-800">
                    تعویض تصویر
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => handleReplaceImage(product.id, e.target.files?.[0])} />
                  </label>
                  {product.image_path ? (
                    <button type="button" onClick={() => handleRemoveImage(product.id)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">حذف تصویر</button>
                  ) : null}
                  <button type="button" onClick={() => handleDeleteProduct(product.id)} className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
