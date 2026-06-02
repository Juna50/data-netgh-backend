require('dotenv').config();
const pool = require('./db');
const bcrypt = require('bcryptjs');

const seed = async () => {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding database...');

    // Seed admin user
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123!', 12);
    await client.query(`
      INSERT INTO admins (email, password_hash, name, role)
      VALUES ($1, $2, 'NetGH Admin', 'admin')
      ON CONFLICT (email) DO NOTHING
    `, [process.env.ADMIN_EMAIL || 'admin@netgh.com', passwordHash]);

    // Seed products
    const products = [
      // MTN Data Bundles
      { type: 'data_bundle', network: 'mtn', name: '1GB Data Bundle', size: '1GB', price: 4.90, duration: 'Non-Expiry', sort: 1 },
      { type: 'data_bundle', network: 'mtn', name: '2GB Data Bundle', size: '2GB', price: 9.75, duration: 'Non-Expiry', sort: 2 },
      { type: 'data_bundle', network: 'mtn', name: '3GB Data Bundle', size: '3GB', price: 14.20, duration: 'Non-Expiry', sort: 3 },
      { type: 'data_bundle', network: 'mtn', name: '4GB Data Bundle', size: '4GB', price: 19.00, duration: 'Non-Expiry', sort: 4 },
      { type: 'data_bundle', network: 'mtn', name: '5GB Data Bundle', size: '5GB', price: 23.20, duration: 'Non-Expiry', sort: 5 },
      { type: 'data_bundle', network: 'mtn', name: '6GB Data Bundle', size: '6GB', price: 26.50, duration: 'Non-Expiry', sort: 6 },
      { type: 'data_bundle', network: 'mtn', name: '8GB Data Bundle', size: '8GB', price: 35.30, duration: 'Non-Expiry', sort: 7 },
      { type: 'data_bundle', network: 'mtn', name: '10GB Data Bundle', size: '10GB', price: 42.00, duration: 'Non-Expiry', sort: 8 },
      { type: 'data_bundle', network: 'mtn', name: '15GB Data Bundle', size: '15GB', price: 61.50, duration: 'Non-Expiry', sort: 9 },
      { type: 'data_bundle', network: 'mtn', name: '20GB Data Bundle', size: '20GB', price: 82.00, duration: 'Non-Expiry', sort: 10 },
      { type: 'data_bundle', network: 'mtn', name: '25GB Data Bundle', size: '25GB', price: 103.50, duration: 'Non-Expiry', sort: 11 },
      { type: 'data_bundle', network: 'mtn', name: '30GB Data Bundle', size: '30GB', price: 122.90, duration: 'Non-Expiry', sort: 12 },
      { type: 'data_bundle', network: 'mtn', name: '50GB Data Bundle', size: '50GB', price: 201.00, duration: 'Non-Expiry', sort: 13 },

      // AirtelTigo Data Bundles
      { type: 'data_bundle', network: 'airteltigo', name: '1GB Data Bundle', size: '1GB', price: 4.20, duration: '30 Days', sort: 1 },
      { type: 'data_bundle', network: 'airteltigo', name: '2GB Data Bundle', size: '2GB', price: 8.20, duration: '30 Days', sort: 2 },
      { type: 'data_bundle', network: 'airteltigo', name: '3GB Data Bundle', size: '3GB', price: 12.30, duration: '30 Days', sort: 3 },
      { type: 'data_bundle', network: 'airteltigo', name: '5GB Data Bundle', size: '5GB', price: 22.00, duration: '30 Days', sort: 4 },
      { type: 'data_bundle', network: 'airteltigo', name: '8GB Data Bundle', size: '8GB', price: 35.00, duration: '30 Days', sort: 5 },
      { type: 'data_bundle', network: 'airteltigo', name: '10GB Data Bundle', size: '10GB', price: 42.00, duration: '30 Days', sort: 6 },
      { type: 'data_bundle', network: 'airteltigo', name: '15GB Data Bundle', size: '15GB', price: 60.90, duration: 'Non-Expiry', sort: 7 },
      { type: 'data_bundle', network: 'airteltigo', name: '20GB Data Bundle', size: '20GB', price: 80.90, duration: 'Non-Expiry', sort: 8 },
      { type: 'data_bundle', network: 'airteltigo', name: '25GB Data Bundle', size: '25GB', price: 87.00, duration: 'Non-Expiry', sort: 9 },
      { type: 'data_bundle', network: 'airteltigo', name: '30GB Data Bundle', size: '30GB', price: 93.00, duration: 'Non-Expiry', sort: 10 },
      { type: 'data_bundle', network: 'airteltigo', name: '40GB Data Bundle', size: '40GB', price: 114.00, duration: 'Non-Expiry', sort: 11 },

      // Telecel Data Bundles
      { type: 'data_bundle', network: 'telecel', name: '10GB Data Bundle', size: '10GB', price: 40.00, duration: 'Non-Expiry', sort: 1 },
      { type: 'data_bundle', network: 'telecel', name: '15GB Data Bundle', size: '15GB', price: 45.00, duration: 'Non-Expiry', sort: 2 },
      { type: 'data_bundle', network: 'telecel', name: '20GB Data Bundle', size: '20GB', price: 78.00, duration: 'Non-Expiry', sort: 3 },
      { type: 'data_bundle', network: 'telecel', name: '30GB Data Bundle', size: '30GB', price: 115.00, duration: 'Non-Expiry', sort: 4 },

      // Result Checkers
      { type: 'result_checker', network: 'WASSCE', name: 'WASSCE Result Checker', size: '1 PIN', price: 18.50, duration: 'Instant', sort: 1 },
      { type: 'result_checker', network: 'BECE', name: 'BECE Result Checker', size: '1 PIN', price: 18.00, duration: 'Instant', sort: 2 },
    ];

    for (const p of products) {
      await client.query(`
        INSERT INTO products (product_type, network, name, size, price, duration, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING
      `, [p.type, p.network, p.name, p.size, p.price, p.duration, p.sort]);
    }

    console.log(`✅ Seeded ${products.length} products`);
    console.log('✅ Database seeded successfully!');
  } catch (err) {
    console.error('❌ Seed error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
