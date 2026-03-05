import pool from '../config/database.js';
import ScheduleGenerator from '../algorithms/scheduleAlgorithm-core.js';

// ============================================================
// POST /api/schedules/generate
// ============================================================
export const generateSchedule = async (req, res) => {
  const client = await pool.connect();

  try {
    const { school_id } = req.body;

    if (!school_id) {
      return res.status(400).json({ success: false, message: 'school_id gerekli' });
    }

    console.log(`\n🏫 Okul ${school_id} için program oluşturuluyor...`);

    const data = await fetchSchoolData(school_id);

    console.log(`   ⏰ ${data.timeSlots.length} zaman dilimi`);
    console.log(`   📚 ${data.classrooms.length} sınıf`);
    console.log(`   👨‍🏫 ${data.teachers.length} öğretmen`);
    console.log(`   ⚠️ ${data.teacherUnavailability.length} kısıtlama`);
    console.log(`   📝 ${data.subjectAssignments.length} ders ataması`);

    // Algoritmayı çalıştır
    const generator = new ScheduleGenerator({ maxAttempts: 100000 });
    await generator.prepare(data);
    const schedule = await generator.generate();

    // Validasyon
    const validation = generator.validate();
    console.log(`\n📊 Validasyon: ${validation.summary}`);
    if (!validation.isValid) {
      console.log(`⚠️ ${validation.errors.length} eksik atama:`);
      validation.errors.slice(0, 10).forEach(e =>
        console.log(`   - ${e.classroom} / ${e.subject}: ${e.assigned}/${e.required} saat`)
      );
    }

    // DB'ye yaz
    const rows = generator.toDBFormat(school_id);
    console.log(`\n💾 ${rows.length} satır DB'ye yazılıyor...`);

    await client.query('BEGIN');
    await client.query('DELETE FROM schedules WHERE school_id = $1', [school_id]);

    if (rows.length > 0) {
      const values = rows.map((_, i) => {
        const base = i * 9;
        return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8},$${base+9})`;
      }).join(',');

      const params = rows.flatMap(r => [
        r.school_id, r.classroom_id, r.subject_id, r.teacher_id,
        r.time_slot_id, r.day_name, r.period, r.start_time, r.end_time
      ]);

      await client.query(
        `INSERT INTO schedules
         (school_id, classroom_id, subject_id, teacher_id, time_slot_id, day_name, period, start_time, end_time)
         VALUES ${values}`,
        params
      );
    }

    await client.query('COMMIT');
    console.log('✅ DB yazma tamamlandı!');

    const progress = generator.getProgress();

    res.json({
      success: true,
      message: 'Program oluşturuldu',
      stats: {
        totalAssignments: data.subjectAssignments.length,
        placedBlocks:     progress.assignedBlocks,
        totalBlocks:      progress.totalBlocks,
        successRate:      progress.progress + '%',
        dbRows:           rows.length,
        attempts:         generator.attempts,
        repairAttempts:   generator.repairAttempts,
        forceAttempts:    generator.forceAttempts,
      },
      suggestions: generator.getSuggestions(),
      validation: {
        isValid:  validation.isValid,
        summary:  validation.summary,
        errors:   validation.errors.slice(0, 20),
      }
    });

  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ generateSchedule hata:', error);
    res.status(500).json({
      success: false,
      message: 'Program oluşturulurken hata oluştu',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// ============================================================
// POST /api/schedules/debug — Yerleşemeyen blokları analiz et
// ============================================================
export const debugSchedule = async (req, res) => {
  try {
    const { school_id } = req.body;
    if (!school_id) return res.status(400).json({ success: false, message: 'school_id gerekli' });

    const data = await fetchSchoolData(school_id);

    const generator = new ScheduleGenerator({ maxAttempts: 100000 });
    await generator.prepare(data);
    await generator.generate();

    // Yerleşemeyen blokları bul
    const unplaced = [];
    for (const assignment of generator.schedule.assignments) {
      for (const block of assignment.blocks) {
        if (!block.isAssigned()) {
          unplaced.push({
            classroom:           assignment.classroom.name,
            subject:             assignment.subject.name,
            teacher:             assignment.teacher.name,
            blockSize:           block.size,
            weeklyHours:         assignment.weeklyHours,
            assignedHours:       assignment.assignedHours,
            teacherTotalHours:   assignment.teacher.totalHours,
            teacherUnavailable:  assignment.teacher.unavailableSlots.size,
            classroomTotal:      assignment.classroom.totalHours,
            classroomShift:      assignment.classroom.shift,
            classroomDailyHours: assignment.classroom.dailyHours,
          });
        }
      }
    }

    // Sınıf doluluk analizi
    const classroomFill = [];
    generator.schedule.classrooms.forEach(classroom => {
      const expectedHours = classroom.maxWeeklyHours;
      classroomFill.push({
        name:          classroom.name,
        gradeLevel:    classroom.gradeLevel,
        shift:         classroom.shift,
        totalHours:    classroom.totalHours,
        expectedHours: expectedHours,
        missing:       expectedHours - classroom.totalHours,
        dailyHours:    classroom.dailyHours,
      });
    });

    // Öğretmen yük analizi
    const teacherLoad = [];
    generator.schedule.teachers.forEach(teacher => {
      teacherLoad.push({
        name:             teacher.name,
        totalHours:       teacher.totalHours,
        dailyHours:       teacher.dailyHours,
        unavailableSlots: teacher.unavailableSlots.size,
      });
    });

    const progress = generator.getProgress();

    res.json({
      success:        true,
      progressRate:   progress.progress + '%',
      assignedBlocks: progress.assignedBlocks,
      totalBlocks:    progress.totalBlocks,
      unplacedCount:  unplaced.length,
      unplaced,
      classroomFill:  classroomFill.filter(c => c.missing > 0).sort((a, b) => b.missing - a.missing),
      teacherLoad:    teacherLoad.sort((a, b) => b.totalHours - a.totalHours),
    });

  } catch (error) {
    console.error('❌ debugSchedule hata:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// GET /api/schedules?school_id=2&classroom_id=5
// ============================================================
export const getSchedule = async (req, res) => {
  try {
    const { school_id, classroom_id, teacher_id } = req.query;

    if (!school_id) {
      return res.status(400).json({ success: false, message: 'school_id gerekli' });
    }

    let query = `
      SELECT
        sc.schedule_id, sc.classroom_id, sc.subject_id, sc.teacher_id,
        sc.time_slot_id, sc.day_name, sc.period, sc.start_time, sc.end_time,
        cl.classroom_name, cl.grade_level, cl.shift,
        s.subject_name, s.subject_code, s.color,
        u.full_name AS teacher_name, u.branch
      FROM schedules sc
      JOIN classrooms cl ON sc.classroom_id = cl.classroom_id
      JOIN subjects s    ON sc.subject_id   = s.subject_id
      JOIN users u       ON sc.teacher_id   = u.user_id
      WHERE sc.school_id = $1
    `;
    const params = [school_id];

    if (classroom_id) {
      params.push(classroom_id);
      query += ` AND sc.classroom_id = $${params.length}`;
    }
    if (teacher_id) {
      params.push(teacher_id);
      query += ` AND sc.teacher_id = $${params.length}`;
    }

    query += ` ORDER BY sc.classroom_id, sc.time_slot_id`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count:   result.rows.length,
      data:    result.rows
    });

  } catch (error) {
    console.error('❌ getSchedule hata:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
  }
};

// ============================================================
// PUT /api/schedules/:id  — Manuel hücre güncelleme
// ============================================================
export const updateScheduleEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacher_id, subject_id } = req.body;

    const existing = await pool.query(
      'SELECT * FROM schedules WHERE schedule_id = $1', [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Kayıt bulunamadı' });
    }

    const entry = existing.rows[0];

    if (teacher_id) {
      const conflict = await pool.query(
        `SELECT sc.*, cl.classroom_name FROM schedules sc
         JOIN classrooms cl ON sc.classroom_id = cl.classroom_id
         WHERE sc.time_slot_id = $1 AND sc.teacher_id = $2 AND sc.schedule_id != $3`,
        [entry.time_slot_id, teacher_id, id]
      );
      if (conflict.rows.length > 0) {
        return res.status(409).json({
          success:  false,
          message:  `Çakışma: Öğretmen bu saatte ${conflict.rows[0].classroom_name} sınıfında!`,
          conflict: conflict.rows[0]
        });
      }
    }

    const result = await pool.query(
      `UPDATE schedules SET
         teacher_id = COALESCE($1, teacher_id),
         subject_id = COALESCE($2, subject_id),
         updated_at = NOW()
       WHERE schedule_id = $3
       RETURNING *`,
      [teacher_id || null, subject_id || null, id]
    );

    res.json({ success: true, message: 'Güncellendi', data: result.rows[0] });

  } catch (error) {
    console.error('❌ updateScheduleEntry hata:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
  }
};

// ============================================================
// DELETE /api/schedules/school/:school_id — Programı sıfırla
// ============================================================
export const deleteSchedule = async (req, res) => {
  try {
    const { school_id } = req.params;
    const result = await pool.query(
      'DELETE FROM schedules WHERE school_id = $1 RETURNING schedule_id',
      [school_id]
    );
    res.json({
      success:      true,
      message:      `${result.rowCount} kayıt silindi`,
      deletedCount: result.rowCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
  }
};

// ============================================================
// YARDIMCI: DB'den okul verisini çek
// ============================================================
async function fetchSchoolData(school_id) {
  const [timeSlotsRes, classroomsRes, teachersRes, unavailabilityRes, assignmentsRes] =
    await Promise.all([
      pool.query(
        `SELECT time_slot_id, day_of_week, period, start_time, end_time, is_break
         FROM time_slots WHERE school_id = $1 AND (is_break = false OR is_break IS NULL)
         ORDER BY day_of_week, period`,
        [school_id]
      ),
      pool.query(
        `SELECT c.classroom_id, c.classroom_name, c.grade_level, c.shift,
                COALESCE(SUM(sa.weekly_hours), 0) AS max_weekly_hours
         FROM classrooms c
         LEFT JOIN subject_assignments sa ON sa.classroom_id = c.classroom_id AND sa.school_id = c.school_id
         WHERE c.school_id = $1
         GROUP BY c.classroom_id, c.classroom_name, c.grade_level, c.shift
         ORDER BY c.classroom_name`,
        [school_id]
      ),
      pool.query(
        `SELECT user_id, full_name, branch
         FROM users WHERE school_id = $1 AND role = 'teacher' AND is_active = true`,
        [school_id]
      ),
      pool.query(
        `SELECT teacher_id, time_slot_id
         FROM teacher_unavailability WHERE school_id = $1`,
        [school_id]
      ),
      pool.query(
        `SELECT sa.assignment_id, sa.classroom_id, sa.subject_id, sa.teacher_id,
                sa.weekly_hours, s.subject_name, s.subject_code, s.color
         FROM subject_assignments sa
         JOIN subjects s ON sa.subject_id = s.subject_id
         WHERE sa.school_id = $1`,
        [school_id]
      ),
    ]);

  return {
    timeSlots:             timeSlotsRes.rows,
    classrooms:            classroomsRes.rows,
    teachers:              teachersRes.rows,
    teacherUnavailability: unavailabilityRes.rows,
    subjectAssignments:    assignmentsRes.rows,
  };
}