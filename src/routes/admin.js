const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { authMiddleware, superAdminOnly } = require('../middleware/auth');

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const result = await pool.query(
      'SELECT * FROM admins WHERE email = $1 AND is_active = true',
      [email.toLowerCase()]
    );

    if (!result.rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const admin = result.rows[0];
    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role }
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// GET /api/admin/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({ success: true, data: req.admin });
});

// GET /api/admin/dashboard - stats
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const [ordersStats, revenueStats, recentOrders] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) as total_orders,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
          COUNT(*) FILTER (WHERE status = 'failed') as failed_orders,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as orders_today
        FROM orders
      `),
      pool.query(`
        SELECT
          COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as total_revenue,
          COALESCE(SUM(amount) FILTER (WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '24 hours'), 0) as revenue_today,
          COALESCE(SUM(amount) FILTER (WHERE status = 'completed' AND created_at >= DATE_TRUNC('month', NOW())), 0) as revenue_this_month
        FROM orders
      `),
      pool.query(`
        SELECT o.order_number, o.status, o.amount, o.created_at,
               p.name as product_name, p.network
        FROM orders o LEFT JOIN products p ON o.product_id = p.id
        ORDER BY o.created_at DESC LIMIT 10
      `)
    ]);

    res.json({
      success: true,
      data: {
        stats: { ...ordersStats.rows[0], ...revenueStats.rows[0] },
        recent_orders: recentOrders.rows
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, message: 'Failed to load dashboard' });
  }
});

// POST /api/admin/create-admin - Super admin only
router.post('/create-admin', authMiddleware, superAdminOnly, async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'Email, password, and name are required' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO admins (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
      [email.toLowerCase(), passwordHash, name, role || 'sub_admin']
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }
    res.status(500).json({ success: false, message: 'Failed to create admin' });
  }
});

// GET/PATCH /api/admin/settings - App settings
router.get('/settings', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM app_settings ORDER BY key');
    const settings = {};
    result.rows.forEach(r => { settings[r.key] = r.value; });
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
});

router.patch('/settings', authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await pool.query(
        `INSERT INTO app_settings (key, value, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, String(value)]
      );
    }
    res.json({ success: true, message: 'Settings updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
});

module.exports = router;
