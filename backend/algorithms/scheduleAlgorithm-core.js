/**
 * ============================================================================
 * DERS PROGRAMI ALGORİTMASI - GREEDY + REPAIR + FORCE (v3.1)
 * ============================================================================
 * 
 * 4 Fazlı Yaklaşım:
 * 1. GREEDY - Hızlıca yerleştir (%70-90)
 * 2. REPAIR - SWAP ile tamir et (%90-95)
 * 3. BALANCE - Günlük dengeleri kontrol et
 * 4. FORCE PLACEMENT - Kalanları zorla yerleştir (%98+)
 */

import {
  Classroom,
  Teacher,
  Subject,
  TimeSlot,
  Assignment,
  Schedule
} from './scheduleAlgorithm-structures.js';

class ScheduleGenerator {
  constructor(options = {}) {
    this.maxAttempts = options.maxAttempts || 100000;
    this.maxRepairAttempts = options.maxRepairAttempts || 2000;
    this.maxForceAttempts = options.maxForceAttempts || 1000;
    this.attempts = 0;
    this.repairAttempts = 0;
    this.forceAttempts = 0;
    this.schedule = new Schedule();
  }

  // ==========================================================================
  // VERİ HAZIRLAMA
  // ==========================================================================

  async prepare(data) {
    console.log('📊 Veri hazırlanıyor...');
    
    this.prepareTimeSlots(data.timeSlots);
    this.calculateDynamicSlots();
    this.prepareClassrooms(data.classrooms);
    this.prepareTeachers(data.teachers);
    this.prepareTeacherUnavailability(data.teacherUnavailability);
    this.prepareSubjects(data.subjectAssignments);
    this.prepareAssignments(data.subjectAssignments);
    
    console.log('✅ Veri hazırlama tamamlandı!');
    console.log(`   📚 ${this.schedule.classrooms.size} sınıf`);
    console.log(`   👨‍🏫 ${this.schedule.teachers.size} öğretmen`);
    console.log(`   📖 ${this.schedule.subjects.size} ders`);
    console.log(`   ⏰ ${this.schedule.timeSlots.length} zaman dilimi`);
    console.log(`   📊 ${this.schedule.slotsPerDay} ders/gün × 5 = ${this.schedule.weeklySlots} saat/hafta`);
    console.log(`   📝 ${this.schedule.assignments.length} ders ataması`);
    console.log(`   🔲 ${this.schedule.getStats().totalBlocks} blok`);
  }

  prepareTimeSlots(timeSlotsData) {
    timeSlotsData.forEach(ts => {
      const timeSlot = new TimeSlot(
        ts.time_slot_id || ts.slot_id,
        ts.day_of_week,
        ts.day_name,
        ts.period,
        ts.start_time,
        ts.end_time,
        ts.is_break || false
      );
      
      if (!timeSlot.isBreak) {
        this.schedule.timeSlots.push(timeSlot);
      }
    });
  }

  calculateDynamicSlots() {
    const firstDaySlots = this.schedule.timeSlots.filter(ts => ts.dayOfWeek === 1);
    this.schedule.slotsPerDay = firstDaySlots.length;
    this.schedule.weeklySlots = this.schedule.slotsPerDay * 5;
    
    if (this.schedule.slotsPerDay === 0) {
      throw new Error('Günlük ders sayısı 0!');
    }
  }

  prepareClassrooms(classroomsData) {
    classroomsData.forEach(c => {
      const classroom = new Classroom(
        c.classroom_id,
        c.classroom_name,
        c.grade_level,
        this.schedule.weeklySlots
      );
      this.schedule.classrooms.set(classroom.id, classroom);
    });
  }

  prepareTeachers(teachersData) {
    teachersData.forEach(t => {
      const teacher = new Teacher(t.user_id, t.full_name, t.branch);
      this.schedule.teachers.set(teacher.id, teacher);
    });
  }

  prepareTeacherUnavailability(unavailabilityData) {
    if (!unavailabilityData || unavailabilityData.length === 0) return;
    
    unavailabilityData.forEach(u => {
      const teacher = this.schedule.teachers.get(u.teacher_id);
      if (teacher) {
        const slotKey = `${u.day_name}-${u.period}`;
        teacher.addUnavailableSlot(slotKey);
      }
    });
    
    console.log(`   ⚠️ ${unavailabilityData.length} öğretmen kısıtlaması eklendi`);
  }

  prepareSubjects(assignmentsData) {
    const subjectsMap = new Map();
    
    assignmentsData.forEach(a => {
      if (!subjectsMap.has(a.subject_id)) {
        const subject = new Subject(
          a.subject_id,
          a.subject_name,
          a.subject_code,
          a.weekly_hours,
          a.color
        );
        subjectsMap.set(subject.id, subject);
      }
    });
    
    this.schedule.subjects = subjectsMap;
  }

  prepareAssignments(assignmentsData) {
    assignmentsData.forEach(a => {
      const classroom = this.schedule.classrooms.get(a.classroom_id);
      const subject = this.schedule.subjects.get(a.subject_id);
      const teacher = this.schedule.teachers.get(a.teacher_id);
      
      if (classroom && subject && teacher) {
        const assignment = new Assignment(
          a.assignment_id,
          classroom,
          subject,
          teacher,
          a.weekly_hours
        );
        this.schedule.assignments.push(assignment);
      }
    });
    
    this.schedule.assignments.sort((a, b) => a.weeklyHours - b.weeklyHours);
  }

  // ==========================================================================
  // ANA GENERATE FONKSİYONU - 4 FAZLI
  // ==========================================================================

  async generate() {
    console.log('🚀 GREEDY + REPAIR + FORCE Algoritması başlıyor...');
    
    const startTime = Date.now();
    
    // PHASE 1: GREEDY
    console.log('\n📌 PHASE 1: GREEDY YERLEŞTİRME');
    this.greedyPlacement();
    let progress = this.getProgress();
    console.log(`   ✅ Greedy tamamlandı: %${progress.progress}`);
    
    // PHASE 2: REPAIR
    if (progress.remaining > 0) {
      console.log('\n🔧 PHASE 2: REPAIR (SWAP ile tamir)');
      this.repairUnassigned();
      progress = this.getProgress();
      console.log(`   ✅ Repair tamamlandı: %${progress.progress}`);
    }
    
    // PHASE 3: BALANCE
    console.log('\n⚖️ PHASE 3: GÜNLÜK DENGE KONTROLÜ');
    this.balanceDailyLoads();
    
    // PHASE 4: FORCE PLACEMENT (YENİ!)
    if (progress.remaining > 0 && progress.progress < 98) {
      console.log('\n💪 PHASE 4: FORCE PLACEMENT (Zorla yerleştirme)');
      this.forcePlacement();
      progress = this.getProgress();
      console.log(`   ✅ Force placement tamamlandı: %${progress.progress}`);
    }
    
    const elapsed = Date.now() - startTime;
    progress = this.getProgress();
    
    if (progress.progress >= 98) {
      console.log(`\n✅ Program başarıyla oluşturuldu!`);
    } else if (progress.progress >= 90) {
      console.log(`\n⚠️ Kısmi program oluşturuldu!`);
    } else {
      console.log(`\n❌ Program oluşturulamadı!`);
    }
    
    console.log(`   ⏱️ Süre: ${elapsed}ms`);
    console.log(`   🔄 Greedy deneme: ${this.attempts}`);
    console.log(`   🔧 Repair sayısı: ${this.repairAttempts}`);
    console.log(`   💪 Force sayısı: ${this.forceAttempts}`);
    console.log(`   ✅ Yerleştirilen: ${progress.assignedBlocks}/${progress.totalBlocks} blok`);
    console.log(`   📊 İlerleme: %${progress.progress}`);
    
    return this.schedule;
  }

  // ==========================================================================
  // PHASE 1: GREEDY
  // ==========================================================================

  greedyPlacement() {
    for (const assignment of this.schedule.assignments) {
      for (const block of assignment.blocks) {
        if (block.isAssigned()) continue;
        
        this.attempts++;
        
        if (this.attempts > this.maxAttempts) {
          return;
        }
        
        const slots = this.findBestSlots(assignment, block);
        
        if (slots && slots.length > 0) {
          this.assignBlock(assignment, block, slots);
        }
      }
    }
  }

  findBestSlots(assignment, block, ignoreBalance = false) {
    const { classroom, teacher } = assignment;
    const blockSize = block.size;
    const slotsByDay = this.groupSlotsByDay();
    
    let bestSlots = null;
    let bestScore = -Infinity;
    
    for (const [dayName, daySlots] of Object.entries(slotsByDay)) {
      // Günlük limit kontrolü (force mode'da gevşet)
      if (!ignoreBalance) {
        const classroomLoad = classroom.getDailyHours(dayName);
        if (classroomLoad + blockSize > this.schedule.slotsPerDay) {
          continue;
        }
      }
      
      for (let i = 0; i <= daySlots.length - blockSize; i++) {
        const consecutiveSlots = daySlots.slice(i, i + blockSize);
        
        const allAvailable = consecutiveSlots.every(slot => {
          const slotKey = slot.getKey();
          const conflict = this.schedule.hasConflict(classroom, teacher, slotKey);
          return !conflict.conflict;
        });
        
        if (allAvailable) {
          const score = this.scoreSlots(consecutiveSlots, assignment, ignoreBalance);
          if (score > bestScore) {
            bestScore = score;
            bestSlots = consecutiveSlots;
          }
        }
      }
    }
    
    return bestSlots;
  }

  scoreSlots(slots, assignment, ignoreBalance = false) {
    let score = 1000;
    
    const { classroom, teacher } = assignment;
    const dayName = slots[0].dayName;
    
    if (!ignoreBalance) {
      // Günlük denge
      const classroomLoad = classroom.getDailyHours(dayName);
      const targetLoad = this.schedule.slotsPerDay;
      score += (targetLoad - classroomLoad) * 20;
    }
    
    // Öğretmen yükü
    const teacherLoad = teacher.getDailyHours(dayName);
    score -= teacherLoad * 5;
    
    // Aynı dersin blokları
    const sameDayBlocks = assignment.getBlocksOnDay(dayName);
    if (sameDayBlocks > 0) {
      score += 15;
    }
    
    // Sabah tercihi
    score += (10 - slots[0].period) * 3;
    
    return score;
  }

  assignBlock(assignment, block, slots) {
    const dayName = slots[0].dayName;
    const slotKeys = [];
    
    for (const slot of slots) {
      const slotKey = slot.getKey();
      this.schedule.assign(assignment, slotKey, dayName);
      slotKeys.push(slotKey);
    }
    
    assignment.addBlock(block, slotKeys);
    return true;
  }

  // ==========================================================================
  // PHASE 2: REPAIR
  // ==========================================================================

  repairUnassigned() {
    const unassigned = this.getUnassignedBlocks();
    
    console.log(`   🔧 ${unassigned.length} blok yerleştirilemedi, SWAP başlıyor...`);
    
    for (const { assignment, block } of unassigned) {
      if (this.repairAttempts > this.maxRepairAttempts) {
        console.log(`   ⚠️ Max repair attempt'e ulaşıldı`);
        break;
      }
      
      const success = this.trySwapRepair(assignment, block);
      
      if (success) {
        console.log(`   ✅ ${assignment.classroom.name} - ${assignment.subject.name} SWAP ile yerleştirildi`);
      }
    }
  }

  getUnassignedBlocks() {
    const unassigned = [];
    
    for (const assignment of this.schedule.assignments) {
      for (const block of assignment.blocks) {
        if (!block.isAssigned()) {
          unassigned.push({ assignment, block });
        }
      }
    }
    
    return unassigned;
  }

  trySwapRepair(assignment, block) {
    this.repairAttempts++;
    
    const { classroom } = assignment;
    const swapCandidates = this.findSwapCandidates(classroom, block.size);
    
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
        if (block.isAssigned() && block.size >= neededSize) {
          const slotKeys = block.slots;
          const slots = slotKeys.map(key => {
            const [day, period] = key.split('-');
            return this.schedule.timeSlots.find(ts => 
              ts.dayName === day && ts.period === parseInt(period)
            );
          }).filter(Boolean);
          
          candidates.push({ assignment, block, slots });
        }
      }
    }
    
    return candidates;
  }

  unassignBlock(assignment, block, slots) {
    if (!slots || slots.length === 0) return;
    
    const dayName = slots[0].dayName;
    
    for (const slot of slots) {
      const slotKey = slot.getKey();
      this.schedule.unassign(assignment, slotKey, dayName);
    }
    
    assignment.removeBlock(block);
  }

  // ==========================================================================
  // PHASE 3: BALANCE
  // ==========================================================================

  balanceDailyLoads() {
    const imbalanced = [];
    
    this.schedule.classrooms.forEach(classroom => {
      Object.entries(classroom.dailyHours).forEach(([day, hours]) => {
        const diff = Math.abs(hours - this.schedule.slotsPerDay);
        if (diff > 0) {
          imbalanced.push({
            classroom: classroom.name,
            day,
            current: hours,
            target: this.schedule.slotsPerDay,
            diff
          });
        }
      });
    });
    
    if (imbalanced.length > 0) {
      console.log(`   ⚠️ ${imbalanced.length} gün dengesiz`);
    } else {
      console.log(`   ✅ Tüm günler dengeli!`);
    }
  }

  // ==========================================================================
  // PHASE 4: FORCE PLACEMENT (YENİ!)
  // ==========================================================================

  forcePlacement() {
    const unassigned = this.getUnassignedBlocks();
    
    console.log(`   💪 ${unassigned.length} blok kalıyor, zorla yerleştiriliyor...`);
    
    for (const { assignment, block } of unassigned) {
      if (this.forceAttempts > this.maxForceAttempts) {
        console.log(`   ⚠️ Max force attempt'e ulaşıldı`);
        break;
      }
      
      this.forceAttempts++;
      
      // Günlük dengeyi görmezden gel
      const slots = this.findBestSlots(assignment, block, true);
      
      if (slots) {
        this.assignBlock(assignment, block, slots);
        console.log(`   ✅ ${assignment.classroom.name} - ${assignment.subject.name} zorla yerleştirildi`);
      } else {
        // Son çare: tek tek bölünmüş yerleştirme
        const success = this.forceSplitPlacement(assignment, block);
        if (success) {
          console.log(`   ✅ ${assignment.classroom.name} - ${assignment.subject.name} bölünerek yerleştirildi`);
        } else {
          console.log(`   ⚠️ ${assignment.classroom.name} - ${assignment.subject.name}: ${block.size} saat yerleştirilemedi`);
        }
      }
    }
  }

  forceSplitPlacement(assignment, block) {
    const { classroom, teacher } = assignment;
    const blockSize = block.size;
    const slotsByDay = this.groupSlotsByDay();
    
    // Tek tek slot bul (ardışık olmasa bile)
    const foundSlots = [];
    
    for (const [dayName, daySlots] of Object.entries(slotsByDay)) {
      if (foundSlots.length >= blockSize) break;
      
      for (const slot of daySlots) {
        if (foundSlots.length >= blockSize) break;
        
        const slotKey = slot.getKey();
        const conflict = this.schedule.hasConflict(classroom, teacher, slotKey);
        
        if (!conflict.conflict) {
          foundSlots.push(slot);
        }
      }
    }
    
    if (foundSlots.length >= blockSize) {
      const slotsToUse = foundSlots.slice(0, blockSize);
      this.assignBlock(assignment, block, slotsToUse);
      return true;
    }
    
    return false;
  }

  // ==========================================================================
  // YARDIMCI FONKSİYONLAR
  // ==========================================================================

  groupSlotsByDay() {
    const grouped = {};
    
    this.schedule.timeSlots.forEach(slot => {
      if (!grouped[slot.dayName]) {
        grouped[slot.dayName] = [];
      }
      grouped[slot.dayName].push(slot);
    });
    
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => a.period - b.period);
    });
    
    return grouped;
  }

  getProgress() {
    let totalBlocks = 0;
    let assignedBlocks = 0;
    
    this.schedule.assignments.forEach(assignment => {
      totalBlocks += assignment.blocks.length;
      assignedBlocks += assignment.getAssignedBlockCount();
    });
    
    return {
      progress: totalBlocks > 0 ? (assignedBlocks / totalBlocks * 100).toFixed(2) : 0,
      assignedBlocks,
      totalBlocks,
      remaining: totalBlocks - assignedBlocks
    };
  }
}

export default ScheduleGenerator;