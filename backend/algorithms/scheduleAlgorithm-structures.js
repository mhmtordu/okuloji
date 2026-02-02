/**
 * ============================================================================
 * DERS PROGRAMI ALGORİTMASI - VERİ YAPILARI (v2.0)
 * ============================================================================
 * 
 * Özellikler:
 * - 2'li blok desteği
 * - Günlük denge takibi
 * - Dinamik ders sayısı
 */

// ============================================================================
// SINIF (Classroom)
// ============================================================================
export class Classroom {
  constructor(id, name, gradeLevel, maxWeeklyHours = 40) {
    this.id = id;
    this.name = name;
    this.gradeLevel = gradeLevel;
    this.maxWeeklyHours = maxWeeklyHours;
    this.schedule = {}; // { "Pazartesi-1": assignment, ... }
    this.totalHours = 0;
    this.dailyHours = { // Günlük takip
      'Pazartesi': 0,
      'Salı': 0,
      'Çarşamba': 0,
      'Perşembe': 0,
      'Cuma': 0
    };
  }

  isSlotEmpty(slotKey) {
    return !this.schedule[slotKey];
  }

  isFull() {
    return this.totalHours >= this.maxWeeklyHours;
  }

  getRemainingHours() {
    return this.maxWeeklyHours - this.totalHours;
  }

  getDailyHours(dayName) {
    return this.dailyHours[dayName] || 0;
  }

  canAssignToDay(dayName, hours, maxDailyHours) {
    const current = this.getDailyHours(dayName);
    return (current + hours) <= maxDailyHours;
  }

  assignToSlot(slotKey, dayName, assignment) {
    this.schedule[slotKey] = assignment;
    this.totalHours++;
    this.dailyHours[dayName]++;
  }

  removeFromSlot(slotKey, dayName) {
    if (this.schedule[slotKey]) {
      delete this.schedule[slotKey];
      this.totalHours--;
      this.dailyHours[dayName]--;
    }
  }
}

// ============================================================================
// ÖĞRETMEN (Teacher)
// ============================================================================
export class Teacher {
  constructor(id, name, branch) {
    this.id = id;
    this.name = name;
    this.branch = branch;
    this.schedule = {}; // { "Pazartesi-1": assignment, ... }
    this.totalHours = 0;
    this.unavailableSlots = new Set();
    this.dailyHours = {
      'Pazartesi': 0,
      'Salı': 0,
      'Çarşamba': 0,
      'Perşembe': 0,
      'Cuma': 0
    };
  }

  isAvailable(slotKey) {
    return !this.schedule[slotKey] && !this.unavailableSlots.has(slotKey);
  }

  getDailyHours(dayName) {
    return this.dailyHours[dayName] || 0;
  }

  assignToSlot(slotKey, dayName, assignment) {
    this.schedule[slotKey] = assignment;
    this.totalHours++;
    this.dailyHours[dayName]++;
  }

  removeFromSlot(slotKey, dayName) {
    if (this.schedule[slotKey]) {
      delete this.schedule[slotKey];
      this.totalHours--;
      this.dailyHours[dayName]--;
    }
  }

  addUnavailableSlot(slotKey) {
    this.unavailableSlots.add(slotKey);
  }

  getRemainingHours() {
    return 40 - this.totalHours;
  }
}

// ============================================================================
// DERS (Subject)
// ============================================================================
export class Subject {
  constructor(id, name, code, weeklyHours, color) {
    this.id = id;
    this.name = name;
    this.code = code;
    this.weeklyHours = weeklyHours;
    this.color = color;
  }
}

// ============================================================================
// ZAMAN DİLİMİ (TimeSlot)
// ============================================================================
export class TimeSlot {
  constructor(id, dayOfWeek, dayName, period, startTime, endTime, isBreak = false) {
    this.id = id;
    this.dayOfWeek = dayOfWeek;
    this.dayName = dayName;
    this.period = period;
    this.startTime = startTime;
    this.endTime = endTime;
    this.isBreak = isBreak;
  }

  getKey() {
    return `${this.dayName}-${this.period}`;
  }

  isBreakTime() {
    return this.isBreak;
  }
}

// ============================================================================
// BLOK (Block) - YENİ!
// ============================================================================
export class Block {
  constructor(size, slots = []) {
    this.size = size; // 1, 2, veya 3
    this.slots = slots; // Atanan slot'lar
    this.assigned = false;
  }

  isAssigned() {
    return this.assigned;
  }

  assign(slots) {
    this.slots = slots;
    this.assigned = true;
  }

  unassign() {
    this.slots = [];
    this.assigned = false;
  }
}

// ============================================================================
// DERS ATAMASI (Assignment) - BLOK DESTEKLİ
// ============================================================================
export class Assignment {
  constructor(id, classroom, subject, teacher, weeklyHours) {
    this.id = id;
    this.classroom = classroom;
    this.subject = subject;
    this.teacher = teacher;
    this.weeklyHours = weeklyHours;
    this.blocks = this.createBlocks(weeklyHours); // YENİ!
    this.assignedHours = 0;
    this.assignedSlots = [];
  }

  // 2'li bloklara böl
  createBlocks(weeklyHours) {
    const blocks = [];
    let remaining = weeklyHours;
    
    // 2'li bloklar oluştur
    while (remaining >= 2) {
      blocks.push(new Block(2));
      remaining -= 2;
    }
    
    // Kalan 1 saat varsa
    if (remaining === 1) {
      blocks.push(new Block(1));
    }
    
    return blocks;
  }

  isComplete() {
    return this.blocks.every(block => block.isAssigned());
  }

  getRemainingBlocks() {
    return this.blocks.filter(block => !block.isAssigned());
  }

  getAssignedBlockCount() {
    return this.blocks.filter(block => block.isAssigned()).length;
  }

  getHoursOnDay(dayName) {
    return this.assignedSlots.filter(slot => 
      slot.startsWith(dayName)
    ).length;
  }

  getBlocksOnDay(dayName) {
    let count = 0;
    for (const block of this.blocks) {
      if (block.isAssigned() && block.slots[0].startsWith(dayName)) {
        count++;
      }
    }
    return count;
  }

  addBlock(block, slotKeys) {
    block.assign(slotKeys);
    this.assignedSlots.push(...slotKeys);
    this.assignedHours += block.size;
  }

  removeBlock(block) {
    const slotKeys = block.slots;
    block.unassign();
    this.assignedSlots = this.assignedSlots.filter(key => !slotKeys.includes(key));
    this.assignedHours -= block.size;
  }
}

// ============================================================================
// PROGRAM (Schedule)
// ============================================================================
export class Schedule {
  constructor() {
    this.classrooms = new Map();
    this.teachers = new Map();
    this.subjects = new Map();
    this.timeSlots = [];
    this.assignments = [];
    this.slotsPerDay = 0; // Dinamik
    this.weeklySlots = 0; // Dinamik
  }

  hasConflict(classroom, teacher, slotKey) {
    // Sınıf dolu mu?
    if (!classroom.isSlotEmpty(slotKey)) {
      return { conflict: true, reason: 'Sınıf dolu' };
    }
    
    // Öğretmen müsait mi?
    if (!teacher.isAvailable(slotKey)) {
      return { conflict: true, reason: 'Öğretmen müsait değil' };
    }
    
    return { conflict: false };
  }

  assign(assignment, slotKey, dayName) {
    const { classroom, teacher } = assignment;
    classroom.assignToSlot(slotKey, dayName, assignment);
    teacher.assignToSlot(slotKey, dayName, assignment);
  }

  unassign(assignment, slotKey, dayName) {
    const { classroom, teacher } = assignment;
    classroom.removeFromSlot(slotKey, dayName);
    teacher.removeFromSlot(slotKey, dayName);
  }

  getStats() {
    return {
      classrooms: this.classrooms.size,
      teachers: this.teachers.size,
      subjects: this.subjects.size,
      timeSlots: this.timeSlots.length,
      slotsPerDay: this.slotsPerDay,
      weeklySlots: this.weeklySlots,
      assignments: this.assignments.length,
      totalBlocks: this.assignments.reduce((sum, a) => sum + a.blocks.length, 0)
    };
  }
}