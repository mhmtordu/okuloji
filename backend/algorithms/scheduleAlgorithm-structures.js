/**
 * scheduleAlgorithm-structures.js (v3.0)
 * CSP tabanlı algoritma için veri yapıları
 */

export class Classroom {
  constructor(id, name, gradeLevel, maxWeeklyHours = 40, shift = 'sabah') {
    this.id = id;
    this.name = name;
    this.gradeLevel = gradeLevel;
    this.maxWeeklyHours = maxWeeklyHours;
    this.shift = shift; // 'sabah' (1-7) | 'ogle' (8-14)
    this.schedule = {};   // slotKey -> Assignment
    this.totalHours = 0;
    this.dailyHours = { Pazartesi: 0, Sali: 0, Carsamba: 0, Persembe: 0, Cuma: 0 };
  }

  isSlotEmpty(slotKey)  { return !this.schedule[slotKey]; }
  isFull()              { return this.totalHours >= this.maxWeeklyHours; }
  getRemainingHours()   { return this.maxWeeklyHours - this.totalHours; }
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
}

export class Teacher {
  constructor(id, name, branch) {
    this.id = id;
    this.name = name;
    this.branch = branch;
    this.schedule = {};   // slotKey -> Assignment
    this.totalHours = 0;
    this.unavailableSlots = new Set(); // time_slot_id seti
    this.dailyHours = { Pazartesi: 0, Sali: 0, Carsamba: 0, Persembe: 0, Cuma: 0 };
  }

  isAvailable(slotKey, timeSlotId) {
    return !this.schedule[slotKey] && !this.unavailableSlots.has(Number(timeSlotId));
  }

  isSlotUnavailable(timeSlotId) {
    return this.unavailableSlots.has(Number(timeSlotId));
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
  constructor(id, dayOfWeek, dayName, dayKey, period, startTime, endTime) {
    this.id = id;
    this.dayOfWeek = dayOfWeek;
    this.dayName = dayName;
    this.dayKey = dayKey;
    this.period = period;
    this.startTime = startTime;
    this.endTime = endTime;
  }

  getKey() { return `${this.dayKey}-${this.period}`; }
}

export class Block {
  constructor(size) {
    this.size = size;
    this.slots = [];
    this.assigned = false;
  }

  isAssigned() { return this.assigned; }
  assign(slots) { this.slots = slots; this.assigned = true; }
  unassign()    { this.slots = []; this.assigned = false; }
}

export class Assignment {
  constructor(id, classroom, subject, teacher, weeklyHours) {
    this.id = id;
    this.classroom = classroom;
    this.subject = subject;
    this.teacher = teacher;
    this.weeklyHours = weeklyHours;
    this.blocks = this._createBlocks(weeklyHours);
    this.assignedHours = 0;
    this.assignedSlots = [];
  }

  _createBlocks(hours) {
    const blocks = [];
    let remaining = hours;
    // Önce 2'li bloklar, sonra 1'li
    while (remaining >= 2) { blocks.push(new Block(2)); remaining -= 2; }
    if (remaining === 1)    blocks.push(new Block(1));
    return blocks;
  }

  isComplete()           { return this.blocks.every(b => b.isAssigned()); }
  getRemainingBlocks()   { return this.blocks.filter(b => !b.isAssigned()); }
  getAssignedBlockCount(){ return this.blocks.filter(b => b.isAssigned()).length; }

  addBlock(block, slotKeys) {
    block.assign(slotKeys);
    this.assignedSlots.push(...slotKeys);
    this.assignedHours += block.size;
  }

  removeBlock(block) {
    const keys = [...block.slots];
    block.unassign();
    this.assignedSlots = this.assignedSlots.filter(k => !keys.includes(k));
    this.assignedHours -= keys.length;
  }
}

export class Schedule {
  constructor() {
    this.classrooms = new Map();
    this.teachers   = new Map();
    this.subjects   = new Map();
    this.timeSlots  = [];
    this.assignments = [];
    this.slotsPerDay = 0;
  }

  assign(assignment, slotKey, dayKey) {
    assignment.classroom.assignToSlot(slotKey, dayKey, assignment);
    assignment.teacher.assignToSlot(slotKey, dayKey, assignment);
  }

  unassign(assignment, slotKey, dayKey) {
    assignment.classroom.removeFromSlot(slotKey, dayKey);
    assignment.teacher.removeFromSlot(slotKey, dayKey);
  }
}
