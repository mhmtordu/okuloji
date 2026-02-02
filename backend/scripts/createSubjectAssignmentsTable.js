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
    console.log('🔄 subject_assignments tablosu oluşturuluyor...\n');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS subject_assignments (
        assignment_id SERIAL PRIMARY KEY,
        school_id INT NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
        classroom_id INT NOT NULL REFERENCES classrooms(classroom_id) ON DELETE CASCADE,
        subject_id INT NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
        teacher_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        weekly_hours INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT unique_classroom_subject UNIQUE(classroom_id, subject_id),
        CONSTRAINT check_weekly_hours CHECK (weekly_hours >= 1 AND weekly_hours <= 10)
      );
    `);
    
    console.log('✅ Tablo oluşturuldu!\n');
    
    // Index'ler
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_assignments_school 
      ON subject_assignments(school_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_assignments_classroom 
      ON subject_assignments(classroom_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_assignments_teacher 
      ON subject_assignments(teacher_id);
    `);
    
    console.log('✅ Index\'ler eklendi!\n');
    
    // Trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION update_assignment_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    await client.query(`
      CREATE TRIGGER update_assignment_timestamp
          BEFORE UPDATE ON subject_assignments
          FOR EACH ROW
          EXECUTE FUNCTION update_assignment_timestamp();
    `);
    
    console.log('✅ Trigger eklendi!\n');
    
    // Kontrol
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'subject_assignments'
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