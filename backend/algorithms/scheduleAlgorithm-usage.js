/**
 * scheduleAlgorithm-usage.js (v3.0)
 * Kullanım örneği — gerçek veriler DB'den gelir
 */

import ScheduleGenerator from './scheduleAlgorithm-core.js';

const exampleData = {
  timeSlots: [
    { time_slot_id: 1,  day_of_week: 1, period: 1, start_time: '07:10', end_time: '07:45', is_break: false },
    { time_slot_id: 2,  day_of_week: 1, period: 2, start_time: '07:55', end_time: '08:30', is_break: false },
    { time_slot_id: 3,  day_of_week: 1, period: 3, start_time: '08:40', end_time: '09:15', is_break: false },
    { time_slot_id: 4,  day_of_week: 1, period: 4, start_time: '09:25', end_time: '10:00', is_break: false },
    { time_slot_id: 5,  day_of_week: 1, period: 5, start_time: '10:10', end_time: '10:45', is_break: false },
    { time_slot_id: 6,  day_of_week: 1, period: 6, start_time: '10:55', end_time: '11:30', is_break: false },
    { time_slot_id: 7,  day_of_week: 1, period: 7, start_time: '11:40', end_time: '12:15', is_break: false },
    { time_slot_id: 8,  day_of_week: 2, period: 1, start_time: '07:10', end_time: '07:45', is_break: false },
    { time_slot_id: 9,  day_of_week: 2, period: 2, start_time: '07:55', end_time: '08:30', is_break: false },
    { time_slot_id: 10, day_of_week: 2, period: 3, start_time: '08:40', end_time: '09:15', is_break: false },
    { time_slot_id: 11, day_of_week: 2, period: 4, start_time: '09:25', end_time: '10:00', is_break: false },
    { time_slot_id: 12, day_of_week: 2, period: 5, start_time: '10:10', end_time: '10:45', is_break: false },
    { time_slot_id: 13, day_of_week: 2, period: 6, start_time: '10:55', end_time: '11:30', is_break: false },
    { time_slot_id: 14, day_of_week: 2, period: 7, start_time: '11:40', end_time: '12:15', is_break: false },
  ],
  classrooms: [
    { classroom_id: 1, classroom_name: '7/A', grade_level: 7, shift: 'sabah' },
    { classroom_id: 2, classroom_name: '5/A', grade_level: 5, shift: 'ogle'  },
  ],
  teachers: [
    { user_id: 1, full_name: 'MEHMET ORDU',  branch: 'Matematik' },
    { user_id: 2, full_name: 'AYŞE YILDIZ',  branch: 'Türkçe'    },
  ],
  teacherUnavailability: [
    { teacher_id: 1, time_slot_id: 1 }, // Öğretmen 1 Pazartesi 1. saatte müsait değil
  ],
  subjectAssignments: [
    { assignment_id: 1, classroom_id: 1, subject_id: 1, teacher_id: 1, weekly_hours: 4, subject_name: 'Matematik', subject_code: 'MAT', color: '#0EA5E9' },
    { assignment_id: 2, classroom_id: 1, subject_id: 2, teacher_id: 2, weekly_hours: 5, subject_name: 'Türkçe',    subject_code: 'TÜRK', color: '#4F46E5' },
    { assignment_id: 3, classroom_id: 2, subject_id: 1, teacher_id: 1, weekly_hours: 4, subject_name: 'Matematik', subject_code: 'MAT', color: '#0EA5E9' },
  ]
};

async function runExample() {
  console.log('='.repeat(60));
  console.log('OKULOJI - CSP ALGORİTMASI v6.0');
  console.log('='.repeat(60));

  const generator = new ScheduleGenerator();
  await generator.prepare(exampleData);
  await generator.generate();

  const validation = generator.validate();
  console.log('\n📊 VALIDASYON:', validation.summary);
  if (!validation.isValid) {
    validation.errors.forEach(e =>
      console.log(`   ❌ ${e.classroom} / ${e.subject}: ${e.assigned}/${e.required}`)
    );
  }

  const suggestions = generator.getSuggestions();
  if (suggestions.length > 0) {
    console.log('\n💡 ÖNERİLER:');
    suggestions.forEach(s => {
      console.log(`   📌 ${s.classroom} / ${s.subject} (${s.teacher})`);
      s.options.forEach(o => console.log(`      → ${o.message}`));
    });
  }

  const progress = generator.getProgress();
  console.log(`\n✅ Sonuç: %${progress.progress} (${progress.assignedBlocks}/${progress.totalBlocks})`);
}

runExample().catch(console.error);
export { runExample };