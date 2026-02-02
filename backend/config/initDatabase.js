import pool from './database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const initDatabase = async () => {
  try {
    console.log('📊 Database tabloları oluşturuluyor...');
    
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf8'
    );
    
    await pool.query(schemaSQL);
    
    console.log('✅ Tüm tablolar başarıyla oluşturuldu!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Tablo oluşturma hatası:', error);
    process.exit(1);
  }
};

initDatabase();