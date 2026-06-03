// const express = require('express');
// const router = express.Router();
// const pool = require('../config/db');

// // GET /api/settings - Public: get non-sensitive app settings
// router.get('/', async (req, res) => {
//   try {
//     const result = await pool.query(
//       "SELECT key, value FROM app_settings WHERE key IN ('maintenance_mode', 'mtn_notice_enabled', 'mtn_notice_message', 'site_name', 'support_whatsapp')"
//     );
//     const settings = {};
//     result.rows.forEach(r => { settings[r.key] = r.value; });
//     res.json({ success: true, data: settings });
//   } catch (err) {
//     res.status(500).json({ success: false, message: 'Failed to fetch settings' });
//   }
// });

// module.exports = router;
const express = require('express');
const router = express.Router();

const AppSetting = require('../models/AppSetting');


// ========================
// GET PUBLIC SETTINGS
// ========================
router.get('/', async (req, res) => {
  try {
    const allowedKeys = [
      'maintenance_mode',
      'mtn_notice_enabled',
      'mtn_notice_message',
      'site_name',
      'support_whatsapp'
    ];

    const settings = await AppSetting.find({
      key: { $in: allowedKeys }
    });

    const formatted = {};

    settings.forEach(s => {
      formatted[s.key] = s.value;
    });

    res.json({
      success: true,
      data: formatted
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings'
    });
  }
});

module.exports = router;