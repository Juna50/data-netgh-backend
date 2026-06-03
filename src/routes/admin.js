// const express = require('express');
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Models
const Admin = require("../models/Admin");
const Order = require("../models/Order");
const Product = require("../models/Product");
const AppSetting = require("../models/AppSetting");

// AUTH MIDDLEWARE (keep yours)
const { authMiddleware, superAdminOnly } = require("../middleware/auth");

// ========================
// LOGIN
// ========================
const router = express.Router();
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const admin = await Admin.findOne({
      email: email.toLowerCase(),
      is_active: true,
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      },
    );

    res.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

// ========================
// GET ME
// ========================
router.get("/me", authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: req.admin,
  });
});

// ========================
// DASHBOARD
// ========================
router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const [
      totalOrders,
      completedOrders,
      pendingOrders,
      failedOrders,
      recentOrders,
      revenueAgg,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: "completed" }),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "failed" }),

      Order.find().sort({ createdAt: -1 }).limit(10).populate("product_id"),

      Order.aggregate([
        {
          $match: { status: "completed" },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    const revenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    res.json({
      success: true,
      data: {
        stats: {
          total_orders: totalOrders,
          completed_orders: completedOrders,
          pending_orders: pendingOrders,
          failed_orders: failedOrders,
          revenue,
        },
        recent_orders: recentOrders,
      },
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
    });
  }
});

// ========================
// CREATE ADMIN (SUPER ADMIN)
// ========================
router.post(
  "/create-admin",
  authMiddleware,
  superAdminOnly,
  async (req, res) => {
    try {
      const { email, password, name, role } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          message: "Email, password, and name are required",
        });
      }

      const existing = await Admin.findOne({
        email: email.toLowerCase(),
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const admin = await Admin.create({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        name,
        role: role || "sub_admin",
      });

      res.status(201).json({
        success: true,
        data: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Failed to create admin",
      });
    }
  },
);

// ========================
// GET SETTINGS
// ========================
router.get("/settings", authMiddleware, async (req, res) => {
  try {
    const settings = await AppSetting.find();

    const formatted = {};
    settings.forEach((s) => {
      formatted[s.key] = s.value;
    });

    res.json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch settings",
    });
  }
});

// ========================
// UPDATE SETTINGS
// ========================
router.patch("/settings", authMiddleware, async (req, res) => {
  try {
    const updates = req.body;

    for (const [key, value] of Object.entries(updates)) {
      await AppSetting.updateOne(
        { key },
        { key, value: String(value) },
        { upsert: true },
      );
    }

    res.json({
      success: true,
      message: "Settings updated",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to update settings",
    });
  }
});

module.exports = router;
