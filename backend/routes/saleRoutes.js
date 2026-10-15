import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const from = req.query.from ? String(req.query.from).trim() : null;
    const to = req.query.to ? String(req.query.to).trim() : null;

    let query = 'SELECT * FROM sales WHERE 1 = 1';
    const params = [];

    if (from) {
      query += ' AND sale_date >= ?';
      params.push(from);
    }
    if (to) {
      query += ' AND sale_date <= ?';
      params.push(to);
    }

    query += ' ORDER BY sale_date DESC, id DESC';

    const [rows] = await pool.query(query, params);
    const total = rows.reduce((sum, row) => sum + Number(row.total_amount || 0), 0);
    return res.json({ records: rows, total, count: rows.length });
  } catch (error) {
    console.error('Get sales failed:', error.message);
    return res.status(500).json({ message: 'دریافت فروشات با خطا مواجه شد.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const description = String(req.body.description || '').trim();
    const quantity = Number(req.body.quantity);
    const totalAmount = Number(req.body.totalAmount ?? req.body.total_amount);
    const saleDate = String(req.body.saleDate || req.body.sale_date || '').trim();
    const notes = String(req.body.notes || '').trim();

    if (!description) {
      return res.status(400).json({ message: 'شرح فروش الزامی است.' });
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({ message: 'تعداد فروش باید عددی مثبت باشد.' });
    }
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({ message: 'مبلغ فروش باید عددی مثبت باشد.' });
    }
    if (!saleDate || Number.isNaN(Date.parse(saleDate))) {
      return res.status(400).json({ message: 'تاریخ فروش نامعتبر است.' });
    }

    const [result] = await pool.query(
      'INSERT INTO sales (description, quantity, total_amount, sale_date, notes) VALUES (?, ?, ?, ?, ?)',
      [description, quantity, totalAmount, saleDate, notes || null],
    );

    const [rows] = await pool.query('SELECT * FROM sales WHERE id = ?', [result.insertId]);
    return res.status(201).json({ message: 'فروش با موفقیت ثبت شد.', sale: rows[0] });
  } catch (error) {
    console.error('Create sale failed:', error.message);
    return res.status(500).json({ message: 'ثبت فروش با خطا مواجه شد.' });
  }
});

export default router;
