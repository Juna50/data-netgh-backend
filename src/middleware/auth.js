// const jwt = require('jsonwebtoken');
// const pool = require('../config/db');

// const authMiddleware = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(401).json({ success: false, message: 'Unauthorized. No token provided.' });
//     }

//     const token = authHeader.split(' ')[1];
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     const result = await pool.query(
//       'SELECT id, email, name, role, is_active FROM admins WHERE id = $1',
//       [decoded.id]
//     );

//     if (!result.rows.length || !result.rows[0].is_active) {
//       return res.status(401).json({ success: false, message: 'Unauthorized. Account not found or inactive.' });
//     }

//     req.admin = result.rows[0];
//     next();
//   } catch (err) {
//     if (err.name === 'TokenExpiredError') {
//       return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
//     }
//     return res.status(401).json({ success: false, message: 'Unauthorized. Invalid token.' });
//   }
// };

// const superAdminOnly = (req, res, next) => {
//   if (req.admin.role !== 'admin') {
//     return res.status(403).json({ success: false, message: 'Forbidden. Super admin access required.' });
//   }
//   next();
// };

// module.exports = { authMiddleware, superAdminOnly };
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ MongoDB replacement for SQL query
    const admin = await Admin.findById(decoded.id).select(
      'email name role is_active'
    );

    if (!admin || !admin.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Account not found or inactive.'
      });
    }

    req.admin = {
      id: admin._id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      is_active: admin.is_active
    };

    next();

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Invalid token.'
    });
  }
};

// SUPER ADMIN CHECK
const superAdminOnly = (req, res, next) => {
  if (req.admin.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Super admin access required.'
    });
  }
  next();
};

module.exports = { authMiddleware, superAdminOnly };