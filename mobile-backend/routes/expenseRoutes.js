import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const from = req.query.from ? String(req.query.from).trim() : null;
    const to = req.query.to ? String(req.query.to).trim() : null;

    let query = 'SELECT * FROM expenses WHERE 1 = 1';
    const params = [];

    if (from) {
      query += ' AND expense_date >= ?';
      params.push(from);
    }
    if (to) {
      query += ' AND expense_date <= ?';
      params.push(to);
    }

    query += ' ORDER BY expense_date DESC, id DESC';

    const [rows] = await pool.query(query, params);
    const total = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);

    return res.json({ records: rows, total, count: rows.length });
  } catch (error) {
    console.error('Get expenses failed:', error.message);
    return res.status(500).json({ message: 'دریافت مصارف با خطا مواجه شد.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    const category = String(req.body.category || '').trim();
    const amount = Number(req.body.amount);
    const expenseDate = String(req.body.expenseDate || req.body.expense_date || '').trim();
    const notes = String(req.body.notes || '').trim();

    if (!title) {
      return res.status(400).json({ message: 'عنوان هزینه الزامی است.' });
    }
    if (!category) {
      return res.status(400).json({ message: 'دسته‌بندی هزینه الزامی است.' });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'مبلغ هزینه باید عددی مثبت باشد.' });
    }
    if (!expenseDate || Number.isNaN(Date.parse(expenseDate))) {
      return res.status(400).json({ message: 'تاریخ هزینه نامعتبر است.' });
    }

    const [result] = await pool.query(
      'INSERT INTO expenses (title, category, amount, expense_date, notes) VALUES (?, ?, ?, ?, ?)',
      [title, category, amount, expenseDate, notes || null],
    );

    const [rows] = await pool.query('SELECT * FROM expenses WHERE id = ?', [result.insertId]);
    return res.status(201).json({ message: 'هزینه با موفقیت ثبت شد.', expense: rows[0] });
  } catch (error) {
    console.error('Create expense failed:', error.message);
    return res.status(500).json({ message: 'ثبت هزینه با خطا مواجه شد.' });
  }
});

export default router;
