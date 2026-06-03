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
      // MTN Data Bundles
      { product_type: 'data_bundle', network: 'mtn', name: '1GB Data Bundle',  size: '1GB',  price: 4.90,   duration: 'Non-Expiry', sort_order: 1  },
      { product_type: 'data_bundle', network: 'mtn', name: '2GB Data Bundle',  size: '2GB',  price: 9.75,   duration: 'Non-Expiry', sort_order: 2  },
      { product_type: 'data_bundle', network: 'mtn', name: '3GB Data Bundle',  size: '3GB',  price: 14.20,  duration: 'Non-Expiry', sort_order: 3  },
      { product_type: 'data_bundle', network: 'mtn', name: '4GB Data Bundle',  size: '4GB',  price: 19.00,  duration: 'Non-Expiry', sort_order: 4  },
      { product_type: 'data_bundle', network: 'mtn', name: '5GB Data Bundle',  size: '5GB',  price: 23.20,  duration: 'Non-Expiry', sort_order: 5  },
      { product_type: 'data_bundle', network: 'mtn', name: '6GB Data Bundle',  size: '6GB',  price: 26.50,  duration: 'Non-Expiry', sort_order: 6  },
      { product_type: 'data_bundle', network: 'mtn', name: '8GB Data Bundle',  size: '8GB',  price: 35.30,  duration: 'Non-Expiry', sort_order: 7  },
      { product_type: 'data_bundle', network: 'mtn', name: '10GB Data Bundle', size: '10GB', price: 42.00,  duration: 'Non-Expiry', sort_order: 8  },
      { product_type: 'data_bundle', network: 'mtn', name: '15GB Data Bundle', size: '15GB', price: 61.50,  duration: 'Non-Expiry', sort_order: 9  },
      { product_type: 'data_bundle', network: 'mtn', name: '20GB Data Bundle', size: '20GB', price: 82.00,  duration: 'Non-Expiry', sort_order: 10 },
      { product_type: 'data_bundle', network: 'mtn', name: '25GB Data Bundle', size: '25GB', price: 103.50, duration: 'Non-Expiry', sort_order: 11 },
      { product_type: 'data_bundle', network: 'mtn', name: '30GB Data Bundle', size: '30GB', price: 122.90, duration: 'Non-Expiry', sort_order: 12 },
      { product_type: 'data_bundle', network: 'mtn', name: '50GB Data Bundle', size: '50GB', price: 201.00, duration: 'Non-Expiry', sort_order: 13 },

      // AirtelTigo Data Bundles
      { product_type: 'data_bundle', network: 'airteltigo', name: '1GB Data Bundle',  size: '1GB',  price: 4.20,  duration: '30 Days',    sort_order: 1  },
      { product_type: 'data_bundle', network: 'airteltigo', name: '2GB Data Bundle',  size: '2GB',  price: 8.20,  duration: '30 Days',    sort_order: 2  },
      { product_type: 'data_bundle', network: 'airteltigo', name: '3GB Data Bundle',  size: '3GB',  price: 12.30, duration: '30 Days',    sort_order: 3  },
      { product_type: 'data_bundle', network: 'airteltigo', name: '5GB Data Bundle',  size: '5GB',  price: 22.00, duration: '30 Days',    sort_order: 4  },
      { product_type: 'data_bundle', network: 'airteltigo', name: '8GB Data Bundle',  size: '8GB',  price: 35.00, duration: '30 Days',    sort_order: 5  },
      { product_type: 'data_bundle', network: 'airteltigo', name: '10GB Data Bundle', size: '10GB', price: 42.00, duration: '30 Days',    sort_order: 6  },
      { product_type: 'data_bundle', network: 'airteltigo', name: '15GB Data Bundle', size: '15GB', price: 60.90, duration: 'Non-Expiry', sort_order: 7  },
      { product_type: 'data_bundle', network: 'airteltigo', name: '20GB Data Bundle', size: '20GB', price: 80.90, duration: 'Non-Expiry', sort_order: 8  },
      { product_type: 'data_bundle', network: 'airteltigo', name: '25GB Data Bundle', size: '25GB', price: 87.00, duration: 'Non-Expiry', sort_order: 9  },
      { product_type: 'data_bundle', network: 'airteltigo', name: '30GB Data Bundle', size: '30GB', price: 93.00, duration: 'Non-Expiry', sort_order: 10 },
      { product_type: 'data_bundle', network: 'airteltigo', name: '40GB Data Bundle', size: '40GB', price: 114.00, duration: 'Non-Expiry', sort_order: 11 },

      // Telecel Data Bundles
      { product_type: 'data_bundle', network: 'telecel', name: '10GB Data Bundle', size: '10GB', price: 40.00,  duration: 'Non-Expiry', sort_order: 1 },
      { product_type: 'data_bundle', network: 'telecel', name: '15GB Data Bundle', size: '15GB', price: 45.00,  duration: 'Non-Expiry', sort_order: 2 },
      { product_type: 'data_bundle', network: 'telecel', name: '20GB Data Bundle', size: '20GB', price: 78.00,  duration: 'Non-Expiry', sort_order: 3 },
      { product_type: 'data_bundle', network: 'telecel', name: '30GB Data Bundle', size: '30GB', price: 115.00, duration: 'Non-Expiry', sort_order: 4 },

      // Result Checkers
      { product_type: 'result_checker', network: 'WASSCE', name: 'WASSCE Result Checker', size: '1 PIN', price: 18.50, duration: 'Instant', sort_order: 1 },
      { product_type: 'result_checker', network: 'BECE',   name: 'BECE Result Checker',   size: '1 PIN', price: 18.00, duration: 'Instant', sort_order: 2 },
    ]);

    console.log('✅ Seed completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();