import pool from '../config/database.js';

// Tüm dersleri getir
export const getSubjects = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const result = await pool.query(
      `SELECT * FROM subjects WHERE school_id = $1 ORDER BY grade_level, subject_name`,
      [schoolId]
    );
    res.json({ success: true, subjects: result.rows });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ success: false, message: 'Dersler getirilirken hata oluştu' });
  }
};

// Yeni ders ekle
export const createSubject = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const { subject_name, subject_code, weekly_hours, color, grade_level } = req.body;

    const checkResult = await pool.query(
  'SELECT * FROM subjects WHERE school_id = $1 AND subject_name = $2 AND grade_level = $3',
  [schoolId, subject_name, grade_level || null]
);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({ success: false, message: `${subject_name} dersi zaten mevcut!` });
    }

    const result = await pool.query(
      `INSERT INTO subjects (school_id, subject_name, subject_code, weekly_hours, color, grade_level)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [schoolId, subject_name, subject_code.toUpperCase(), weekly_hours, color, grade_level || null]
    );

    res.status(201).json({ success: true, message: 'Ders başarıyla eklendi', subject: result.rows[0] });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({ success: false, message: 'Ders eklenirken hata oluştu' });
  }
};

// Ders güncelle
export const updateSubject = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const { id } = req.params;
    const { subject_name, subject_code, weekly_hours, color, grade_level } = req.body;

    const checkResult = await pool.query(
      'SELECT * FROM subjects WHERE subject_id = $1 AND school_id = $2',
      [id, schoolId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ders bulunamadı' });
    }

    const result = await pool.query(
      `UPDATE subjects 
       SET subject_name = COALESCE($1, subject_name),
           subject_code = COALESCE($2, subject_code),
           weekly_hours = COALESCE($3, weekly_hours),
           color = COALESCE($4, color),
           grade_level = $5
       WHERE subject_id = $6 AND school_id = $7
       RETURNING *`,
      [subject_name, subject_code?.toUpperCase(), weekly_hours, color, grade_level || null, id, schoolId]
    );

    res.json({ success: true, message: 'Ders başarıyla güncellendi', subject: result.rows[0] });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({ success: false, message: 'Ders güncellenirken hata oluştu' });
  }
};

// Ders sil
export const deleteSubject = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const { id } = req.params;

    const checkResult = await pool.query(
      'SELECT * FROM subjects WHERE subject_id = $1 AND school_id = $2',
      [id, schoolId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ders bulunamadı' });
    }

    await pool.query('DELETE FROM subjects WHERE subject_id = $1 AND school_id = $2', [id, schoolId]);

    res.json({ success: true, message: 'Ders başarıyla silindi' });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ success: false, message: 'Ders silinirken hata oluştu' });
  }
};