require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const Admin = require('./src/models/Admin');
const Product = require('./src/models/Product');
const AppSetting = require('./src/models/AppSetting');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('🌱 Seeding database...');

    // ADMIN
    const passwordHash = await bcrypt.hash(
      process.env.ADMIN_PASSWORD || 'Admin@123!',
      12
    );

    await Admin.updateOne(
      { email: process.env.ADMIN_EMAIL || 'admin@netgh.com' },
      {
        email: process.env.ADMIN_EMAIL || 'admin@netgh.com',
        password_hash: passwordHash,
        name: 'NetGH Admin',
        role: 'admin',
        is_active: true
      },
      { upsert: true }
    );

    // SETTINGS
    const settings = [
      { key: 'maintenance_mode', value: 'false' },
      { key: 'site_name', value: 'NetGH' },
      { key: 'support_whatsapp', value: '+233000000000' }
    ];

    for (const s of settings) {
      await AppSetting.updateOne({ key: s.key }, s, { upsert: true });
    }

    // PRODUCTS
    await Product.deleteMany({});

    await Product.insertMany([
      {
        product_type: 'data_bundle',
        network: 'mtn',
        name: '1GB Data Bundle',
        size: '1GB',
        price: 4.9,
        duration: 'Non-Expiry',
        sort_order: 1
      },
      {
        product_type: 'data_bundle',
        network: 'mtn',
        name: '5GB Data Bundle',
        size: '5GB',
        price: 25,
        duration: 'Non-Expiry',
        sort_order: 2
      },
      {
        product_type: 'data_bundle',
        network: 'mtn',
        name: '10GB Data Bundle',
        size: '10GB',
        price: 44,
        duration: 'Non-Expiry',
        sort_order: 3
      }
    ]);

    console.log('✅ Seed completed successfully');
    process.exit(0);

  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();