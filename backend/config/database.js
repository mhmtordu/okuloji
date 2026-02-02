import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test bağlantısı
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database bağlantı hatası:', err.stack);
  } else {
    console.log('✅ PostgreSQL bağlantısı başarılı!');
    release();
  }
});

export default pool;