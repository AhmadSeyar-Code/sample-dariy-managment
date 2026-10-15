import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { pool } from './config/db.js';
import settingsRoutes from './routes/settingsRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import milkRoutes from './routes/milkRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import productRoutes from './routes/productRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 5000);

const app = express();
const allowedFrontendOrigins = new Set(
  (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);

if (process.env.NODE_ENV !== 'production') {
  allowedFrontendOrigins.add('http://localhost:5173');
  allowedFrontendOrigins.add('http://localhost:5174');
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedFrontendOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const safeNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

async function initializeDatabase() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
    charset: 'utf8mb4',
  };

  try {
    const connection = await mysql.createConnection(config);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'dairy_management'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.end();
    console.log('Database created or already available.');
  } catch (error) {
    console.warn('MySQL is not reachable. Database initialization skipped:', error.message);
    return;
  }

  const sqlPath = path.join(__dirname, 'database.sql');
  if (fs.existsSync(sqlPath)) {
    try {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await pool.query(sql);
      console.log('Database schema is ready.');
    } catch (error) {
      console.warn('Could not execute database.sql automatically:', error.message);
    }
  }
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    return res.json({ status: 'ok', database: 'unavailable', message: 'پایگاه داده پاسخ نمی‌دهد.' });
  }
});

app.get('/api/dashboard', async (req, res) => {
  try {
    const selectedDate = String(req.query.date || new Date().toISOString().slice(0, 10)).trim();
    const [milkRows] = await pool.query(
      'SELECT SUM(quantity_kg) AS total_milk_kg, SUM(total_cost) AS total_milk_cost FROM milk_records WHERE record_date = ?',
      [selectedDate],
    );
    const [expenseRows] = await pool.query(
      'SELECT SUM(amount) AS total_expenses FROM expenses WHERE expense_date = ?',
      [selectedDate],
    );
    const [saleRows] = await pool.query(
      'SELECT SUM(total_amount) AS total_sales FROM sales WHERE sale_date = ?',
      [selectedDate],
    );

    const totalMilkKg = safeNumber(milkRows[0]?.total_milk_kg);
    const milkPurchaseCost = safeNumber(milkRows[0]?.total_milk_cost);
    const totalExpenses = safeNumber(expenseRows[0]?.total_expenses);
    const totalSales = safeNumber(saleRows[0]?.total_sales);
    const dailyResult = totalSales - milkPurchaseCost - totalExpenses;
    const profit = dailyResult > 0 ? dailyResult : 0;
    const loss = dailyResult < 0 ? Math.abs(dailyResult) : 0;

    return res.json({
      date: selectedDate,
      totalMilkKg,
      milkPurchaseCost,
      totalExpenses,
      totalSales,
      profit,
      loss,
      dailyResult,
    });
  } catch (error) {
    console.error('Dashboard generation failed:', error.message);
    return res.status(500).json({ message: 'محاسبه داشبورد با خطا مواجه شد.' });
  }
});

app.use('/api/settings', settingsRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/milk', milkRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/products', productRoutes);

app.use((err, _req, res, _next) => {
  console.error('Unhandled server error:', err.message);
  res.status(500).json({ message: 'خطایی در سرور رخ داده است.' });
});

async function startServer() {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`Dairy backend running on http://localhost:${PORT}`);
  });
}

startServer();
