/**
 * scheduleAlgorithm-core.js (v4.0)
 * - Most Constrained First sıralaması
 * - MEB blok kuralları (structures.js'de)
 * - grade_level bazlı maxDailyHours
 */

console.log('🔄 scheduleAlgorithm-core.js v4.0 YÜKLENDİ');

import {
  Classroom, Teacher, Subject, TimeSlot, Assignment, Schedule
} from './scheduleAlgorithm-structures.js';

const DAY_MAP = {
  1: { name: 'Pazartesi', key: 'Pazartesi' },
  2: { name: 'Salı',      key: 'Sali'      },
  3: { name: 'Çarşamba',  key: 'Carsamba'  },
  4: { name: 'Perşembe',  key: 'Persembe'  },
  5: { name: 'Cuma',      key: 'Cuma'      },
};

class ScheduleGenerator {
  constructor(options = {}) {
    this.maxAttempts       = options.maxAttempts       || 100000;
    this.maxRepairAttempts = options.maxRepairAttempts || 2000;
    this.maxForceAttempts  = options.maxForceAttempts  || 1000;
    this.attempts       = 0;
    this.repairAttempts = 0;
    this.forceAttempts  = 0;
    this.schedule = new Schedule();
  }

  async prepare(data) {
    console.log('📊 Veri hazırlanıyor...');
    this.prepareTimeSlots(data.timeSlots);
    this.calculateDynamicSlots();
    this.prepareClassrooms(data.classrooms);
    this.prepareTeachers(data.teachers);
    this.prepareTeacherUnavailability(data.teacherUnavailability);
    this.prepareSubjects(data.subjectAssignments);
    this.prepareAssignments(data.subjectAssignments);
    const stats = this.schedule.getStats();
    console.log('✅ Veri hazırlama tamamlandı!');
    console.log(`   📚 ${stats.classrooms} sınıf, 👨‍🏫 ${stats.teachers} öğretmen`);
    console.log(`   ⏰ ${stats.timeSlots} slot, 📝 ${stats.assignments} atama, 🔲 ${stats.totalBlocks} blok`);
  }

  prepareTimeSlots(timeSlotsData) {
    timeSlotsData.forEach(ts => {
      const dayInfo = DAY_MAP[ts.day_of_week];
      if (!dayInfo) { console.warn(`⚠️ Bilinmeyen day_of_week: ${ts.day_of_week}`); return; }
      const timeSlot = new TimeSlot(
        ts.time_slot_id, ts.day_of_week,
        dayInfo.name, dayInfo.key,
        ts.period, ts.start_time, ts.end_time,
        ts.is_break || false
      );
      if (!timeSlot.isBreak) this.schedule.timeSlots.push(timeSlot);
    });
  }

  calculateDynamicSlots() {
    const firstDaySlots = this.schedule.timeSlots.filter(ts => ts.dayOfWeek === 1);
    this.schedule.slotsPerDay = firstDaySlots.length;
    this.schedule.weeklySlots = this.schedule.slotsPerDay * 5;
    if (this.schedule.slotsPerDay === 0)
      throw new Error('Günlük ders sayısı 0! time_slots tablosunu kontrol et.');
    console.log(`   ⏰ Günlük ${this.schedule.slotsPerDay} slot, haftalık ${this.schedule.weeklySlots} slot`);
  }

  prepareClassrooms(classroomsData) {
    classroomsData.forEach(c => {
      const maxWeeklyHours = String(c.grade_level) === '8' ? 35 : 40;
      const classroom = new Classroom(c.classroom_id, c.classroom_name, c.grade_level, maxWeeklyHours);
      this.schedule.classrooms.set(classroom.id, classroom);
    });
  }

  prepareTeachers(teachersData) {
    teachersData.forEach(t => {
      this.schedule.teachers.set(t.user_id, new Teacher(t.user_id, t.full_name, t.branch));
    });
  }

  prepareTeacherUnavailability(unavailabilityData) {
    if (!unavailabilityData || unavailabilityData.length === 0) return;
    let count = 0;
    unavailabilityData.forEach(u => {
      const teacher = this.schedule.teachers.get(u.teacher_id);
      if (teacher && u.time_slot_id) { teacher.addUnavailableSlot(u.time_slot_id); count++; }
    });
    console.log(`   ⚠️ ${count} öğretmen kısıtlaması eklendi`);
  }

  prepareSubjects(assignmentsData) {
    const subjectsMap = new Map();
    assignmentsData.forEach(a => {
      if (!subjectsMap.has(a.subject_id))
        subjectsMap.set(a.subject_id, new Subject(
          a.subject_id, a.subject_name, a.subject_code, a.weekly_hours, a.color
        ));
    });
    this.schedule.subjects = subjectsMap;
  }

  prepareAssignments(assignmentsData) {
    assignmentsData.forEach(a => {
      const classroom = this.schedule.classrooms.get(a.classroom_id);
      const subject   = this.schedule.subjects.get(a.subject_id);
      const teacher   = this.schedule.teachers.get(a.teacher_id);
      if (classroom && subject && teacher)
        this.schedule.assignments.push(new Assignment(
          a.assignment_id, classroom, subject, teacher, a.weekly_hours
        ));
      else
        console.warn(`⚠️ Eksik: classroom=${a.classroom_id} subject=${a.subject_id} teacher=${a.teacher_id}`);
    });

    // Most Constrained First sıralaması
    const teacherClassroomCount = new Map();
    const teacherUnavailableCount = new Map();

    this.schedule.assignments.forEach(a => {
      const tid = a.teacher.id;
      teacherClassroomCount.set(tid, (teacherClassroomCount.get(tid) || 0) + 1);
      teacherUnavailableCount.set(tid, a.teacher.unavailableSlots.size);
    });

    this.schedule.assignments.sort((a, b) => {
      // 1. Önce unavailable slot sayısı fazla olan (en kısıtlı öğretmen)
      const unavailA = teacherUnavailableCount.get(a.teacher.id) || 0;
      const unavailB = teacherUnavailableCount.get(b.teacher.id) || 0;
      if (unavailB !== unavailA) return unavailB - unavailA;

      // 2. Sonra çok sınıfa giren öğretmen
      const classCountA = teacherClassroomCount.get(a.teacher.id) || 0;
      const classCountB = teacherClassroomCount.get(b.teacher.id) || 0;
      if (classCountB !== classCountA) return classCountB - classCountA;

      // 3. Son olarak haftalık saat fazla olan
      return b.weeklyHours - a.weeklyHours;
    });

    console.log(`   📝 ${this.schedule.assignments.length} atama Most Constrained First ile sıralandı`);
    console.log('   İlk 5 atama:');
    this.schedule.assignments.slice(0, 5).forEach(a => {
      const sinifSayisi = teacherClassroomCount.get(a.teacher.id) || 0;
      const kisitSayisi = teacherUnavailableCount.get(a.teacher.id) || 0;
      console.log(`      → ${a.teacher.name} | ${a.classroom.name} | ${a.subject.name} | ${a.weeklyHours}s | ${sinifSayisi}sınıf | ${kisitSayisi}kısıt`);
    });
  }

  async generate() {
    console.log('🚀 Algoritma başlıyor...');
    const startTime = Date.now();

    console.log('\n📌 PHASE 1: GREEDY');
    this.greedyPlacement();
    let progress = this.getProgress();
    console.log(`   ✅ Greedy: %${progress.progress} (${progress.assignedBlocks}/${progress.totalBlocks})`);

    if (progress.remaining > 0) {
      console.log('\n🔧 PHASE 2: REPAIR');
      this.repairUnassigned();
      progress = this.getProgress();
      console.log(`   ✅ Repair: %${progress.progress}`);
    }

    console.log('\n⚖️ PHASE 3: BALANCE');
    this.balanceDailyLoads();

    if (progress.remaining > 0) {
      console.log('\n💪 PHASE 4: FORCE');
      this.forcePlacement();
      progress = this.getProgress();
      console.log(`   ✅ Force: %${progress.progress}`);
    }

    progress = this.getProgress();
    console.log(`\n⏱️ Süre: ${Date.now() - startTime}ms`);
    console.log(`📊 Sonuç: %${progress.progress} (${progress.assignedBlocks}/${progress.totalBlocks})`);
    return this.schedule;
  }

  greedyPlacement() {
    for (const assignment of this.schedule.assignments) {
      for (const block of assignment.blocks) {
        if (block.isAssigned()) continue;
        this.attempts++;
        if (this.attempts > this.maxAttempts) return;
        const slots = this.findBestSlots(assignment, block);
        if (slots) this.assignBlock(assignment, block, slots);
      }
    }
  }

  findBestSlots(assignment, block, ignoreBalance = false) {
    const { classroom, teacher } = assignment;
    const blockSize = block.size;
    const slotsByDay = this.groupSlotsByDay();
    let bestSlots = null;
    let bestScore = -Infinity;

    for (const [dayKey, daySlots] of Object.entries(slotsByDay)) {
      if (!ignoreBalance) {
        const classroomLoad = classroom.getDailyHours(dayKey);
        if (classroomLoad + blockSize > classroom.maxDailyHours) continue;

        // Aynı gün aynı dersten max 1 blok (2+2+1 dağılımı için)
        if (assignment.getBlocksOnDay(dayKey) >= 1 && blockSize === 2) continue;
      }

      for (let i = 0; i <= daySlots.length - blockSize; i++) {
        const consecutiveSlots = daySlots.slice(i, i + blockSize);
        const allAvailable = consecutiveSlots.every(slot =>
          !this.schedule.hasConflict(classroom, teacher, slot.getKey(), slot.id).conflict
        );
        if (allAvailable) {
          const score = this.scoreSlots(consecutiveSlots, assignment, dayKey, ignoreBalance);
          if (score > bestScore) { bestScore = score; bestSlots = consecutiveSlots; }
        }
      }
    }
    return bestSlots;
  }

  scoreSlots(slots, assignment, dayKey, ignoreBalance = false) {
    let score = 1000;
    const { classroom, teacher } = assignment;

    if (!ignoreBalance) {
      score += (classroom.maxDailyHours - classroom.getDailyHours(dayKey)) * 20;
    }

    score -= teacher.getDailyHours(dayKey) * 5;

    // Aynı dersin aynı günde ikinci bloğuna düşük puan (dağıtım için)
    if (assignment.getBlocksOnDay(dayKey) > 0) score -= 30;

    // Sabah dersleri tercih edilsin
    score += (10 - slots[0].period) * 3;

    return score;
  }

  assignBlock(assignment, block, slots) {
    const dayKey = slots[0].dayKey;
    const slotKeys = [];
    for (const slot of slots) {
      this.schedule.assign(assignment, slot.getKey(), dayKey);
      slotKeys.push(slot.getKey());
    }
    assignment.addBlock(block, slotKeys);
    return true;
  }

  repairUnassigned() {
    const unassigned = this.getUnassignedBlocks();
    console.log(`   🔧 ${unassigned.length} blok repair ediliyor...`);
    for (const { assignment, block } of unassigned) {
      if (this.repairAttempts > this.maxRepairAttempts) break;
      this.trySwapRepair(assignment, block);
    }
  }

  getUnassignedBlocks() {
    const unassigned = [];
    for (const assignment of this.schedule.assignments)
      for (const block of assignment.blocks)
        if (!block.isAssigned()) unassigned.push({ assignment, block });
    return unassigned;
  }

  trySwapRepair(assignment, block) {
    this.repairAttempts++;
    const swapCandidates = this.findSwapCandidates(assignment.classroom, block.size);
    for (const candidate of swapCandidates) {
      const candidateSlots = candidate.slots;
      this.unassignBlock(candidate.assignment, candidate.block, candidate.slots);
      const newSlots = this.findBestSlots(assignment, block);
      if (newSlots) {
        this.assignBlock(assignment, block, newSlots);
        const oldSlots = this.findBestSlots(candidate.assignment, candidate.block);
        if (oldSlots) {
          this.assignBlock(candidate.assignment, candidate.block, oldSlots);
          return true;
        } else {
          this.unassignBlock(assignment, block, newSlots);
          this.assignBlock(candidate.assignment, candidate.block, candidateSlots);
        }
      } else {
        this.assignBlock(candidate.assignment, candidate.block, candidateSlots);
      }
    }
    return false;
  }

  findSwapCandidates(classroom, neededSize) {
    const candidates = [];
    for (const assignment of this.schedule.assignments) {
      if (assignment.classroom.id !== classroom.id) continue;
      for (const block of assignment.blocks) {
        if (!block.isAssigned() || block.size < neededSize) continue;
        const slots = block.slots.map(key => {
          const [dayKey, period] = key.split('-');
          return this.schedule.timeSlots.find(
            ts => ts.dayKey === dayKey && ts.period === parseInt(period)
          );
        }).filter(Boolean);
        if (slots.length === block.slots.length)
          candidates.push({ assignment, block, slots });
      }
    }
    return candidates;
  }

  unassignBlock(assignment, block, slots) {
    if (!slots || slots.length === 0) return;
    const dayKey = slots[0].dayKey;
    for (const slot of slots) this.schedule.unassign(assignment, slot.getKey(), dayKey);
    assignment.removeBlock(block);
  }

  balanceDailyLoads() {
    let imbalanced = 0;
    this.schedule.classrooms.forEach(classroom => {
      Object.entries(classroom.dailyHours).forEach(([, hours]) => {
        if (Math.abs(hours - classroom.maxDailyHours) > 2) imbalanced++;
      });
    });
    console.log(imbalanced > 0 ? `   ⚠️ ${imbalanced} gün dengesiz` : `   ✅ Dağılım dengeli`);
  }

  forcePlacement() {
    const unassigned = this.getUnassignedBlocks();
    console.log(`   💪 ${unassigned.length} blok zorla yerleştiriliyor...`);
    for (const { assignment, block } of unassigned) {
      if (this.forceAttempts > this.maxForceAttempts) break;
      this.forceAttempts++;
      const slots = this.findBestSlots(assignment, block, true);
      if (slots) this.assignBlock(assignment, block, slots);
      else this.forceSplitPlacement(assignment, block);
    }
  }

  forceSplitPlacement(assignment, block) {
    const { classroom, teacher } = assignment;
    const foundSlots = [];
    for (const [, daySlots] of Object.entries(this.groupSlotsByDay())) {
      if (foundSlots.length >= block.size) break;
      for (const slot of daySlots) {
        if (foundSlots.length >= block.size) break;
        if (!this.schedule.hasConflict(classroom, teacher, slot.getKey(), slot.id).conflict)
          foundSlots.push(slot);
      }
    }
    if (foundSlots.length >= block.size) {
      this.assignBlock(assignment, block, foundSlots.slice(0, block.size));
      return true;
    }
    return false;
  }

  groupSlotsByDay() {
    const grouped = {};
    this.schedule.timeSlots.forEach(slot => {
      if (!grouped[slot.dayKey]) grouped[slot.dayKey] = [];
      grouped[slot.dayKey].push(slot);
    });
    Object.values(grouped).forEach(arr => arr.sort((a, b) => a.period - b.period));
    return grouped;
  }

  getProgress() {
    let totalBlocks = 0, assignedBlocks = 0;
    this.schedule.assignments.forEach(a => {
      totalBlocks += a.blocks.length;
      assignedBlocks += a.getAssignedBlockCount();
    });
    return {
      progress: totalBlocks > 0 ? ((assignedBlocks / totalBlocks) * 100).toFixed(2) : 0,
      assignedBlocks, totalBlocks,
      remaining: totalBlocks - assignedBlocks
    };
  }

  validate() {
    const errors = [];
    for (const assignment of this.schedule.assignments) {
      if (!assignment.isComplete()) {
        errors.push({
          classroom: assignment.classroom.name,
          subject:   assignment.subject.name,
          teacher:   assignment.teacher.name,
          required:  assignment.weeklyHours,
          assigned:  assignment.assignedHours,
          missing:   assignment.weeklyHours - assignment.assignedHours
        });
      }
    }
    return {
      isValid: errors.length === 0,
      errors,
      summary: `${this.schedule.assignments.length - errors.length}/${this.schedule.assignments.length} atama tamamlandı`
    };
  }

  toDBFormat(schoolId) {
    const rows = [];
    this.schedule.classrooms.forEach(classroom => {
      Object.entries(classroom.schedule).forEach(([slotKey, assignment]) => {
        const [dayKey, periodStr] = slotKey.split('-');
        const timeSlot = this.schedule.timeSlots.find(
          ts => ts.dayKey === dayKey && ts.period === parseInt(periodStr)
        );
        if (!timeSlot) return;
        rows.push({
          school_id:    schoolId,
          classroom_id: classroom.id,
          subject_id:   assignment.subject.id,
          teacher_id:   assignment.teacher.id,
          time_slot_id: timeSlot.id,
          day_name:     timeSlot.dayName,
          period:       timeSlot.period,
          start_time:   timeSlot.startTime,
          end_time:     timeSlot.endTime,
        });
      });
    });
    return rows;
  }
}

export default ScheduleGenerator;