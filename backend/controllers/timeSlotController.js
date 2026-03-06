import pool from '../config/database.js';

export const getTimeSlots = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const result = await pool.query(
      `SELECT * FROM time_slots WHERE school_id = $1 ORDER BY day_of_week ASC, slot_order ASC`,
      [schoolId]
    );
    res.json({ success: true, timeSlots: result.rows });
  } catch (error) {
    console.error('Get time slots error:', error);
    res.status(500).json({ success: false, message: 'Zaman dilimleri getirilirken hata oluştu' });
  }
};

export const createTimeSlot = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const { slot_name, slot_order, start_time, end_time, day_of_week, is_break } = req.body;

    if (!day_of_week || day_of_week < 1 || day_of_week > 7) {
      return res.status(400).json({ success: false, message: 'Geçerli bir gün seçiniz (1-7)' });
    }

    const checkResult = await pool.query(
      'SELECT * FROM time_slots WHERE school_id = $1 AND day_of_week = $2 AND slot_order = $3',
      [schoolId, day_of_week, slot_order]
    );

    if (checkResult.rows.length > 0) {
      return res.status(400).json({ success: false, message: `Bu günün ${slot_order}. sırasında zaten bir zaman dilimi var!` });
    }

    const period = slot_order;
    const dayNames = ['', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

    const result = await pool.query(
      `INSERT INTO time_slots (school_id, slot_name, slot_order, period, start_time, end_time, day_of_week, day_name, is_break)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [schoolId, slot_name, slot_order, period, start_time, end_time, day_of_week, dayNames[day_of_week] || '', is_break || false]
    );

    res.status(201).json({ success: true, message: 'Zaman dilimi başarıyla eklendi', timeSlot: result.rows[0] });
  } catch (error) {
    console.error('Create time slot error:', error);
    res.status(500).json({ success: false, message: 'Zaman dilimi eklenirken hata oluştu' });
  }
};

// Toplu zaman dilimi ekle - DELETE + INSERT (tek seferlik, güvenli)
export const createBulkTimeSlots = async (req, res) => {
  const client = await pool.connect();
  try {
    const schoolId = req.user.school_id;
    const { timeSlots, slots } = req.body;
    const slotData = timeSlots || slots;

    if (!slotData || !Array.isArray(slotData) || slotData.length === 0) {
      return res.status(400).json({ success: false, message: 'Zaman dilimleri gerekli' });
    }

    const dayNames = ['', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

    await client.query('BEGIN');
    await client.query('DELETE FROM time_slots WHERE school_id = $1', [schoolId]);

    // Frontend zaten gün×ders kombinasyonunu hazır gönderiyor, döngü yok!
    let insertedCount = 0;
    for (const slot of slotData) {
      const period = slot.period || slot.slot_order;
      const day = slot.day_of_week;
      await client.query(
        `INSERT INTO time_slots (school_id, slot_name, slot_order, period, start_time, end_time, day_of_week, day_name, is_break)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [schoolId, slot.slot_name || `${period}. Ders`, slot.slot_order || period, period,
         slot.start_time, slot.end_time, day, dayNames[day] || '', slot.is_break || false]
      );
      insertedCount++;
    }

    await client.query('COMMIT');

    const result = await pool.query(
      'SELECT * FROM time_slots WHERE school_id = $1 ORDER BY day_of_week, slot_order',
      [schoolId]
    );

    res.status(201).json({ success: true, message: `${insertedCount} zaman dilimi başarıyla eklendi`, timeSlots: result.rows });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk create time slots error:', error);
    res.status(500).json({ success: false, message: 'Zaman dilimleri eklenirken hata oluştu', error: error.message });
  } finally {
    client.release();
  }
};

export const updateTimeSlot = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const { id } = req.params;
    const { slot_name, slot_order, start_time, end_time, day_of_week, is_break } = req.body;

    const checkResult = await pool.query(
      'SELECT * FROM time_slots WHERE time_slot_id = $1 AND school_id = $2',
      [id, schoolId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Zaman dilimi bulunamadı' });
    }

    const result = await pool.query(
      `UPDATE time_slots 
       SET slot_name = COALESCE($1, slot_name), slot_order = COALESCE($2, slot_order),
           start_time = COALESCE($3, start_time), end_time = COALESCE($4, end_time),
           day_of_week = COALESCE($5, day_of_week), is_break = COALESCE($6, is_break)
       WHERE time_slot_id = $7 AND school_id = $8 RETURNING *`,
      [slot_name, slot_order, start_time, end_time, day_of_week, is_break, id, schoolId]
    );

    res.json({ success: true, message: 'Zaman dilimi başarıyla güncellendi', timeSlot: result.rows[0] });
  } catch (error) {
    console.error('Update time slot error:', error);
    res.status(500).json({ success: false, message: 'Zaman dilimi güncellenirken hata oluştu' });
  }
};

export const deleteTimeSlot = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const { id } = req.params;

    const checkResult = await pool.query(
      'SELECT * FROM time_slots WHERE time_slot_id = $1 AND school_id = $2',
      [id, schoolId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Zaman dilimi bulunamadı' });
    }

    await pool.query('DELETE FROM time_slots WHERE time_slot_id = $1 AND school_id = $2', [id, schoolId]);
    res.json({ success: true, message: 'Zaman dilimi başarıyla silindi' });
  } catch (error) {
    console.error('Delete time slot error:', error);
    res.status(500).json({ success: false, message: 'Zaman dilimi silinirken hata oluştu' });
  }
};

export const createStandardTemplate = async (req, res) => {
  const client = await pool.connect();
  try {
    const schoolId = req.user.school_id;

    const standardSlots = [
      { slot_name: '1. Ders', slot_order: 1, period: 1, start_time: '08:00', end_time: '08:45', is_break: false },
      { slot_name: '2. Ders', slot_order: 2, period: 2, start_time: '08:50', end_time: '09:35', is_break: false },
      { slot_name: '3. Ders', slot_order: 3, period: 3, start_time: '09:50', end_time: '10:35', is_break: false },
      { slot_name: '4. Ders', slot_order: 4, period: 4, start_time: '10:40', end_time: '11:25', is_break: false },
      { slot_name: '5. Ders', slot_order: 5, period: 5, start_time: '11:40', end_time: '12:25', is_break: false },
      { slot_name: '6. Ders', slot_order: 6, period: 6, start_time: '12:30', end_time: '13:15', is_break: false },
      { slot_name: '7. Ders', slot_order: 7, period: 7, start_time: '14:00', end_time: '14:45', is_break: false },
      { slot_name: '8. Ders', slot_order: 8, period: 8, start_time: '14:50', end_time: '15:35', is_break: false },
    ];

    const days = [1, 2, 3, 4, 5];
    const dayNames = ['', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

    await client.query('BEGIN');
    await client.query('DELETE FROM time_slots WHERE school_id = $1', [schoolId]);

    for (const day of days) {
      for (const slot of standardSlots) {
        await client.query(
          `INSERT INTO time_slots (school_id, slot_name, slot_order, period, start_time, end_time, day_of_week, day_name, is_break)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [schoolId, slot.slot_name, slot.slot_order, slot.period, slot.start_time, slot.end_time, day, dayNames[day], slot.is_break]
        );
      }
    }

    await client.query('COMMIT');

    const result = await pool.query(
      'SELECT * FROM time_slots WHERE school_id = $1 ORDER BY day_of_week ASC, slot_order ASC',
      [schoolId]
    );

    res.status(201).json({ success: true, message: 'Standart şablon oluşturuldu! (Pazartesi-Cuma, 8 ders)', timeSlots: result.rows });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create template error:', error);
    res.status(500).json({ success: false, message: 'Şablon oluşturulurken hata oluştu' });
  } finally {
    client.release();
  }
};

export const deleteAllTimeSlots = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    await pool.query('DELETE FROM time_slots WHERE school_id = $1', [schoolId]);
    res.json({ success: true, message: 'Tüm zaman dilimleri başarıyla silindi' });
  } catch (error) {
    console.error('Delete all time slots error:', error);
    res.status(500).json({ success: false, message: 'Zaman dilimleri silinirken hata oluştu' });
  }
};

export const getTimeSlotsByDay = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const { day } = req.params;
    const result = await pool.query(
      'SELECT * FROM time_slots WHERE school_id = $1 AND day_of_week = $2 ORDER BY slot_order ASC',
      [schoolId, day]
    );
    res.json({ success: true, timeSlots: result.rows });
  } catch (error) {
    console.error('Get time slots by day error:', error);
    res.status(500).json({ success: false, message: 'Zaman dilimleri getirilirken hata oluştu' });
  }
};