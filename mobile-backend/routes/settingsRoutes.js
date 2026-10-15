import express from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads', 'logos');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `logo-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('فقط پرونده‌های تصویری JPEG، PNG و WebP مجاز هستند.'));
    }
    cb(null, true);
  },
});

const router = express.Router();

const defaultLogoPath = '/uploads/logos/default-dairy-logo.svg';

async function getSettingsRow() {
  const [rows] = await pool.query('SELECT * FROM dairy_settings ORDER BY id ASC LIMIT 1');
  if (!rows.length) {
    const insertResult = await pool.query(
      'INSERT INTO dairy_settings (dairy_name, phone, address, logo_path) VALUES (?, ?, ?, ?)',
      ['لبنیات افغان', '0700000000', 'کابل، افغانستان', defaultLogoPath],
    );
    const [newRows] = await pool.query('SELECT * FROM dairy_settings WHERE id = ?', [insertResult[0].insertId]);
    return newRows[0];
  }
  return rows[0];
}

async function removeFileIfNeeded(filePath) {
  if (!filePath || filePath === defaultLogoPath) return;
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
    const settings = await getSettingsRow();
    res.json(settings || { dairy_name: 'لبنیات افغان', phone: '', address: '', logo_path: defaultLogoPath });
  } catch (error) {
    console.error('Get settings failed:', error.message);
    res.status(500).json({ message: 'دریافت تنظیمات لبنیات با خطا مواجه شد.' });
  }
});

router.put('/', async (req, res) => {
  try {
    const dairyName = String(req.body.dairyName || req.body.dairy_name || '').trim();
    const phone = String(req.body.phone || '').trim();
    const address = String(req.body.address || '').trim();

    if (!dairyName) {
      return res.status(400).json({ message: 'نام لبنیات الزامی است.' });
    }

    const settings = await getSettingsRow();
    const [result] = await pool.query(
      'UPDATE dairy_settings SET dairy_name = ?, phone = ?, address = ?, updated_at = NOW() WHERE id = ?',
      [dairyName, phone || null, address || null, settings.id],
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'تنظیمات لبنیات یافت نشد.' });
    }

    const [rows] = await pool.query('SELECT * FROM dairy_settings WHERE id = ?', [settings.id]);
    return res.json(rows[0]);
  } catch (error) {
    console.error('Update settings failed:', error.message);
    return res.status(500).json({ message: 'ذخیره تنظیمات لبنیات با خطا مواجه شد.' });
  }
});

router.post('/logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'پرونده لوگو ارسال نشده است.' });
    }

    const settings = await getSettingsRow();
    const newLogoPath = `/uploads/logos/${req.file.filename}`;

    await removeFileIfNeeded(settings.logo_path);

    await pool.query('UPDATE dairy_settings SET logo_path = ?, updated_at = NOW() WHERE id = ?', [newLogoPath, settings.id]);
    return res.json({ message: 'لوگو با موفقیت ذخیره شد.', logoPath: newLogoPath });
  } catch (error) {
    console.error('Upload logo failed:', error.message);
    return res.status(500).json({ message: 'آپلود لوگو با خطا مواجه شد.' });
  }
});

router.delete('/logo', async (_req, res) => {
  try {
    const settings = await getSettingsRow();
    await removeFileIfNeeded(settings.logo_path);
    await pool.query('UPDATE dairy_settings SET logo_path = ?, updated_at = NOW() WHERE id = ?', [defaultLogoPath, settings.id]);
    return res.json({ message: 'لوگو به پیش‌فرض بازگشت.', logoPath: defaultLogoPath });
  } catch (error) {
    console.error('Delete logo failed:', error.message);
    return res.status(500).json({ message: 'حذف لوگو با خطا مواجه شد.' });
  }
});

export default router;
