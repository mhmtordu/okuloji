import pool from '../config/database.js';

// Öğretmen kısıtlamalarını getir (Belirli bir öğretmen + okul için)
export const getTeacherUnavailability = async (req, res) => {
  try {
    const { teacher_id, school_id } = req.query;

    if (!teacher_id || !school_id) {
      return res.status(400).json({ 
        message: 'teacher_id ve school_id gerekli' 
      });
    }

    const result = await pool.query(
      `SELECT 
        tu.unavailability_id,
        tu.teacher_id,
        tu.school_id,
        tu.day_of_week,
        tu.slot_id,
        tu.reason,
        ts.slot_name,
        ts.start_time,
        ts.end_time,
        ts.slot_order
      FROM teacher_unavailability tu
      JOIN time_slots ts ON tu.slot_id = ts.slot_id
      WHERE tu.teacher_id = $1 AND tu.school_id = $2
      ORDER BY tu.day_of_week, ts.slot_order`,
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

// Yeni kısıtlama ekle
export const createUnavailability = async (req, res) => {
  try {
    const { teacher_id, school_id, day_of_week, slot_id, reason } = req.body;

    if (!teacher_id || !school_id || day_of_week === undefined || !slot_id) {
      return res.status(400).json({ 
        message: 'teacher_id, school_id, day_of_week ve slot_id gerekli' 
      });
    }

    // Aynı kısıtlama var mı kontrol et
    const checkExisting = await pool.query(
      `SELECT * FROM teacher_unavailability 
       WHERE teacher_id = $1 AND day_of_week = $2 AND slot_id = $3`,
      [teacher_id, day_of_week, slot_id]
    );

    if (checkExisting.rows.length > 0) {
      return res.status(409).json({ 
        success: false,
        message: 'Bu kısıtlama zaten mevcut' 
      });
    }

    const result = await pool.query(
      `INSERT INTO teacher_unavailability 
       (teacher_id, school_id, day_of_week, slot_id, reason)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [teacher_id, school_id, day_of_week, slot_id, reason || null]
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

// Kısıtlama sil
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

// Toplu kısıtlama güncelleme (Frontend'den gelen tüm kısıtlamaları kaydet)
export const bulkUpdateUnavailability = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { teacher_id, school_id, unavailabilities } = req.body;
    // unavailabilities: [{ day_of_week, slot_id, reason }, ...]

    if (!teacher_id || !school_id || !Array.isArray(unavailabilities)) {
      return res.status(400).json({ 
        message: 'teacher_id, school_id ve unavailabilities (array) gerekli' 
      });
    }

    await client.query('BEGIN');

    // Önce mevcut kısıtlamaları sil
    await client.query(
      'DELETE FROM teacher_unavailability WHERE teacher_id = $1 AND school_id = $2',
      [teacher_id, school_id]
    );

    // Yeni kısıtlamaları ekle
    for (const item of unavailabilities) {
      await client.query(
        `INSERT INTO teacher_unavailability 
         (teacher_id, school_id, day_of_week, slot_id, reason)
         VALUES ($1, $2, $3, $4, $5)`,
        [teacher_id, school_id, item.day_of_week, item.slot_id, item.reason || null]
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