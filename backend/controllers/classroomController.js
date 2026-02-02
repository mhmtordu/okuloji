import pool from '../config/database.js';

// Tüm şubeleri getir
export const getClassrooms = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    
    const result = await pool.query(
      `SELECT 
        c.*,
        u.full_name as teacher_name,
        u.branch as teacher_branch
      FROM classrooms c
      LEFT JOIN users u ON c.class_teacher_id = u.user_id
      WHERE c.school_id = $1
      ORDER BY c.grade_level, c.classroom_name`,
      [schoolId]
    );

    res.json({
      success: true,
      classrooms: result.rows
    });
  } catch (error) {
    console.error('Get classrooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Şubeler getirilirken hata oluştu'
    });
  }
};

// Yeni şube ekle
export const createClassroom = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const { classroom_name, grade_level, student_count, class_teacher_id } = req.body; // ✅ class_teacher_id eklendi

    // Aynı isimde şube var mı kontrol et
    const checkResult = await pool.query(
      'SELECT * FROM classrooms WHERE school_id = $1 AND classroom_name = $2',
      [schoolId, classroom_name]
    );

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${classroom_name} şubesi zaten mevcut!`
      });
    }

    // Yeni şube ekle - ✅ class_teacher_id dahil
    const result = await pool.query(
      `INSERT INTO classrooms (school_id, classroom_name, grade_level, student_count, class_teacher_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [schoolId, classroom_name, grade_level, student_count || 0, class_teacher_id || null]
    );

    res.status(201).json({
      success: true,
      message: 'Şube başarıyla oluşturuldu',
      classroom: result.rows[0]
    });
  } catch (error) {
    console.error('Create classroom error:', error);
    res.status(500).json({
      success: false,
      message: 'Şube oluşturulurken hata oluştu'
    });
  }
};

// Şube güncelle
export const updateClassroom = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const { id } = req.params;
    const { classroom_name, grade_level, student_count, class_teacher_id } = req.body;

    // Şubenin bu okula ait olduğunu kontrol et
    const checkResult = await pool.query(
      'SELECT * FROM classrooms WHERE classroom_id = $1 AND school_id = $2',
      [id, schoolId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Şube bulunamadı'
      });
    }

    // Eğer isim değişiyorsa, aynı isimde başka şube var mı kontrol et
    if (classroom_name && classroom_name !== checkResult.rows[0].classroom_name) {
      const duplicateCheck = await pool.query(
        'SELECT * FROM classrooms WHERE school_id = $1 AND classroom_name = $2 AND classroom_id != $3',
        [schoolId, classroom_name, id]
      );
      
      if (duplicateCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: `${classroom_name} şubesi zaten mevcut!`
        });
      }
    }

    // Şubeyi güncelle
    const result = await pool.query(
      `UPDATE classrooms 
       SET classroom_name = COALESCE($1, classroom_name),
           grade_level = COALESCE($2, grade_level),
           student_count = COALESCE($3, student_count),
           class_teacher_id = $4
       WHERE classroom_id = $5 AND school_id = $6
       RETURNING *`,
      [classroom_name, grade_level, student_count, class_teacher_id, id, schoolId]
    );

    res.json({
      success: true,
      message: 'Şube başarıyla güncellendi',
      classroom: result.rows[0]
    });
  } catch (error) {
    console.error('Update classroom error:', error);
    res.status(500).json({
      success: false,
      message: 'Şube güncellenirken hata oluştu'
    });
  }
};

// Şube sil
export const deleteClassroom = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const { id } = req.params;

    // Şubenin bu okula ait olduğunu kontrol et
    const checkResult = await pool.query(
      'SELECT * FROM classrooms WHERE classroom_id = $1 AND school_id = $2',
      [id, schoolId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Şube bulunamadı'
      });
    }

    // Şubeyi sil
    await pool.query(
      'DELETE FROM classrooms WHERE classroom_id = $1 AND school_id = $2',
      [id, schoolId]
    );

    res.json({
      success: true,
      message: 'Şube başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete classroom error:', error);
    res.status(500).json({
      success: false,
      message: 'Şube silinirken hata oluştu'
    });
  }
};