/**
 * SCHEDULE CONTROLLER
 *
 * Ders programı oluşturma, görüntüleme ve silme işlemleri
 */

import pool from "../config/database.js";
import ScheduleGenerator from "../algorithms/scheduleAlgorithm-core.js";

// ============================================================================
// OKUL VERİLERİNİ DATABASE'DEN ÇEK
// ============================================================================

async function fetchSchoolData(school_id) {
  try {
    console.log("📊 Okul verileri çekiliyor...");

    // 1. Zaman dilimleri
    const timeSlotsResult = await pool.query(
      `SELECT 
        ts.*,
        CASE 
          WHEN ts.day_of_week = 1 THEN 'Pazartesi'
          WHEN ts.day_of_week = 2 THEN 'Salı'
          WHEN ts.day_of_week = 3 THEN 'Çarşamba'
          WHEN ts.day_of_week = 4 THEN 'Perşembe'
          WHEN ts.day_of_week = 5 THEN 'Cuma'
        END as day_name
       FROM time_slots ts 
       WHERE ts.school_id = $1 
       ORDER BY ts.day_of_week, ts.period`,
      [school_id]
    );

    console.log(`✅ ${timeSlotsResult.rows.length} zaman dilimi bulundu`);

    // 2. Öğretmenler
    const teachersResult = await pool.query(
      `SELECT * FROM users 
       WHERE school_id = $1 AND role = 'teacher'
       ORDER BY full_name`,
      [school_id]
    );

    console.log(`✅ ${teachersResult.rows.length} öğretmen bulundu`);

    // 3. Öğretmen kısıtlamaları
    const unavailabilityResult = await pool.query(
      `SELECT 
        tu.*,
        ts.period,
        CASE 
          WHEN ts.day_of_week = 1 THEN 'Pazartesi'
          WHEN ts.day_of_week = 2 THEN 'Salı'
          WHEN ts.day_of_week = 3 THEN 'Çarşamba'
          WHEN ts.day_of_week = 4 THEN 'Perşembe'
          WHEN ts.day_of_week = 5 THEN 'Cuma'
        END as day_name
       FROM teacher_unavailability tu
       JOIN time_slots ts ON tu.slot_id = ts.slot_id
       WHERE tu.school_id = $1`,
      [school_id]
    );

    console.log(`✅ ${unavailabilityResult.rows.length} kısıtlama bulundu`);

    // 4. Sınıflar
    const classroomsResult = await pool.query(
      `SELECT * FROM classrooms 
       WHERE school_id = $1
       ORDER BY grade_level, classroom_name`,
      [school_id]
    );

    console.log(`✅ ${classroomsResult.rows.length} sınıf bulundu`);

    // 5. Ders atamaları
    const assignmentsResult = await pool.query(
      `SELECT 
        sa.*,
        s.subject_name,
        s.subject_code,
        s.color,
        c.classroom_name,
        c.grade_level,
        u.full_name as teacher_name,
        u.branch as teacher_branch
       FROM subject_assignments sa
       JOIN subjects s ON sa.subject_id = s.subject_id
       JOIN classrooms c ON sa.classroom_id = c.classroom_id
       JOIN users u ON sa.teacher_id = u.user_id
       WHERE sa.school_id = $1`,
      [school_id]
    );

    console.log(`✅ ${assignmentsResult.rows.length} ders ataması bulundu`);

    return {
      timeSlots: timeSlotsResult.rows,
      teachers: teachersResult.rows,
      teacherUnavailability: unavailabilityResult.rows,
      classrooms: classroomsResult.rows,
      subjectAssignments: assignmentsResult.rows,
    };
  } catch (error) {
    console.error("❌ Veri çekme hatası:", error);
    throw error;
  }
}

// ============================================================================
// PROGRAMI DATABASE'E KAYDET
// ============================================================================

async function saveScheduleToDatabase(school_id, schedule) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    console.log("💾 Program database'e kaydediliyor...");

    // Önce eski programı sil
    await client.query("DELETE FROM schedules WHERE school_id = $1", [
      school_id,
    ]);

    let savedCount = 0;

    // Yeni programı kaydet
    for (let [classroomId, classroom] of schedule.classrooms) {
      for (let [slotKey, assignment] of Object.entries(classroom.schedule)) {
        const [dayName, period] = slotKey.split("-");

        // Time slot bilgisini al
        const timeSlotResult = await client.query(
          `SELECT slot_id as time_slot_id, start_time, end_time 
           FROM time_slots
           WHERE school_id = $1 
           AND day_of_week = CASE $2
             WHEN 'Pazartesi' THEN 1
             WHEN 'Salı' THEN 2
             WHEN 'Çarşamba' THEN 3
             WHEN 'Perşembe' THEN 4
             WHEN 'Cuma' THEN 5
           END
           AND period = $3
           LIMIT 1`,
          [school_id, dayName, parseInt(period)]
        );

        if (timeSlotResult.rows.length > 0) {
          const timeSlot = timeSlotResult.rows[0];

          await client.query(
            `INSERT INTO schedules 
             (school_id, classroom_id, subject_id, teacher_id, time_slot_id, day_name, period, start_time, end_time)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              school_id,
              classroomId,
              assignment.subject.id,
              assignment.teacher.id,
              timeSlot.time_slot_id, // ✅ 187     
              dayName,
              parseInt(period),
              timeSlot.start_time,
              timeSlot.end_time,
            ]
          );

          savedCount++;
        }
      }
    }

    await client.query("COMMIT");
    console.log(`✅ ${savedCount} ders programı kaydedildi!`);

    return savedCount;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Kaydetme hatası:", error);
    throw error;
  } finally {
    client.release();
  }
}

// ============================================================================
// ENDPOINT: PROGRAM OLUŞTUR
// ============================================================================

export const generateSchedule = async (req, res) => {
  try {
    const { school_id } = req.body;

    if (!school_id) {
      return res.status(400).json({
        success: false,
        message: "school_id gerekli",
      });
    }

    console.log("🔥 Ders programı oluşturma başladı...");
    const startTime = Date.now();

    // 1. Verileri çek
    const schoolData = await fetchSchoolData(school_id);

    // Veri kontrolü
    if (schoolData.timeSlots.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Zaman dilimi bulunamadı! Önce zaman dilimlerini oluşturun.",
      });
    }

    if (schoolData.classrooms.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Sınıf bulunamadı! Önce sınıfları ekleyin.",
      });
    }

    if (schoolData.teachers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Öğretmen bulunamadı! Önce öğretmenleri ekleyin.",
      });
    }

    if (schoolData.subjectAssignments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Ders ataması bulunamadı! Önce dersleri atayın.",
      });
    }

    // 2. Algoritma generator'ı oluştur
    const generator = new ScheduleGenerator({
      maxAttempts: 100000,
    });

    // 3. Hazırlık
    await generator.prepare(schoolData);

    // 4. Programı oluştur
    const schedule = await generator.generate();

    if (!schedule) {
      return res.status(500).json({
        success: false,
        message: "Program oluşturulamadı. Lütfen kısıtlamaları kontrol edin.",
        suggestions: [
          "Öğretmen sayısını artırın",
          "Haftalık ders saatlerini azaltın",
          "Öğretmen kısıtlamalarını gevşetin",
        ],
        stats: {
          attempts: generator.attempts,
          maxAttempts: generator.maxAttempts,
        },
      });
    }

    // 5. Database'e kaydet
    const savedCount = await saveScheduleToDatabase(school_id, schedule);

    const elapsed = Date.now() - startTime;

    console.log(`✅ Program başarıyla oluşturuldu! (${elapsed}ms)`);

    res.json({
      success: true,
      message: "Program başarıyla oluşturuldu!",
      data: {
        elapsed: `${(elapsed / 1000).toFixed(2)} saniye`,
        attempts: generator.attempts,
        backtrackCount: generator.backtrackCount,
        savedCount,
        stats: {
          classrooms: schedule.classrooms.size,
          teachers: schedule.teachers.size,
          totalSlots: schedule.timeSlots.length,
        },
      },
    });
  } catch (error) {
    console.error("❌ generateSchedule error:", error);
    res.status(500).json({
      success: false,
      message: "Sunucu hatası",
      error: error.message,
    });
  }
};

// ============================================================================
// ENDPOINT: MEVCUT PROGRAMI GETİR
// ============================================================================

export const getSchedule = async (req, res) => {
  try {
    const { school_id } = req.query;

    if (!school_id) {
      return res.status(400).json({
        success: false,
        message: "school_id gerekli",
      });
    }

    const result = await pool.query(
      `SELECT 
        s.*,
        c.classroom_name,
        c.grade_level,
        sub.subject_name,
        sub.subject_code,
        sub.color,
        u.full_name as teacher_name,
        u.branch as teacher_branch
       FROM schedules s
       JOIN classrooms c ON s.classroom_id = c.classroom_id
       JOIN subjects sub ON s.subject_id = sub.subject_id
       JOIN users u ON s.teacher_id = u.user_id
       WHERE s.school_id = $1
       ORDER BY c.classroom_name, s.day_name, s.period`,
      [school_id]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("getSchedule error:", error);
    res.status(500).json({
      success: false,
      message: "Sunucu hatası",
      error: error.message,
    });
  }
};

// ============================================================================
// ENDPOINT: PROGRAMI SİL
// ============================================================================

export const deleteSchedule = async (req, res) => {
  try {
    const { school_id } = req.body;

    if (!school_id) {
      return res.status(400).json({
        success: false,
        message: "school_id gerekli",
      });
    }

    const result = await pool.query(
      "DELETE FROM schedules WHERE school_id = $1 RETURNING *",
      [school_id]
    );

    res.json({
      success: true,
      message: "Program silindi",
      deletedCount: result.rows.length,
    });
  } catch (error) {
    console.error("deleteSchedule error:", error);
    res.status(500).json({
      success: false,
      message: "Sunucu hatası",
      error: error.message,
    });
  }
};

// ============================================================================
// ENDPOINT: SINIF BAZLI PROGRAM GETİR
// ============================================================================

export const getScheduleByClassroom = async (req, res) => {
  try {
    const { classroom_id } = req.params;

    if (!classroom_id) {
      return res.status(400).json({
        success: false,
        message: "classroom_id gerekli",
      });
    }

    const result = await pool.query(
      `SELECT 
        s.*,
        sub.subject_name,
        sub.subject_code,
        sub.color,
        u.full_name as teacher_name,
        u.branch as teacher_branch
       FROM schedules s
       JOIN subjects sub ON s.subject_id = sub.subject_id
       JOIN users u ON s.teacher_id = u.user_id
       WHERE s.classroom_id = $1
       ORDER BY s.day_name, s.period`,
      [classroom_id]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("getScheduleByClassroom error:", error);
    res.status(500).json({
      success: false,
      message: "Sunucu hatası",
      error: error.message,
    });
  }
};

// ============================================================================
// ENDPOINT: ÖĞRETMEN BAZLI PROGRAM GETİR
// ============================================================================

export const getScheduleByTeacher = async (req, res) => {
  try {
    const { teacher_id } = req.params;

    if (!teacher_id) {
      return res.status(400).json({
        success: false,
        message: "teacher_id gerekli",
      });
    }

    const result = await pool.query(
      `SELECT 
        s.*,
        c.classroom_name,
        c.grade_level,
        sub.subject_name,
        sub.subject_code,
        sub.color
       FROM schedules s
       JOIN classrooms c ON s.classroom_id = c.classroom_id
       JOIN subjects sub ON s.subject_id = sub.subject_id
       WHERE s.teacher_id = $1
       ORDER BY s.day_name, s.period`,
      [teacher_id]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("getScheduleByTeacher error:", error);
    res.status(500).json({
      success: false,
      message: "Sunucu hatası",
      error: error.message,
    });
  }
};
