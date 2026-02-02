import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 teacher_unavailability tablosu oluşturuluyor...\n');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS teacher_unavailability (
        unavailability_id SERIAL PRIMARY KEY,
        school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
        teacher_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        day_of_week INT NOT NULL,
        slot_id INT REFERENCES time_slots(slot_id) ON DELETE CASCADE,
        reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_teacher_unavailability UNIQUE(teacher_id, day_of_week, slot_id)
      );
    `);
    
    console.log('✅ Tablo oluşturuldu!\n');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_teacher_unavailability_teacher 
      ON teacher_unavailability(teacher_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_teacher_unavailability_day 
      ON teacher_unavailability(day_of_week);
    `);
    
    console.log('✅ Index\'ler eklendi!\n');
    
    // Kontrol et
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'teacher_unavailability'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Tablo Yapısı:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('❌ HATA:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createTable();