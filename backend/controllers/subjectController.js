import pool from '../config/database.js';

// Tüm dersleri getir
export const getSubjects = async (req, res) => {
  try {
    const schoolId = req.user.school_id; // ✅ schoolId -> school_id
    
    const result = await pool.query(
      `SELECT * FROM subjects 
       WHERE school_id = $1 
       ORDER BY subject_name`,
      [schoolId]
    );

    res.json({
      success: true,
      subjects: result.rows
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Dersler getirilirken hata oluştu'
    });
  }
};

// Yeni ders ekle
export const createSubject = async (req, res) => {
  try {
    const schoolId = req.user.school_id; // ✅ schoolId -> school_id
    const { subject_name, subject_code, weekly_hours, color } = req.body;

    // Aynı isimde ders var mı kontrol et
    const checkResult = await pool.query(
      'SELECT * FROM subjects WHERE school_id = $1 AND subject_name = $2',
      [schoolId, subject_name]
    );

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${subject_name} dersi zaten mevcut!`
      });
    }

    // Yeni ders ekle
    const result = await pool.query(
      `INSERT INTO subjects (school_id, subject_name, subject_code, weekly_hours, color)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [schoolId, subject_name, subject_code.toUpperCase(), weekly_hours, color]
    );

    res.status(201).json({
      success: true,
      message: 'Ders başarıyla eklendi',
      subject: result.rows[0]
    });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Ders eklenirken hata oluştu'
    });
  }
};

// Ders güncelle
export const updateSubject = async (req, res) => {
  try {
    const schoolId = req.user.school_id; // ✅ schoolId -> school_id
    const { id } = req.params;
    const { subject_name, subject_code, weekly_hours, color } = req.body;

    // Dersin bu okula ait olduğunu kontrol et
    const checkResult = await pool.query(
      'SELECT * FROM subjects WHERE subject_id = $1 AND school_id = $2',
      [id, schoolId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ders bulunamadı'
      });
    }

    // Dersi güncelle
    const result = await pool.query(
      `UPDATE subjects 
       SET subject_name = COALESCE($1, subject_name),
           subject_code = COALESCE($2, subject_code),
           weekly_hours = COALESCE($3, weekly_hours),
           color = COALESCE($4, color)
       WHERE subject_id = $5 AND school_id = $6
       RETURNING *`,
      [subject_name, subject_code?.toUpperCase(), weekly_hours, color, id, schoolId]
    );

    res.json({
      success: true,
      message: 'Ders başarıyla güncellendi',
      subject: result.rows[0]
    });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Ders güncellenirken hata oluştu'
    });
  }
};

// Ders sil
export const deleteSubject = async (req, res) => {
  try {
    const schoolId = req.user.school_id; // ✅ schoolId -> school_id
    const { id } = req.params;

    // Dersin bu okula ait olduğunu kontrol et
    const checkResult = await pool.query(
      'SELECT * FROM subjects WHERE subject_id = $1 AND school_id = $2',
      [id, schoolId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ders bulunamadı'
      });
    }

    // Dersi sil
    await pool.query(
      'DELETE FROM subjects WHERE subject_id = $1 AND school_id = $2',
      [id, schoolId]
    );

    res.json({
      success: true,
      message: 'Ders başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Ders silinirken hata oluştu'
    });
  }
};