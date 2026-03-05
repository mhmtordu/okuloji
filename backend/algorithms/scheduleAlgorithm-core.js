/**
 * scheduleAlgorithm-core.js (v6.0 - CSP + Backtracking)
 *
 * Faz 1: Domain hesapla — her atama için geçerli slot listesi
 * Faz 2: MRV sırala — en az seçeneği olan atamayı önce yerleştir
 * Faz 3: Greedy yerleştir — denge gözetarak en iyi slotu seç
 * Faz 4: Backtracking — yerleşemeyen için swap/chain-swap dene
 * Faz 5: Öneri motoru — hala yerleşemeyenlere çözüm öner
 */

console.log('🔄 scheduleAlgorithm-core.js v6.0 (CSP) YÜKLENDİ');

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
    this.schedule = new Schedule();
    this.attempts = 0;
    this.repairAttempts = 0;
    this.forceAttempts = 0;
    this.suggestions = []; // Öneri motoru çıktısı
  }

  // ─────────────────────────────────────────────
  // VERİ HAZIRLAMA
  // ─────────────────────────────────────────────
  async prepare(data) {
    this._prepareTimeSlots(data.timeSlots);
    this._prepareClassrooms(data.classrooms);
    this._prepareTeachers(data.teachers);
    this._prepareUnavailability(data.teacherUnavailability);
    this._prepareAssignments(data.subjectAssignments);
    console.log(`✅ Hazır: ${this.schedule.classrooms.size} sınıf, ${this.schedule.teachers.size} öğretmen, ${this.schedule.timeSlots.length} slot, ${this.schedule.assignments.length} atama`);
  }

  _prepareTimeSlots(data) {
    data.forEach(ts => {
      const d = DAY_MAP[ts.day_of_week];
      if (!d || ts.is_break) return;
      this.schedule.timeSlots.push(new TimeSlot(
        ts.time_slot_id, ts.day_of_week, d.name, d.key,
        ts.period, ts.start_time, ts.end_time
      ));
    });
    this.schedule.slotsPerDay = this.schedule.timeSlots.filter(t => t.dayOfWeek === 1).length;
  }

  _prepareClassrooms(data) {
    data.forEach(c => {
      const maxWeekly = String(c.grade_level) === '8' ? 35 : 40;
      this.schedule.classrooms.set(
        c.classroom_id,
        new Classroom(c.classroom_id, c.classroom_name, c.grade_level, maxWeekly, c.shift || 'sabah')
      );
    });
  }

  _prepareTeachers(data) {
    data.forEach(t => {
      this.schedule.teachers.set(t.user_id, new Teacher(t.user_id, t.full_name, t.branch));
    });
  }

  _prepareUnavailability(data) {
    if (!data?.length) return;
    data.forEach(u => {
      const t = this.schedule.teachers.get(u.teacher_id);
      if (t) t.addUnavailableSlot(u.time_slot_id);
    });
  }

  _prepareAssignments(data) {
    const subjects = new Map();
    data.forEach(a => {
      if (!subjects.has(a.subject_id))
        subjects.set(a.subject_id, new Subject(a.subject_id, a.subject_name, a.subject_code, a.weekly_hours, a.color));
    });
    this.schedule.subjects = subjects;

    data.forEach(a => {
      const classroom = this.schedule.classrooms.get(a.classroom_id);
      const subject   = subjects.get(a.subject_id);
      const teacher   = this.schedule.teachers.get(a.teacher_id);
      if (!classroom || !subject || !teacher) {
        console.warn(`⚠️ Eksik: classroom=${a.classroom_id} subject=${a.subject_id} teacher=${a.teacher_id}`);
        return;
      }
      this.schedule.assignments.push(new Assignment(a.assignment_id, classroom, subject, teacher, a.weekly_hours));
    });
  }

  // ─────────────────────────────────────────────
  // ANA ÜRETIM
  // ─────────────────────────────────────────────
  async generate() {
    const start = Date.now();
    console.log('\n🚀 CSP Algoritması başlıyor...');

    // FAZ 1: MRV sıralaması — en kısıtlı atamayı önce yerleştir
    this._sortByMRV();

    // FAZ 2: Greedy yerleştirme
    console.log('📌 FAZ 1: GREEDY');
    this._greedy();
    let p = this.getProgress();
    console.log(`   ✅ ${p.assignedBlocks}/${p.totalBlocks} blok (%${p.progress})`);

    // FAZ 3: Backtracking ile swap
    if (p.remaining > 0) {
      console.log('🔧 FAZ 2: BACKTRACKING');
      this._backtrack();
      p = this.getProgress();
      console.log(`   ✅ ${p.assignedBlocks}/${p.totalBlocks} blok (%${p.progress})`);
    }

    // FAZ 4: Chain swap — daha derin takas
    if (p.remaining > 0) {
      console.log('🔗 FAZ 3: CHAIN SWAP');
      this._chainSwap();
      p = this.getProgress();
      console.log(`   ✅ ${p.assignedBlocks}/${p.totalBlocks} blok (%${p.progress})`);
    }

    // FAZ 5: Öneri motoru
    if (p.remaining > 0) {
      console.log('💡 FAZ 4: ÖNERİ MOTORU');
      this._buildSuggestions();
      console.log(`   💡 ${this.suggestions.length} öneri üretildi`);
    }

    console.log(`\n⏱️ Süre: ${Date.now() - start}ms`);
    console.log(`📊 Sonuç: %${p.progress} (${p.assignedBlocks}/${p.totalBlocks})`);
    return this.schedule;
  }

  // ─────────────────────────────────────────────
  // MRV: En kısıtlı atamayı önce sırala
  // ─────────────────────────────────────────────
  _sortByMRV() {
    // Her atama için domain büyüklüğünü hesapla
    this.schedule.assignments.sort((a, b) => {
      const domainA = this._getDomainSize(a);
      const domainB = this._getDomainSize(b);
      if (domainA !== domainB) return domainA - domainB; // az domain önce
      // Eşitse öğretmenin kaç sınıfa girdiğine bak
      const loadA = this._getTeacherClassCount(a.teacher.id);
      const loadB = this._getTeacherClassCount(b.teacher.id);
      return loadB - loadA; // çok sınıfa giren önce
    });
  }

  _getDomainSize(assignment) {
    const slots = this._getValidSlots(assignment.classroom, assignment.teacher, 2);
    return slots.length;
  }

  _getTeacherClassCount(teacherId) {
    return this.schedule.assignments.filter(a => a.teacher.id === teacherId).length;
  }

  // ─────────────────────────────────────────────
  // FAZ 1: GREEDY
  // ─────────────────────────────────────────────
  _greedy() {
    for (const assignment of this.schedule.assignments) {
      for (const block of assignment.blocks) {
        if (block.isAssigned()) continue;
        this.attempts++;
        const slots = this._findBestSlots(assignment, block.size);
        if (slots) this._assign(assignment, block, slots);
      }
    }
  }

  // En iyi slot: denge + shift + ardışıklık
  _findBestSlots(assignment, size) {
    const { classroom, teacher } = assignment;
    const validSlots = this._getValidSlots(classroom, teacher, size);
    if (validSlots.length === 0) return null;

    // En iyi slotu seç: o günde en az ders olan gün
    let best = null;
    let bestScore = Infinity;

    for (const slotGroup of validSlots) {
      const dayKey = slotGroup[0].dayKey;
      const classroomDaily = classroom.getDailyHours(dayKey);
      const teacherDaily   = teacher.getDailyHours(dayKey);

      // Aynı dersin aynı günde tekrar olmasını engelle
      const alreadyOnDay = assignment.assignedSlots.some(k => k.startsWith(dayKey));
      const penalty = alreadyOnDay ? 100 : 0;

      const score = classroomDaily + teacherDaily + penalty;
      if (score < bestScore) {
        bestScore = score;
        best = slotGroup;
      }
    }
    return best;
  }

  // Shift'e göre filtrelenmiş geçerli ardışık slot grupları
  _getValidSlots(classroom, teacher, size) {
    const byDay = this._slotsByDay();
    const result = [];

    for (const [dayKey, slots] of Object.entries(byDay)) {
      // Shift filtresi
      const filtered = slots.filter(s => {
        if (classroom.shift === 'sabah') return s.period <= 7;
        if (classroom.shift === 'ogle')  return s.period >= 8;
        return true;
      });

      // Ardışık gruplar bul
      for (let i = 0; i <= filtered.length - size; i++) {
        const group = filtered.slice(i, i + size);
        // Ardışık mı kontrol et
        let isConsecutive = true;
        for (let j = 1; j < group.length; j++) {
          if (group[j].period !== group[j-1].period + 1) { isConsecutive = false; break; }
        }
        if (!isConsecutive) continue;

        const ok = group.every(slot =>
          classroom.isSlotEmpty(slot.getKey()) &&
          teacher.isAvailable(slot.getKey(), slot.id)
        );
        if (ok) result.push(group);
      }
    }
    return result;
  }

  _assign(assignment, block, slots) {
    const dayKey = slots[0].dayKey;
    for (const slot of slots) {
      this.schedule.assign(assignment, slot.getKey(), dayKey);
    }
    assignment.addBlock(block, slots.map(s => s.getKey()));
  }

  _unassign(assignment, block) {
    if (!block.isAssigned()) return;
    for (const key of [...block.slots]) {
      const [dayKey] = key.split('-');
      this.schedule.unassign(assignment, key, dayKey);
    }
    assignment.removeBlock(block);
  }

  // ─────────────────────────────────────────────
  // FAZ 2: BACKTRACKING — swap ile yerleştir
  // ─────────────────────────────────────────────
  _backtrack() {
    const unassigned = this._getUnassigned();
    console.log(`   🔧 ${unassigned.length} blok için backtracking...`);

    for (const { assignment, block } of unassigned) {
      this.repairAttempts++;
      if (this._trySwap(assignment, block)) continue;
    }
  }

  _trySwap(assignment, block) {
    // Aynı sınıftaki atanmış blokları bul
    for (const other of this.schedule.assignments) {
      if (other.id === assignment.id) continue;
      if (other.classroom.id !== assignment.classroom.id) continue;

      for (const otherBlock of other.blocks) {
        if (!otherBlock.isAssigned()) continue;

        const savedSlots = [...otherBlock.slots];
        this._unassign(other, otherBlock);

        // Yeni atamayı dene
        const newSlots = this._findBestSlots(assignment, block.size);
        if (newSlots) {
          this._assign(assignment, block, newSlots);
          // Eski atamayı yeni yere koymayı dene
          const oldNewSlots = this._findBestSlots(other, otherBlock.size);
          if (oldNewSlots) {
            this._assign(other, otherBlock, oldNewSlots);
            return true;
          }
          // Olmadı, geri al
          this._unassign(assignment, block);
        }

        // Eski atamayı eski yerine geri koy
        const restored = savedSlots.map(key => {
          const [dayKey, period] = key.split('-');
          return this.schedule.timeSlots.find(ts => ts.dayKey === dayKey && ts.period === parseInt(period));
        }).filter(Boolean);

        if (restored.length === otherBlock.size) {
          this._assign(other, otherBlock, restored);
        }
      }
    }
    return false;
  }

  // ─────────────────────────────────────────────
  // FAZ 3: CHAIN SWAP — öğretmen bazlı derin takas
  // ─────────────────────────────────────────────
  _chainSwap() {
    const unassigned = this._getUnassigned();
    console.log(`   🔗 ${unassigned.length} blok için chain swap...`);

    for (const { assignment, block } of unassigned) {
      this.forceAttempts++;

      // Aynı öğretmenin diğer sınıflardaki bloklarını bak
      const teacherBlocks = [];
      for (const other of this.schedule.assignments) {
        if (other.teacher.id !== assignment.teacher.id) continue;
        if (other.id === assignment.id) continue;
        for (const ob of other.blocks) {
          if (ob.isAssigned()) teacherBlocks.push({ assignment: other, block: ob });
        }
      }

      // Öğretmenin mevcut bloklarından birini kaldır, boşalan slota yeni bloğu yerleştir
      for (const { assignment: other, block: otherBlock } of teacherBlocks) {
        const savedSlots = [...otherBlock.slots];
        this._unassign(other, otherBlock);

        const newSlots = this._findBestSlots(assignment, block.size);
        if (newSlots) {
          this._assign(assignment, block, newSlots);
          const restore = this._findBestSlots(other, otherBlock.size);
          if (restore) {
            this._assign(other, otherBlock, restore);
            break;
          }
          this._unassign(assignment, block);
        }

        // Geri koy
        const restored = savedSlots.map(key => {
          const [dayKey, period] = key.split('-');
          return this.schedule.timeSlots.find(ts => ts.dayKey === dayKey && ts.period === parseInt(period));
        }).filter(Boolean);
        if (restored.length === otherBlock.size) this._assign(other, otherBlock, restored);
      }
    }
  }

  // ─────────────────────────────────────────────
  // FAZ 4: ÖNERİ MOTORU
  // Yerleşemeyen her blok için "şu öğretmenin şu saati müsait olsa yerleşir" önerisi
  // ─────────────────────────────────────────────
  _buildSuggestions() {
    const unassigned = this._getUnassigned();
    this.suggestions = [];

    for (const { assignment, block } of unassigned) {
      const { classroom, teacher } = assignment;
      const suggestion = {
        classroom:   classroom.name,
        subject:     assignment.subject.name,
        teacher:     teacher.name,
        blockSize:   block.size,
        weeklyHours: assignment.weeklyHours,
        reason:      '',
        options:     [],
      };

      // Shift'e uygun tüm slotları tara
      const shiftSlots = this.schedule.timeSlots.filter(s => {
        if (classroom.shift === 'sabah') return s.period <= 7;
        if (classroom.shift === 'ogle')  return s.period >= 8;
        return true;
      });

      // Sınıf dolu mu?
      const classroomFull = shiftSlots.every(s => !classroom.isSlotEmpty(s.getKey()));
      if (classroomFull) {
        suggestion.reason = `${classroom.name} sınıfı shift saatlerinde tamamen dolu`;
        this.suggestions.push(suggestion);
        continue;
      }

      // Öğretmen çakışmalarını bul
      const blockedByTeacher = [];
      for (const slot of shiftSlots) {
        if (!classroom.isSlotEmpty(slot.getKey())) continue;
        if (!teacher.isAvailable(slot.getKey(), slot.id)) {
          if (teacher.isSlotUnavailable(slot.id)) {
            blockedByTeacher.push({
              type: 'unavailability',
              day:  slot.dayName,
              period: slot.period,
              slotId: slot.id,
              message: `${teacher.name} - ${slot.dayName} ${slot.period}. saat müsait değil (kısıtlama)`
            });
          } else {
            // Başka sınıfta ders var
            const conflictAssignment = teacher.schedule[slot.getKey()];
            blockedByTeacher.push({
              type: 'conflict',
              day:  slot.dayName,
              period: slot.period,
              slotId: slot.id,
              conflictClass: conflictAssignment?.classroom?.name || '?',
              message: `${teacher.name} - ${slot.dayName} ${slot.period}. saatte ${conflictAssignment?.classroom?.name || '?'} sınıfında ders veriyor`
            });
          }
        }
      }

      // Öneri: Eğer unavailability kısıtı kaldırılırsa yerleşebilir mi?
      const unavailableBlocking = blockedByTeacher.filter(b => b.type === 'unavailability');
      if (unavailableBlocking.length > 0 && block.size <= 2) {
        // Geçici olarak kısıtı kaldırıp dene
        for (const blocked of unavailableBlocking) {
          teacher.unavailableSlots.delete(blocked.slotId);
          const testSlots = this._findBestSlots(assignment, block.size);
          teacher.unavailableSlots.add(blocked.slotId);

          if (testSlots) {
            suggestion.options.push({
              action: 'remove_unavailability',
              teacher: teacher.name,
              day: blocked.day,
              period: blocked.period,
              slotId: blocked.slotId,
              message: `${teacher.name} öğretmeninin ${blocked.day} ${blocked.period}. saatindeki müsait olmama kısıtı kaldırılırsa bu ders yerleşebilir`
            });
          }
        }
      }

      if (suggestion.options.length === 0 && blockedByTeacher.length > 0) {
        suggestion.reason = `${teacher.name} shift saatlerinde tüm uygun slotlarda başka dersler var`;
        // Çakışan dersleri listele
        const conflicts = blockedByTeacher.filter(b => b.type === 'conflict').slice(0, 3);
        conflicts.forEach(c => suggestion.options.push({
          action: 'info',
          message: c.message
        }));
      } else if (suggestion.options.length === 0) {
        suggestion.reason = 'Uygun slot bulunamadı';
      }

      this.suggestions.push(suggestion);
    }
  }

  // ─────────────────────────────────────────────
  // YARDIMCI METODLAR
  // ─────────────────────────────────────────────
  _slotsByDay() {
    const grouped = {};
    for (const slot of this.schedule.timeSlots) {
      if (!grouped[slot.dayKey]) grouped[slot.dayKey] = [];
      grouped[slot.dayKey].push(slot);
    }
    for (const arr of Object.values(grouped)) arr.sort((a, b) => a.period - b.period);
    return grouped;
  }

  _getUnassigned() {
    const list = [];
    for (const a of this.schedule.assignments)
      for (const b of a.blocks)
        if (!b.isAssigned()) list.push({ assignment: a, block: b });
    return list;
  }

  getProgress() {
    let total = 0, assigned = 0;
    for (const a of this.schedule.assignments) {
      total    += a.blocks.length;
      assigned += a.getAssignedBlockCount();
    }
    return {
      progress:       total > 0 ? ((assigned / total) * 100).toFixed(2) : '0.00',
      assignedBlocks: assigned,
      totalBlocks:    total,
      remaining:      total - assigned,
    };
  }

  validate() {
    const errors = [];
    for (const a of this.schedule.assignments) {
      if (!a.isComplete()) {
        errors.push({
          classroom: a.classroom.name,
          subject:   a.subject.name,
          teacher:   a.teacher.name,
          required:  a.weeklyHours,
          assigned:  a.assignedHours,
          missing:   a.weeklyHours - a.assignedHours,
        });
      }
    }
    return {
      isValid:  errors.length === 0,
      errors,
      summary:  `${this.schedule.assignments.length - errors.length}/${this.schedule.assignments.length} atama tamamlandı`,
    };
  }

  getSuggestions() {
    return this.suggestions;
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