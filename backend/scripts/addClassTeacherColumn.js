// addClassTeacherColumn.js
// Database'e class_teacher_id kolonu ekleyen script (ES6 Module)

import pool from '../config/database.js';

async function addClassTeacherColumn() {
  try {
    console.log('🔍 Classrooms tablosunu kontrol ediliyor...');
    
    // Kolon var mı kontrol et
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'classrooms' 
      AND column_name = 'class_teacher_id'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('✅ class_teacher_id kolonu zaten mevcut!');
      await pool.end();
      process.exit(0);
    }

    console.log('📝 class_teacher_id kolonu ekleniyor...');

    // Kolonu ekle
    await pool.query(`
      ALTER TABLE classrooms
      ADD COLUMN class_teacher_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL
    `);

    console.log('✅ class_teacher_id kolonu başarıyla eklendi!');
    console.log('📊 Şimdi şube eklerken rehber öğretmen seçebilirsiniz.');

  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addClassTeacherColumn();