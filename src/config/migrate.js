// require('dotenv').config();
// const pool = require('./db');

// const migrate = async () => {
//   const client = await pool.connect();
//   try {
//     console.log('🚀 Running migrations...');

//     await client.query(`
//       CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

//       -- App settings table
//       CREATE TABLE IF NOT EXISTS app_settings (
//         key VARCHAR(100) PRIMARY KEY,
//         value TEXT NOT NULL,
//         updated_at TIMESTAMPTZ DEFAULT NOW()
//       );

//       -- Admin users table
//       CREATE TABLE IF NOT EXISTS admins (
//         id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
//         email VARCHAR(255) UNIQUE NOT NULL,
//         password_hash VARCHAR(255) NOT NULL,
//         name VARCHAR(100) NOT NULL,
//         role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'sub_admin')),
//         is_active BOOLEAN DEFAULT true,
//         created_at TIMESTAMPTZ DEFAULT NOW(),
//         updated_at TIMESTAMPTZ DEFAULT NOW()
//       );

//       -- Products table (data bundles + result checkers)
//       CREATE TABLE IF NOT EXISTS products (
//         id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
//         product_type VARCHAR(30) NOT NULL CHECK (product_type IN ('data_bundle', 'result_checker')),
//         network VARCHAR(20) NOT NULL,
//         name VARCHAR(100) NOT NULL,
//         description TEXT,
//         size VARCHAR(20),
//         price DECIMAL(10,2) NOT NULL,
//         duration VARCHAR(50),
//         is_active BOOLEAN DEFAULT true,
//         moolre_enabled BOOLEAN DEFAULT true,
//         sort_order INT DEFAULT 0,
//         created_at TIMESTAMPTZ DEFAULT NOW(),
//         updated_at TIMESTAMPTZ DEFAULT NOW()
//       );

//       -- Orders table
//       CREATE TABLE IF NOT EXISTS orders (
//         id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
//         order_number VARCHAR(20) UNIQUE NOT NULL,
//         product_id UUID REFERENCES products(id),
//         product_snapshot JSONB NOT NULL,
//         recipient_number VARCHAR(15) NOT NULL,
//         payment_number VARCHAR(15) NOT NULL,
//         payment_network VARCHAR(20) NOT NULL,
//         amount DECIMAL(10,2) NOT NULL,
//         status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
//         payment_reference VARCHAR(100),
//         payment_status VARCHAR(20) DEFAULT 'pending',
//         delivery_status VARCHAR(20) DEFAULT 'pending',
//         delivery_reference VARCHAR(100),
//         delivery_response JSONB,
//         customer_email VARCHAR(255),
//         ip_address INET,
//         notes TEXT,
//         created_at TIMESTAMPTZ DEFAULT NOW(),
//         updated_at TIMESTAMPTZ DEFAULT NOW()
//       );

//       -- Result checker pins table
//       CREATE TABLE IF NOT EXISTS result_checker_pins (
//         id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
//         order_id UUID REFERENCES orders(id),
//         pin VARCHAR(50) NOT NULL,
//         serial VARCHAR(50),
//         exam_type VARCHAR(20) NOT NULL CHECK (exam_type IN ('WASSCE', 'BECE')),
//         is_used BOOLEAN DEFAULT false,
//         created_at TIMESTAMPTZ DEFAULT NOW()
//       );

//       -- Transactions table (payment audit log)
//       CREATE TABLE IF NOT EXISTS transactions (
//         id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
//         order_id UUID REFERENCES orders(id),
//         type VARCHAR(20) NOT NULL CHECK (type IN ('payment', 'refund')),
//         amount DECIMAL(10,2) NOT NULL,
//         gateway VARCHAR(20) DEFAULT 'moolre',
//         gateway_reference VARCHAR(100),
//         status VARCHAR(20) DEFAULT 'pending',
//         gateway_response JSONB,
//         created_at TIMESTAMPTZ DEFAULT NOW()
//       );

//       -- Indexes for performance
//       CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
//       CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
//       CREATE INDEX IF NOT EXISTS idx_orders_recipient ON orders(recipient_number);
//       CREATE INDEX IF NOT EXISTS idx_products_network ON products(network);
//       CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
//       CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
//     `);

//     // Default app settings
//     await client.query(`
//       INSERT INTO app_settings (key, value) VALUES
//         ('maintenance_mode', 'false'),
//         ('mtn_notice_enabled', 'false'),
//         ('mtn_notice_message', ''),
//         ('site_name', 'NetGH'),
//         ('support_whatsapp', '+233000000000')
//       ON CONFLICT (key) DO NOTHING;
//     `);

//     console.log('✅ Migrations completed successfully!');
//   } catch (err) {
//     console.error('❌ Migration error:', err);
//     throw err;
//   } finally {
//     client.release();
//     await pool.end();
//   }
// };

// migrate();
require('dotenv').config();
const mongoose = require('mongoose');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('✅ MongoDB Connected');
    console.log('✅ Migration complete');
    console.log('✅ Collections will be created automatically');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();