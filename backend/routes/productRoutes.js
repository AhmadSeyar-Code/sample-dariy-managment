import express from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads', 'products');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `product-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('فقط تصویرهای JPEG، PNG و WebP مجاز هستند.'));
    }
    cb(null, true);
  },
});

const router = express.Router();

async function removeFileIfNeeded(filePath) {
  if (!filePath) return;
  const fullPath = path.join(__dirname, '..', filePath.replace(/^\//, ''));
  try {
    await fs.access(fullPath);
    await fs.unlink(fullPath);
  } catch {
    // Ignore missing files.
  }
}

router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Get products failed:', error.message);
    res.status(500).json({ message: 'دریافت محصولات با خطا مواجه شد.' });
  }
});

router.post('/', upload.single('image'), async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) {
      return res.status(400).json({ message: 'نام محصول الزامی است.' });
    }

    const imagePath = req.file ? `/uploads/products/${req.file.filename}` : null;
    const [result] = await pool.query('INSERT INTO products (name, image_path) VALUES (?, ?)', [name, imagePath]);
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    return res.status(201).json({ message: 'محصول با موفقیت ثبت شد.', product: rows[0] });
  } catch (error) {
    console.error('Create product failed:', error.message);
    return res.status(500).json({ message: 'ثبت محصول با خطا مواجه شد.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'شناسه محصول نامعتبر است.' });
    }

    const name = String(req.body.name || '').trim();
    if (!name) {
      return res.status(400).json({ message: 'نام محصول الزامی است.' });
    }

    const [result] = await pool.query('UPDATE products SET name = ? WHERE id = ?', [name, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'محصول یافت نشد.' });
    }

    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    return res.json({ message: 'نام محصول با موفقیت به‌روزرسانی شد.', product: rows[0] });
  } catch (error) {
    console.error('Update product failed:', error.message);
    return res.status(500).json({ message: 'به‌روزرسانی نام محصول با خطا مواجه شد.' });
  }
});

router.post('/:id/image', upload.single('image'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'شناسه محصول نامعتبر است.' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'تصویر جدید ارسال نشده است.' });
    }

    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'محصول یافت نشد.' });
    }

    const newPath = `/uploads/products/${req.file.filename}`;
    await removeFileIfNeeded(rows[0].image_path);
    await pool.query('UPDATE products SET image_path = ? WHERE id = ?', [newPath, id]);

    return res.json({ message: 'تصویر محصول با موفقیت آپدیت شد.', imagePath: newPath });
  } catch (error) {
    console.error('Update product image failed:', error.message);
    return res.status(500).json({ message: 'آپدیت تصویر محصول با خطا مواجه شد.' });
  }
});

router.delete('/:id/image', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'شناسه محصول نامعتبر است.' });
    }

    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'محصول یافت نشد.' });
    }

    await removeFileIfNeeded(rows[0].image_path);
    await pool.query('UPDATE products SET image_path = NULL WHERE id = ?', [id]);
    return res.json({ message: 'تصویر محصول حذف شد.' });
  } catch (error) {
    console.error('Delete product image failed:', error.message);
    return res.status(500).json({ message: 'حذف تصویر محصول با خطا مواجه شد.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'شناسه محصول نامعتبر است.' });
    }

    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'محصول یافت نشد.' });
    }

    await removeFileIfNeeded(rows[0].image_path);
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    return res.json({ message: 'محصول با موفقیت حذف شد.' });
  } catch (error) {
    console.error('Delete product failed:', error.message);
    return res.status(500).json({ message: 'حذف محصول با خطا مواجه شد.' });
  }
});

export default router;
