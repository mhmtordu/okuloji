import pool from '../config/database.js';

// Tüm atamaları getir
export const getAssignments = async (req, res) => {
  try {
    const schoolId = req.user.school_id;

    const result = await pool.query(
      `SELECT 
        sa.assignment_id, sa.school_id, sa.classroom_id, sa.subject_id, sa.teacher_id,
        sa.weekly_hours, c.classroom_name, c.grade_level,
        s.subject_name, s.subject_code, s.color,
        u.full_name as teacher_name, u.branch as teacher_branch,
        sa.created_at, sa.updated_at
      FROM subject_assignments sa
      JOIN classrooms c ON sa.classroom_id = c.classroom_id
      JOIN subjects s ON sa.subject_id = s.subject_id
      JOIN users u ON sa.teacher_id = u.user_id
      WHERE sa.school_id = $1
      ORDER BY c.classroom_name, s.subject_name`,
      [schoolId]
    );

    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('getAssignments error:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
  }
};

// Belirli bir sınıf için atamaları getir
export const getAssignmentsByClassroom = async (req, res) => {
  try {
    const { classroom_id } = req.params;

    const result = await pool.query(
      `SELECT sa.*, s.subject_name, s.subject_code, s.color,
        u.full_name as teacher_name, u.branch as teacher_branch
      FROM subject_assignments sa
      JOIN subjects s ON sa.subject_id = s.subject_id
      JOIN users u ON sa.teacher_id = u.user_id
      WHERE sa.classroom_id = $1
      ORDER BY s.subject_name`,
      [classroom_id]
    );

    const totalHours = result.rows.reduce((sum, row) => sum + row.weekly_hours, 0);

    res.json({
      success: true,
      data: result.rows,
      summary: {
        total_hours: totalHours,
        unique_subjects: new Set(result.rows.map(r => r.subject_id)).size,
        unique_teachers: new Set(result.rows.map(r => r.teacher_id)).size
      }
    });
  } catch (error) {
    console.error('getAssignmentsByClassroom error:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
  }
};

// Yeni atama ekle
export const createAssignment = async (req, res) => {
  console.log('🔵 createAssignment çağrıldı!');
  console.log('📦 Request body:', req.body);
  try {
    const schoolId = req.user.school_id; // token'dan al
    const { classroom_id, subject_id, teacher_id, weekly_hours } = req.body;

    if (!classroom_id || !subject_id || !teacher_id) {
      return res.status(400).json({ success: false, message: 'classroom_id, subject_id ve teacher_id gerekli' });
    }

    if (!weekly_hours || weekly_hours < 1 || weekly_hours > 40) {
      return res.status(400).json({ success: false, message: 'weekly_hours 1-40 arasında olmalı' });
    }

    // Aynı sınıf + ders + öğretmen kombinasyonu var mı?
    const checkExisting = await pool.query(
      `SELECT * FROM subject_assignments WHERE classroom_id = $1 AND subject_id = $2 AND teacher_id = $3`,
      [classroom_id, subject_id, teacher_id]
    );

    if (checkExisting.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Bu öğretmen bu sınıfa bu dersi zaten veriyor!' });
    }

    const result = await pool.query(
      `INSERT INTO subject_assignments (school_id, classroom_id, subject_id, teacher_id, weekly_hours)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [schoolId, classroom_id, subject_id, teacher_id, weekly_hours]
    );

    const detailedResult = await pool.query(
      `SELECT sa.*, c.classroom_name, s.subject_name, s.subject_code, s.color,
        u.full_name as teacher_name, u.branch as teacher_branch
      FROM subject_assignments sa
      JOIN classrooms c ON sa.classroom_id = c.classroom_id
      JOIN subjects s ON sa.subject_id = s.subject_id
      JOIN users u ON sa.teacher_id = u.user_id
      WHERE sa.assignment_id = $1`,
      [result.rows[0].assignment_id]
    );

    res.status(201).json({ success: true, message: 'Ders ataması başarıyla eklendi', data: detailedResult.rows[0] });
  } catch (error) {
    console.error('createAssignment error:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
  }
};

// Atamayı güncelle
export const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacher_id, weekly_hours } = req.body;

    if (!teacher_id && !weekly_hours) {
      return res.status(400).json({ success: false, message: 'Güncellenecek alan belirtilmedi' });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (teacher_id) { updates.push(`teacher_id = $${paramCount++}`); values.push(teacher_id); }
    if (weekly_hours) {
      if (weekly_hours < 1 || weekly_hours > 40) {
        return res.status(400).json({ success: false, message: 'weekly_hours 1-40 arasında olmalı' });
      }
      updates.push(`weekly_hours = $${paramCount++}`);
      values.push(weekly_hours);
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE subject_assignments SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE assignment_id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Atama bulunamadı' });
    }

    res.json({ success: true, message: 'Atama güncellendi', data: result.rows[0] });
  } catch (error) {
    console.error('updateAssignment error:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
  }
};

// Atamayı sil
export const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM subject_assignments WHERE assignment_id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Atama bulunamadı' });
    }

    res.json({ success: true, message: 'Atama silindi', data: result.rows[0] });
  } catch (error) {
    console.error('deleteAssignment error:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
  }
};