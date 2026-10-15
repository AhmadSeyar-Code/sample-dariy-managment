import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const supplierId = req.query.supplierId ? Number(req.query.supplierId) : null;
    const from = req.query.from ? String(req.query.from).trim() : null;
    const to = req.query.to ? String(req.query.to).trim() : null;

    let query = `
      SELECT m.*, s.name AS supplier_name
      FROM milk_records m
      LEFT JOIN suppliers s ON s.id = m.supplier_id
      WHERE 1 = 1
    `;
    const params = [];

    if (supplierId && Number.isFinite(supplierId)) {
      query += ' AND m.supplier_id = ?';
      params.push(supplierId);
    }
    if (from) {
      query += ' AND m.record_date >= ?';
      params.push(from);
    }
    if (to) {
      query += ' AND m.record_date <= ?';
      params.push(to);
    }

    query += ' ORDER BY m.record_date DESC, m.id DESC';

    const [rows] = await pool.query(query, params);
    const totalKg = rows.reduce((sum, item) => sum + Number(item.quantity_kg || 0), 0);
    const totalCost = rows.reduce((sum, item) => sum + Number(item.total_cost || 0), 0);

    res.json({
      records: rows,
      totalKg,
      totalCost,
      count: rows.length,
    });
  } catch (error) {
    console.error('Get milk records failed:', error.message);
    res.status(500).json({ message: 'دریافت سوابق شیر با خطا مواجه شد.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const supplierId = Number(req.body.supplierId ?? req.body.supplier_id);
    const recordDate = String(req.body.recordDate || req.body.record_date || '').trim();
    const quantityKg = Number(req.body.quantityKg ?? req.body.quantity_kg);
    const pricePerKg = Number(req.body.pricePerKg ?? req.body.price_per_kg);
    const notes = String(req.body.notes || '').trim();

    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      return res.status(400).json({ message: 'انتخاب شیرآور الزامی است.' });
    }
    if (!recordDate || Number.isNaN(Date.parse(recordDate))) {
      return res.status(400).json({ message: 'تاریخ دریافت شیر نامعتبر است.' });
    }
    if (!Number.isFinite(quantityKg) || quantityKg <= 0) {
      return res.status(400).json({ message: 'مقدار شیر باید عددی مثبت باشد.' });
    }
    if (!Number.isFinite(pricePerKg) || pricePerKg <= 0) {
      return res.status(400).json({ message: 'قیمت هر کیلوگرم باید عددی مثبت باشد.' });
    }

    const totalCost = quantityKg * pricePerKg;

    const [result] = await pool.query(
      'INSERT INTO milk_records (supplier_id, record_date, quantity_kg, price_per_kg, total_cost, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [supplierId, recordDate, quantityKg, pricePerKg, totalCost, notes || null],
    );

    const [rows] = await pool.query('SELECT m.*, s.name AS supplier_name FROM milk_records m LEFT JOIN suppliers s ON s.id = m.supplier_id WHERE m.id = ?', [result.insertId]);
    return res.status(201).json({ message: 'رکورد شیر با موفقیت ثبت شد.', record: rows[0] });
  } catch (error) {
    console.error('Create milk record failed:', error.message);
    return res.status(500).json({ message: 'ثبت رکورد شیر با خطا مواجه شد.' });
  }
});

export default router;
