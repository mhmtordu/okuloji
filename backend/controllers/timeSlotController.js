import pool from '../config/database.js';

// Tüm zaman dilimlerini getir
export const getTimeSlots = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    
    const result = await pool.query(
      `SELECT * FROM time_slots 
       WHERE school_id = $1 
       ORDER BY day_of_week ASC, slot_order ASC`,
      [schoolId]
    );

    res.json({
      success: true,
      timeSlots: result.rows
    });
  } catch (error) {
    console.error('Get time slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Zaman dilimleri getirilirken hata oluştu'
    });
  }
};

// Yeni zaman dilimi ekle
export const createTimeSlot = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const { slot_name, slot_order, start_time, end_time, day_of_week, is_break } = req.body;

    // Validation
    if (!day_of_week || day_of_week < 1 || day_of_week > 7) {
      return res.status(400).json({
        success: false,
        message: 'Geçerli bir gün seçiniz (1-7)'
      });
    }

    // Aynı gün ve sırada başka bir zaman dilimi var mı kontrol et
    const checkResult = await pool.query(
      'SELECT * FROM time_slots WHERE school_id = $1 AND day_of_week = $2 AND slot_order = $3',
      [schoolId, day_of_week, slot_order]
    );

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Bu günün ${slot_order}. sırasında zaten bir zaman dilimi var!`
      });
    }

    // Yeni zaman dilimi ekle
    const result = await pool.query(
      `INSERT INTO time_slots (school_id, slot_name, slot_order, start_time, end_time, day_of_week, is_break)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [schoolId, slot_name, slot_order, start_time, end_time, day_of_week, is_break || false]
    );

    res.status(201).json({
      success: true,
      message: 'Zaman dilimi başarıyla eklendi',
      timeSlot: result.rows[0]
    });
  } catch (error) {
    console.error('Create time slot error:', error);
    res.status(500).json({
      success: false,
      message: 'Zaman dilimi eklenirken hata oluştu'
    });
  }
};

// Zaman dilimi güncelle
export const updateTimeSlot = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const { id } = req.params;
    const { slot_name, slot_order, start_time, end_time, day_of_week, is_break } = req.body;

    // Zaman diliminin bu okula ait olduğunu kontrol et
    const checkResult = await pool.query(
      'SELECT * FROM time_slots WHERE slot_id = $1 AND school_id = $2',
      [id, schoolId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Zaman dilimi bulunamadı'
      });
    }

    // Zaman dilimini güncelle
    const result = await pool.query(
      `UPDATE time_slots 
       SET slot_name = COALESCE($1, slot_name),
           slot_order = COALESCE($2, slot_order),
           start_time = COALESCE($3, start_time),
           end_time = COALESCE($4, end_time),
           day_of_week = COALESCE($5, day_of_week),
           is_break = COALESCE($6, is_break)
       WHERE slot_id = $7 AND school_id = $8
       RETURNING *`,
      [slot_name, slot_order, start_time, end_time, day_of_week, is_break, id, schoolId]
    );

    res.json({
      success: true,
      message: 'Zaman dilimi başarıyla güncellendi',
      timeSlot: result.rows[0]
    });
  } catch (error) {
    console.error('Update time slot error:', error);
    res.status(500).json({
      success: false,
      message: 'Zaman dilimi güncellenirken hata oluştu'
    });
  }
};

// Zaman dilimi sil
export const deleteTimeSlot = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const { id } = req.params;

    // Zaman diliminin bu okula ait olduğunu kontrol et
    const checkResult = await pool.query(
      'SELECT * FROM time_slots WHERE slot_id = $1 AND school_id = $2',
      [id, schoolId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Zaman dilimi bulunamadı'
      });
    }

    // Zaman dilimini sil
    await pool.query(
      'DELETE FROM time_slots WHERE slot_id = $1 AND school_id = $2',
      [id, schoolId]
    );

    res.json({
      success: true,
      message: 'Zaman dilimi başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete time slot error:', error);
    res.status(500).json({
      success: false,
      message: 'Zaman dilimi silinirken hata oluştu'
    });
  }
};

// Standart program şablonu oluştur (Pazartesi-Cuma için)
export const createStandardTemplate = async (req, res) => {
  try {
    const schoolId = req.user.school_id;

    // Önce mevcut zaman dilimlerini kontrol et
    const existingSlots = await pool.query(
      'SELECT * FROM time_slots WHERE school_id = $1',
      [schoolId]
    );

    if (existingSlots.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Zaten zaman dilimleri mevcut! Önce tümünü silmelisiniz.'
      });
    }

    // Standart lise programı (Pazartesi-Cuma için aynı saatler)
    const standardSlots = [
      { slot_name: '1. Ders', slot_order: 1, start_time: '08:00', end_time: '08:45', is_break: false },
      { slot_name: '2. Ders', slot_order: 2, start_time: '08:50', end_time: '09:35', is_break: false },
      { slot_name: 'Teneffüs', slot_order: 3, start_time: '09:35', end_time: '09:50', is_break: true },
      { slot_name: '3. Ders', slot_order: 4, start_time: '09:50', end_time: '10:35', is_break: false },
      { slot_name: '4. Ders', slot_order: 5, start_time: '10:40', end_time: '11:25', is_break: false },
      { slot_name: 'Teneffüs', slot_order: 6, start_time: '11:25', end_time: '11:40', is_break: true },
      { slot_name: '5. Ders', slot_order: 7, start_time: '11:40', end_time: '12:25', is_break: false },
      { slot_name: '6. Ders', slot_order: 8, start_time: '12:30', end_time: '13:15', is_break: false },
      { slot_name: 'Öğle Arası', slot_order: 9, start_time: '13:15', end_time: '14:00', is_break: true },
      { slot_name: '7. Ders', slot_order: 10, start_time: '14:00', end_time: '14:45', is_break: false },
      { slot_name: '8. Ders', slot_order: 11, start_time: '14:50', end_time: '15:35', is_break: false },
    ];

    // Her gün için (Pazartesi=1 -> Cuma=5) aynı zaman dilimlerini oluştur
    const days = [1, 2, 3, 4, 5]; // Pazartesi - Cuma

    for (const day of days) {
      for (const slot of standardSlots) {
        await pool.query(
          `INSERT INTO time_slots (school_id, slot_name, slot_order, start_time, end_time, day_of_week, is_break)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [schoolId, slot.slot_name, slot.slot_order, slot.start_time, slot.end_time, day, slot.is_break]
        );
      }
    }

    // Tüm zaman dilimlerini getir
    const result = await pool.query(
      `SELECT * FROM time_slots 
       WHERE school_id = $1 
       ORDER BY day_of_week ASC, slot_order ASC`,
      [schoolId]
    );

    res.status(201).json({
      success: true,
      message: 'Standart program şablonu başarıyla oluşturuldu! (Pazartesi-Cuma, 8 ders)',
      timeSlots: result.rows
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({
      success: false,
      message: 'Şablon oluşturulurken hata oluştu'
    });
  }
};

// Tüm zaman dilimlerini sil
export const deleteAllTimeSlots = async (req, res) => {
  try {
    const schoolId = req.user.school_id;

    await pool.query(
      'DELETE FROM time_slots WHERE school_id = $1',
      [schoolId]
    );

    res.json({
      success: true,
      message: 'Tüm zaman dilimleri başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete all time slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Zaman dilimleri silinirken hata oluştu'
    });
  }
};

// Belirli bir güne göre zaman dilimlerini getir
export const getTimeSlotsByDay = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const { day } = req.params; // 1-7 arası

    const result = await pool.query(
      `SELECT * FROM time_slots 
       WHERE school_id = $1 AND day_of_week = $2
       ORDER BY slot_order ASC`,
      [schoolId, day]
    );

    res.json({
      success: true,
      timeSlots: result.rows
    });
  } catch (error) {
    console.error('Get time slots by day error:', error);
    res.status(500).json({
      success: false,
      message: 'Zaman dilimleri getirilirken hata oluştu'
    });
  }
};