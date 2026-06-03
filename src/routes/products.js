// const express = require('express');
// const router = express.Router();
// const pool = require('../config/db');
// const { authMiddleware } = require('../middleware/auth');

// // GET /api/products - Public: get all active products
// router.get('/', async (req, res) => {
//   try {
//     const { network, type } = req.query;
//     let query = 'SELECT * FROM products WHERE is_active = true';
//     const params = [];

//     if (network) {
//       params.push(network.toLowerCase());
//       query += ` AND LOWER(network) = $${params.length}`;
//     }
//     if (type) {
//       params.push(type);
//       query += ` AND product_type = $${params.length}`;
//     }

//     query += ' ORDER BY sort_order ASC, price ASC';

//     const result = await pool.query(query, params);
//     res.json({ success: true, data: result.rows });
//   } catch (err) {
//     console.error('Get products error:', err);
//     res.status(500).json({ success: false, message: 'Failed to fetch products' });
//   }
// });

// // GET /api/products/admin - Admin: get all products
// router.get('/admin', authMiddleware, async (req, res) => {
//   try {
//     const result = await pool.query('SELECT * FROM products ORDER BY product_type, network, sort_order ASC, price ASC');
//     res.json({ success: true, data: result.rows });
//   } catch (err) {
//     res.status(500).json({ success: false, message: 'Failed to fetch products' });
//   }
// });

// // POST /api/products - Admin: create product
// router.post('/', authMiddleware, async (req, res) => {
//   try {
//     const { product_type, network, name, description, size, price, duration, moolre_enabled, sort_order } = req.body;

//     if (!product_type || !network || !name || !price) {
//       return res.status(400).json({ success: false, message: 'product_type, network, name, and price are required' });
//     }

//     const result = await pool.query(
//       `INSERT INTO products (product_type, network, name, description, size, price, duration, moolre_enabled, sort_order)
//        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
//       [product_type, network, name, description, size, price, duration, moolre_enabled ?? true, sort_order ?? 0]
//     );

//     res.status(201).json({ success: true, data: result.rows[0] });
//   } catch (err) {
//     res.status(500).json({ success: false, message: 'Failed to create product' });
//   }
// });

// // PATCH /api/products/:id - Admin: update product
// router.patch('/:id', authMiddleware, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, description, size, price, duration, is_active, moolre_enabled, sort_order } = req.body;

//     const result = await pool.query(
//       `UPDATE products SET
//         name = COALESCE($1, name),
//         description = COALESCE($2, description),
//         size = COALESCE($3, size),
//         price = COALESCE($4, price),
//         duration = COALESCE($5, duration),
//         is_active = COALESCE($6, is_active),
//         moolre_enabled = COALESCE($7, moolre_enabled),
//         sort_order = COALESCE($8, sort_order),
//         updated_at = NOW()
//        WHERE id = $9 RETURNING *`,
//       [name, description, size, price, duration, is_active, moolre_enabled, sort_order, id]
//     );

//     if (!result.rows.length) {
//       return res.status(404).json({ success: false, message: 'Product not found' });
//     }

//     res.json({ success: true, data: result.rows[0] });
//   } catch (err) {
//     res.status(500).json({ success: false, message: 'Failed to update product' });
//   }
// });

// // DELETE /api/products/:id - Admin: delete product
// router.delete('/:id', authMiddleware, async (req, res) => {
//   try {
//     const { id } = req.params;
//     await pool.query('DELETE FROM products WHERE id = $1', [id]);
//     res.json({ success: true, message: 'Product deleted' });
//   } catch (err) {
//     res.status(500).json({ success: false, message: 'Failed to delete product' });
//   }
// });

// module.exports = router;
const express = require('express');
const router = express.Router();

const Product = require('../models/Product');
const { authMiddleware } = require('../middleware/auth');


// ========================
// GET PRODUCTS (PUBLIC)
// ========================
router.get('/', async (req, res) => {
  try {
    const { network, type } = req.query;

    const filter = { is_active: true };

    if (network) {
      filter.network = network.toLowerCase();
    }

    if (type) {
      filter.product_type = type;
    }

    const products = await Product.find(filter).sort({
      sort_order: 1,
      price: 1
    });

    res.json({
      success: true,
      data: products
    });

  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
});


// ========================
// GET PRODUCTS (ADMIN)
// ========================
router.get('/admin', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find().sort({
      product_type: 1,
      network: 1,
      sort_order: 1,
      price: 1
    });

    res.json({
      success: true,
      data: products
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
});


// ========================
// CREATE PRODUCT
// ========================
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      product_type,
      network,
      name,
      description,
      size,
      price,
      duration,
      moolre_enabled,
      sort_order
    } = req.body;

    if (!product_type || !network || !name || !price) {
      return res.status(400).json({
        success: false,
        message: 'product_type, network, name, and price are required'
      });
    }

    const product = await Product.create({
      product_type,
      network,
      name,
      description,
      size,
      price,
      duration,
      moolre_enabled: moolre_enabled ?? true,
      sort_order: sort_order ?? 0,
      is_active: true
    });

    res.status(201).json({
      success: true,
      data: product
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
});


// ========================
// UPDATE PRODUCT
// ========================
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Product.findByIdAndUpdate(
      id,
      {
        $set: {
          ...req.body,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: updated
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Failed to update product'
    });
  }
});


// ========================
// DELETE PRODUCT
// ========================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
});

module.exports = router;