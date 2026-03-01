/**
 * scheduleAlgorithm-structures.js (v2.3)
 * - Classroom: grade_level bazlı maxDailyHours (8.sınıf→7, diğer→8)
 * - Assignment: MEB blok kuralları (2+2+1 mantığı)
 */

export class Classroom {
  constructor(id, name, gradeLevel, maxWeeklyHours = 40) {
    this.id = id;
    this.name = name;
    this.gradeLevel = gradeLevel;
    this.maxWeeklyHours = maxWeeklyHours;
    this.maxDailyHours = String(gradeLevel) === '8' ? 7 : 8;
    this.schedule = {};
    this.totalHours = 0;
    this.dailyHours = {
      'Pazartesi': 0, 'Sali': 0, 'Carsamba': 0, 'Persembe': 0, 'Cuma': 0
    };
  }

  isSlotEmpty(slotKey) { return !this.schedule[slotKey]; }
  isFull() { return this.totalHours >= this.maxWeeklyHours; }
  getRemainingHours() { return this.maxWeeklyHours - this.totalHours; }
  getDailyHours(dayKey) { return this.dailyHours[dayKey] || 0; }

  canAssignToDay(dayKey, hours) {
    return (this.getDailyHours(dayKey) + hours) <= this.maxDailyHours;
  }

  assignToSlot(slotKey, dayKey, assignment) {
    this.schedule[slotKey] = assignment;
    this.totalHours++;
    if (this.dailyHours[dayKey] !== undefined) this.dailyHours[dayKey]++;
  }

  removeFromSlot(slotKey, dayKey) {
    if (this.schedule[slotKey]) {
      delete this.schedule[slotKey];
      this.totalHours--;
      if (this.dailyHours[dayKey] !== undefined) this.dailyHours[dayKey]--;
    }
  }
}

export class Teacher {
  constructor(id, name, branch) {
    this.id = id;
    this.name = name;
    this.branch = branch;
    this.schedule = {};
    this.totalHours = 0;
    this.unavailableSlots = new Set();
    this.dailyHours = {
      'Pazartesi': 0, 'Sali': 0, 'Carsamba': 0, 'Persembe': 0, 'Cuma': 0
    };
  }

  isAvailable(slotKey, timeSlotId) {
    return !this.schedule[slotKey] && !this.unavailableSlots.has(Number(timeSlotId));
  }

  getDailyHours(dayKey) { return this.dailyHours[dayKey] || 0; }

  assignToSlot(slotKey, dayKey, assignment) {
    this.schedule[slotKey] = assignment;
    this.totalHours++;
    if (this.dailyHours[dayKey] !== undefined) this.dailyHours[dayKey]++;
  }

  removeFromSlot(slotKey, dayKey) {
    if (this.schedule[slotKey]) {
      delete this.schedule[slotKey];
      this.totalHours--;
      if (this.dailyHours[dayKey] !== undefined) this.dailyHours[dayKey]--;
    }
  }

  addUnavailableSlot(timeSlotId) {
    this.unavailableSlots.add(Number(timeSlotId));
  }

  getRemainingHours() { return 40 - this.totalHours; }
}

export class Subject {
  constructor(id, name, code, weeklyHours, color) {
    this.id = id;
    this.name = name;
    this.code = code;
    this.weeklyHours = weeklyHours;
    this.color = color || '#3b82f6';
  }
}

export class TimeSlot {
  constructor(id, dayOfWeek, dayName, dayKey, period, startTime, endTime, isBreak = false) {
    this.id = id;
    this.dayOfWeek = dayOfWeek;
    this.dayName = dayName;
    this.dayKey = dayKey;
    this.period = period;
    this.startTime = startTime;
    this.endTime = endTime;
    this.isBreak = isBreak;
  }

  getKey() { return `${this.dayKey}-${this.period}`; }
}

export class Block {
  constructor(size, slots = []) {
    this.size = size;
    this.slots = slots;
    this.assigned = false;
  }

  isAssigned() { return this.assigned; }
  assign(slots) { this.slots = slots; this.assigned = true; }
  unassign() { this.slots = []; this.assigned = false; }
}

export class Assignment {
  constructor(id, classroom, subject, teacher, weeklyHours) {
    this.id = id;
    this.classroom = classroom;
    this.subject = subject;
    this.teacher = teacher;
    this.weeklyHours = weeklyHours;
    this.blocks = this.createBlocks(weeklyHours);
    this.assignedHours = 0;
    this.assignedSlots = [];
  }

  createBlocks(weeklyHours) {
    const blocks = [];
    switch (weeklyHours) {
      case 1:
        blocks.push(new Block(1));
        break;
      case 2:
        blocks.push(new Block(2));
        break;
      case 3:
        // 2+1
        blocks.push(new Block(2));
        blocks.push(new Block(1));
        break;
      case 4:
        // 2+2
        blocks.push(new Block(2));
        blocks.push(new Block(2));
        break;
      case 5:
        // 2+2+1
        blocks.push(new Block(2));
        blocks.push(new Block(2));
        blocks.push(new Block(1));
        break;
      case 6:
        // 2+2+2
        blocks.push(new Block(2));
        blocks.push(new Block(2));
        blocks.push(new Block(2));
        break;
      case 7:
        // 2+2+2+1
        blocks.push(new Block(2));
        blocks.push(new Block(2));
        blocks.push(new Block(2));
        blocks.push(new Block(1));
        break;
      case 8:
        // 2+2+2+2
        blocks.push(new Block(2));
        blocks.push(new Block(2));
        blocks.push(new Block(2));
        blocks.push(new Block(2));
        break;
      default:
        let remaining = weeklyHours;
        while (remaining >= 2) { blocks.push(new Block(2)); remaining -= 2; }
        if (remaining === 1) blocks.push(new Block(1));
    }
    return blocks;
  }

  isComplete() { return this.blocks.every(b => b.isAssigned()); }
  getRemainingBlocks() { return this.blocks.filter(b => !b.isAssigned()); }
  getAssignedBlockCount() { return this.blocks.filter(b => b.isAssigned()).length; }

  getBlocksOnDay(dayKey) {
    let count = 0;
    for (const block of this.blocks) {
      if (block.isAssigned() && block.slots[0] && block.slots[0].startsWith(dayKey)) count++;
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
    this.assignedSlots = this.assignedSlots.filter(k => !slotKeys.includes(k));
    this.assignedHours -= block.size;
  }
}

export class Schedule {
  constructor() {
    this.classrooms = new Map();
    this.teachers = new Map();
    this.subjects = new Map();
    this.timeSlots = [];
    this.assignments = [];
    this.slotsPerDay = 0;
    this.weeklySlots = 0;
  }

  hasConflict(classroom, teacher, slotKey, timeSlotId) {
    if (!classroom.isSlotEmpty(slotKey))
      return { conflict: true, reason: 'Sınıf dolu' };
    if (!teacher.isAvailable(slotKey, timeSlotId))
      return { conflict: true, reason: 'Öğretmen müsait değil' };
    return { conflict: false };
  }

  assign(assignment, slotKey, dayKey) {
    assignment.classroom.assignToSlot(slotKey, dayKey, assignment);
    assignment.teacher.assignToSlot(slotKey, dayKey, assignment);
  }

  unassign(assignment, slotKey, dayKey) {
    assignment.classroom.removeFromSlot(slotKey, dayKey);
    assignment.teacher.removeFromSlot(slotKey, dayKey);
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
      totalBlocks: this.assignments.reduce((s, a) => s + a.blocks.length, 0)
    };
  }
}