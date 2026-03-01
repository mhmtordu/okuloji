import pool from '../config/database.js';

export const getTeacherUnavailability = async (req, res) => {
  try {
    const { teacher_id, school_id } = req.query;

    if (!teacher_id || !school_id) {
      return res.status(400).json({ 
        success: false,
        message: 'teacher_id ve school_id gerekli' 
      });
    }

    const result = await pool.query(
      `SELECT 
        tu.unavailability_id,
        tu.teacher_id,
        tu.school_id,
        tu.time_slot_id,
        tu.reason,
        ts.slot_name,
        ts.start_time,
        ts.end_time,
        ts.slot_order,
        ts.day_of_week,
        ts.period
      FROM teacher_unavailability tu
      JOIN time_slots ts ON tu.time_slot_id = ts.time_slot_id
      WHERE tu.teacher_id = $1 AND tu.school_id = $2
      ORDER BY ts.day_of_week, ts.slot_order`,
      [teacher_id, school_id]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('getTeacherUnavailability error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası', 
      error: error.message 
    });
  }
};

export const createUnavailability = async (req, res) => {
  try {
    const { teacher_id, school_id, time_slot_id, reason } = req.body;

    if (!teacher_id || !school_id || !time_slot_id) {
      return res.status(400).json({ 
        success: false,
        message: 'teacher_id, school_id ve time_slot_id gerekli' 
      });
    }

    // Aynı kısıtlama var mı kontrol et
    const checkExisting = await pool.query(
      `SELECT * FROM teacher_unavailability 
       WHERE teacher_id = $1 AND time_slot_id = $2`,
      [teacher_id, time_slot_id]
    );

    if (checkExisting.rows.length > 0) {
      return res.status(409).json({ 
        success: false,
        message: 'Bu kısıtlama zaten mevcut' 
      });
    }

    const result = await pool.query(
      `INSERT INTO teacher_unavailability 
       (teacher_id, school_id, time_slot_id, reason)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [teacher_id, school_id, time_slot_id, reason || null]
    );

    res.status(201).json({
      success: true,
      message: 'Kısıtlama eklendi',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('createUnavailability error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası', 
      error: error.message 
    });
  }
};

export const deleteUnavailability = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM teacher_unavailability 
       WHERE unavailability_id = $1 
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Kısıtlama bulunamadı' 
      });
    }

    res.json({
      success: true,
      message: 'Kısıtlama silindi',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('deleteUnavailability error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası', 
      error: error.message 
    });
  }
};

export const bulkUpdateUnavailability = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { teacher_id, school_id, unavailabilities } = req.body;

    if (!teacher_id || !school_id || !Array.isArray(unavailabilities)) {
      return res.status(400).json({ 
        success: false,
        message: 'teacher_id, school_id ve unavailabilities (array) gerekli' 
      });
    }

    await client.query('BEGIN');

    await client.query(
      'DELETE FROM teacher_unavailability WHERE teacher_id = $1 AND school_id = $2',
      [teacher_id, school_id]
    );

    for (const item of unavailabilities) {
      await client.query(
        `INSERT INTO teacher_unavailability 
         (teacher_id, school_id, time_slot_id, reason)
         VALUES ($1, $2, $3, $4)`,
        [teacher_id, school_id, item.time_slot_id, item.reason || null]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Kısıtlamalar güncellendi',
      count: unavailabilities.length
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('bulkUpdateUnavailability error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası', 
      error: error.message 
    });
  } finally {
    client.release();
  }
};