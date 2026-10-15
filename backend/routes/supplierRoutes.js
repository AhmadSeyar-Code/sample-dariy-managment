import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM suppliers ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Get suppliers failed:', error.message);
    res.status(500).json({ message: 'دریافت لیست شیرآوران با خطا مواجه شد.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const phone = String(req.body.phone || '').trim();

    if (!name) {
      return res.status(400).json({ message: 'نام شیرآور الزامی است.' });
    }
    if (!phone) {
      return res.status(400).json({ message: 'شماره همراه شیرآور الزامی است.' });
    }

    const [result] = await pool.query('INSERT INTO suppliers (name, phone) VALUES (?, ?)', [name, phone]);
    const [rows] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [result.insertId]);

    return res.status(201).json({ message: 'شیرآور با موفقیت ثبت شد.', supplier: rows[0] });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'این شماره تماس قبلا ثبت شده است.' });
    }

    console.error('Create supplier failed:', error.message);
    return res.status(500).json({ message: 'ثبت شیرآور با خطا مواجه شد.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'شناسه شیرآور نامعتبر است.' });
    }

    const [rows] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'شیرآور یافت نشد.' });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error('Get supplier failed:', error.message);
    return res.status(500).json({ message: 'دریافت اطلاعات شیرآور با خطا مواجه شد.' });
  }
});

export default router;
