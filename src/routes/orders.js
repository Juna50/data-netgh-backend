// const express = require('express');
// const router = express.Router();
// const pool = require('../config/db');
// const { authMiddleware } = require('../middleware/auth');
// const moolreService = require('../services/moolre');
// const { v4: uuidv4 } = require('uuid');

// // Generate order number
// const generateOrderNumber = () => {
//   const timestamp = Date.now().toString(36).toUpperCase();
//   const random = Math.random().toString(36).substring(2, 6).toUpperCase();
//   return `NG${timestamp}${random}`;
// };

// // POST /api/orders - Public: create order & initiate payment
// router.post('/', async (req, res) => {
//   const client = await pool.connect();
//   try {
//     await client.query('BEGIN');

//     const { product_id, recipient_number, payment_number, payment_network, customer_email } = req.body;

//     if (!product_id || !recipient_number || !payment_number || !payment_network) {
//       return res.status(400).json({ success: false, message: 'Missing required fields' });
//     }

//     // Validate Ghana phone numbers
//     const ghPhoneRegex = /^0[0-9]{9}$/;
//     if (!ghPhoneRegex.test(recipient_number)) {
//       return res.status(400).json({ success: false, message: 'Invalid recipient phone number format' });
//     }
//     if (!ghPhoneRegex.test(payment_number)) {
//       return res.status(400).json({ success: false, message: 'Invalid payment phone number format' });
//     }

//     // Fetch product
//     const productResult = await client.query(
//       'SELECT * FROM products WHERE id = $1 AND is_active = true',
//       [product_id]
//     );
//     if (!productResult.rows.length) {
//       await client.query('ROLLBACK');
//       return res.status(404).json({ success: false, message: 'Product not found or unavailable' });
//     }

//     const product = productResult.rows[0];
//     const orderNumber = generateOrderNumber();

//     // Create order
//     const orderResult = await client.query(
//       `INSERT INTO orders (order_number, product_id, product_snapshot, recipient_number, payment_number, payment_network, amount, customer_email, ip_address)
//        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
//       [
//         orderNumber,
//         product.id,
//         JSON.stringify(product),
//         recipient_number,
//         payment_number,
//         payment_network.toUpperCase(),
//         product.price,
//         customer_email || null,
//         req.ip,
//       ]
//     );

//     const order = orderResult.rows[0];

//     // Initiate payment via Moolre
//     const paymentResult = await moolreService.initiatePayment({
//       amount: product.price,
//       phone: payment_number,
//       network: payment_network,
//       reference: order.id,
//       orderNumber,
//       description: `Payment for ${product.name} - NetGH`,
//     });

//     if (!paymentResult.success) {
//       await client.query('ROLLBACK');
//       return res.status(402).json({ success: false, message: paymentResult.message || 'Payment initiation failed' });
//     }

//     // Update order with payment reference
//     await client.query(
//       'UPDATE orders SET payment_reference = $1, payment_status = $2 WHERE id = $3',
//       [paymentResult.reference, 'initiated', order.id]
//     );

//     // Log transaction
//     await client.query(
//       `INSERT INTO transactions (order_id, type, amount, gateway, gateway_reference, status, gateway_response)
//        VALUES ($1, 'payment', $2, 'moolre', $3, 'initiated', $4)`,
//       [order.id, product.price, paymentResult.reference, JSON.stringify(paymentResult)]
//     );

//     await client.query('COMMIT');

//     res.status(201).json({
//       success: true,
//       data: {
//         order_id: order.id,
//         order_number: orderNumber,
//         amount: product.price,
//         payment_reference: paymentResult.reference,
//         message: paymentResult.message || 'Payment prompt sent. Please approve on your phone.',
//         status: 'pending',
//       }
//     });
//   } catch (err) {
//     await client.query('ROLLBACK');
//     console.error('Create order error:', err);
//     res.status(500).json({ success: false, message: 'Failed to create order. Please try again.' });
//   } finally {
//     client.release();
//   }
// });

// // GET /api/orders/:id/status - Public: check order status
// router.get('/:id/status', async (req, res) => {
//   try {
//     const result = await pool.query(
//       `SELECT o.id, o.order_number, o.status, o.payment_status, o.delivery_status, o.amount,
//               o.recipient_number, o.created_at, p.name as product_name, p.network, p.size
//        FROM orders o
//        LEFT JOIN products p ON o.product_id = p.id
//        WHERE o.id = $1 OR o.order_number = $1`,
//       [req.params.id]
//     );

//     if (!result.rows.length) {
//       return res.status(404).json({ success: false, message: 'Order not found' });
//     }

//     res.json({ success: true, data: result.rows[0] });
//   } catch (err) {
//     res.status(500).json({ success: false, message: 'Failed to fetch order status' });
//   }
// });

// // POST /api/orders/callback - Payment gateway callback (Moolre webhook)
// router.post('/callback', async (req, res) => {
//   const client = await pool.connect();
//   try {
//     await client.query('BEGIN');
//     console.log('Payment callback received:', JSON.stringify(req.body));

//     const { reference, status, transaction_id } = req.body;

//     // Find order by payment_reference or id
//     const orderResult = await client.query(
//       'SELECT * FROM orders WHERE payment_reference = $1 OR id = $1',
//       [reference]
//     );

//     if (!orderResult.rows.length) {
//       await client.query('ROLLBACK');
//       return res.status(404).json({ message: 'Order not found' });
//     }

//     const order = orderResult.rows[0];

//     if (status === 'success' || status === 'completed') {
//       // Update order payment status
//       await client.query(
//         `UPDATE orders SET payment_status = 'completed', status = 'processing', updated_at = NOW() WHERE id = $1`,
//         [order.id]
//       );

//       // Update transaction
//       await client.query(
//         `UPDATE transactions SET status = 'completed', gateway_reference = $1, gateway_response = $2
//          WHERE order_id = $3 AND type = 'payment'`,
//         [transaction_id || reference, JSON.stringify(req.body), order.id]
//       );

//       // Trigger delivery for data bundles
//       const product = order.product_snapshot;
//       if (product.product_type === 'data_bundle') {
//         const deliveryResult = await moolreService.deliverData({
//           network: product.network,
//           phone: order.recipient_number,
//           size: product.size,
//           orderId: order.id,
//           orderNumber: order.order_number,
//         });

//         const deliveryStatus = deliveryResult.success ? 'completed' : 'failed';
//         const finalStatus = deliveryResult.success ? 'completed' : 'failed';

//         await client.query(
//           `UPDATE orders SET delivery_status = $1, delivery_reference = $2, delivery_response = $3, status = $4, updated_at = NOW() WHERE id = $5`,
//           [deliveryStatus, deliveryResult.reference, JSON.stringify(deliveryResult), finalStatus, order.id]
//         );
//       }
//     } else if (status === 'failed' || status === 'cancelled') {
//       await client.query(
//         `UPDATE orders SET payment_status = $1, status = $2, updated_at = NOW() WHERE id = $3`,
//         [status, status, order.id]
//       );
//       await client.query(
//         `UPDATE transactions SET status = $1, gateway_response = $2 WHERE order_id = $3 AND type = 'payment'`,
//         [status, JSON.stringify(req.body), order.id]
//       );
//     }

//     await client.query('COMMIT');
//     res.json({ success: true });
//   } catch (err) {
//     await client.query('ROLLBACK');
//     console.error('Callback error:', err);
//     res.status(500).json({ success: false });
//   } finally {
//     client.release();
//   }
// });

// // GET /api/orders - Admin: list all orders
// router.get('/', authMiddleware, async (req, res) => {
//   try {
//     const { page = 1, limit = 20, status, network, search } = req.query;
//     const offset = (page - 1) * limit;

//     let query = `
//       SELECT o.*, p.name as product_name, p.network as product_network
//       FROM orders o
//       LEFT JOIN products p ON o.product_id = p.id
//       WHERE 1=1
//     `;
//     const params = [];

//     if (status) {
//       params.push(status);
//       query += ` AND o.status = $${params.length}`;
//     }
//     if (search) {
//       params.push(`%${search}%`);
//       query += ` AND (o.order_number ILIKE $${params.length} OR o.recipient_number ILIKE $${params.length} OR o.payment_number ILIKE $${params.length})`;
//     }

//     const countResult = await pool.query(query.replace('SELECT o.*, p.name as product_name, p.network as product_network', 'SELECT COUNT(*)'), params);
//     const total = parseInt(countResult.rows[0].count);

//     params.push(limit, offset);
//     query += ` ORDER BY o.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

//     const result = await pool.query(query, params);

//     res.json({
//       success: true,
//       data: result.rows,
//       pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
//     });
//   } catch (err) {
//     console.error('List orders error:', err);
//     res.status(500).json({ success: false, message: 'Failed to fetch orders' });
//   }
// });

// // PATCH /api/orders/:id - Admin: update order status
// router.patch('/:id', authMiddleware, async (req, res) => {
//   try {
//     const { status, notes } = req.body;
//     const result = await pool.query(
//       `UPDATE orders SET status = COALESCE($1, status), notes = COALESCE($2, notes), updated_at = NOW()
//        WHERE id = $3 RETURNING *`,
//       [status, notes, req.params.id]
//     );
//     if (!result.rows.length) return res.status(404).json({ success: false, message: 'Order not found' });
//     res.json({ success: true, data: result.rows[0] });
//   } catch (err) {
//     res.status(500).json({ success: false, message: 'Failed to update order' });
//   }
// });

// module.exports = router;
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Order = require("../models/Order");
const Product = require("../models/Product");
const Transaction = require("../models/Transaction");
const { authMiddleware } = require("../middleware/auth");
const moolreService = require("../services/moolre");

// Generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `NG${timestamp}${random}`;
};

// ========================
// CREATE ORDER + PAYMENT
// ========================
router.post("/", async (req, res) => {
  const session = await mongoose.startSession();
   console.log("ORDER BODY:", req.body);
  try {
    session.startTransaction();

    const {
      product_id,
      recipient_number,
      payment_number,
      payment_network,
      customer_email,
    } = req.body;
     if (
      !product_id ||
      !recipient_number ||
      !payment_number ||
      !payment_network
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Validate Ghana numbers
    const ghPhoneRegex = /^0[0-9]{9}$/;

    if (
      !ghPhoneRegex.test(recipient_number) ||
      !ghPhoneRegex.test(payment_number)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format",
      });
    }

    // Get product
    const product = await Product.findById(product_id).session(session);

    if (!product || !product.is_active) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Product not found or unavailable",
      });
    }

    const orderNumber = generateOrderNumber();

    // Create order
    const order = await Order.create(
      [
        {
          order_number: orderNumber,
          product_id: product._id,
          product_snapshot: product.toObject(),
          recipient_number,
          payment_number,
          payment_network: payment_network.toUpperCase(),
          amount: product.price,
          customer_email: customer_email || null,
          ip_address: req.ip,
          status: "pending",
          payment_status: "pending",
          delivery_status: "pending",
        },
      ],
      { session },
    );

    const createdOrder = order[0];

    // Initiate payment
    const paymentResult = await moolreService.initiatePayment({
      amount: product.price,
      phone: payment_number,
      network: payment_network,
      reference: createdOrder._id.toString(),
      orderNumber,
      description: `Payment for ${product.name} - NetGH`,
    });

    if (!paymentResult.success) {
      await session.abortTransaction();
      return res.status(402).json({
        success: false,
        message: paymentResult.message || "Payment initiation failed",
      });
    }

    // Update order
    createdOrder.payment_reference = paymentResult.reference;
    createdOrder.payment_status = "initiated";
    await createdOrder.save({ session });

    // Transaction log
    await Transaction.create(
      [
        {
          order_id: createdOrder._id,
          type: "payment",
          amount: product.price,
          gateway: "moolre",
          gateway_reference: paymentResult.reference,
          status: "initiated",
          gateway_response: paymentResult,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      data: {
        order_id: createdOrder._id,
        order_number: orderNumber,
        amount: product.price,
        payment_reference: paymentResult.reference,
        message: paymentResult.message || "Payment prompt sent",
        status: "pending",
      },
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("Create order error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  }
});

// ========================
// ORDER STATUS
// ========================
// router.get("/:id/status", async (req, res) => {
//   try {
//     const order = await Order.findOne({
//       $or: [{ _id: req.params.id }, { order_number: req.params.id }],
//     }).populate("product_id");

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found",
//       });
//     }

//     res.json({
//       success: true,
//       data: order,
//     });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch order",
//     });
//   }
// });
const mongoose = require("mongoose");

router.get("/:id/status", async (req, res) => {
  try {
    const search = req.params.id;

    let query;

    if (mongoose.Types.ObjectId.isValid(search)) {
      query = {
        $or: [
          { _id: search },
          { order_number: search }
        ]
      };
    } else {
      query = {
        order_number: search
      };
    }

    const order = await Order.findOne(query)
      .populate("product_id");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      data: order,
    });

  } catch (err) {
    console.error("Order status error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
    });
  }
});
// ========================
// PAYMENT CALLBACK
// ========================
router.post("/callback", async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { reference, status, transaction_id } = req.body;

    const order = await Order.findOne({
      $or: [{ payment_reference: reference }, { _id: reference }],
    }).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Order not found" });
    }

    if (status === "success" || status === "completed") {
      order.payment_status = "completed";
      order.status = "processing";
      await order.save({ session });

      await Transaction.updateOne(
        { order_id: order._id, type: "payment" },
        {
          status: "completed",
          gateway_reference: transaction_id || reference,
          gateway_response: req.body,
        },
        { session },
      );

      // Delivery
      const product = order.product_snapshot;

      if (product.product_type === "data_bundle") {
        const deliveryResult = await moolreService.deliverData({
          network: product.network,
          phone: order.recipient_number,
          size: product.size,
          orderId: order._id,
          orderNumber: order.order_number,
        });

        order.delivery_status = deliveryResult.success ? "completed" : "failed";
        order.status = deliveryResult.success ? "completed" : "failed";
        order.delivery_reference = deliveryResult.reference;
        order.delivery_response = deliveryResult;

        await order.save({ session });
      }
    } else {
      order.payment_status = status;
      order.status = status;
      await order.save({ session });

      await Transaction.updateOne(
        { order_id: order._id, type: "payment" },
        {
          status,
          gateway_response: req.body,
        },
        { session },
      );
    }

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("Callback error:", err);
    res.status(500).json({ success: false });
  }
});

// ========================
// ADMIN ORDERS LIST
// ========================
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { order_number: { $regex: search, $options: "i" } },
        { recipient_number: { $regex: search, $options: "i" } },
        { payment_number: { $regex: search, $options: "i" } },
      ];
    }

    const orders = await Order.find(filter)
      .populate("product_id")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
});

// ========================
// UPDATE ORDER (ADMIN)
// ========================
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...req.body,
          updatedAt: new Date(),
        },
      },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update order",
    });
  }
});

module.exports = router;
