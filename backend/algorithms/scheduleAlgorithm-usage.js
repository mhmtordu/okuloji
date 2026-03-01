/**
 * scheduleAlgorithm-usage.js
 * Algoritmanın nasıl kullanılacağını gösteren örnek dosya
 */

import ScheduleGenerator from './scheduleAlgorithm-core.js';

// Örnek kullanım — gerçek veriler DB'den gelir
const exampleData = {
  timeSlots: [
    { time_slot_id: 1, day_of_week: 1, period: 1, start_time: '07:50', end_time: '08:35', is_break: false },
    { time_slot_id: 2, day_of_week: 1, period: 2, start_time: '09:00', end_time: '09:45', is_break: false },
    { time_slot_id: 3, day_of_week: 1, period: 3, start_time: '09:50', end_time: '10:35', is_break: false },
    { time_slot_id: 4, day_of_week: 1, period: 4, start_time: '10:40', end_time: '11:25', is_break: false },
    { time_slot_id: 5, day_of_week: 1, period: 5, start_time: '11:30', end_time: '12:15', is_break: false },
    { time_slot_id: 6, day_of_week: 1, period: 6, start_time: '12:35', end_time: '13:20', is_break: false },
    { time_slot_id: 7, day_of_week: 1, period: 7, start_time: '13:25', end_time: '14:10', is_break: false },
    { time_slot_id: 8, day_of_week: 1, period: 8, start_time: '14:10', end_time: '14:55', is_break: false },
    // Salı
    { time_slot_id: 9,  day_of_week: 2, period: 1, start_time: '07:50', end_time: '08:35', is_break: false },
    { time_slot_id: 10, day_of_week: 2, period: 2, start_time: '09:00', end_time: '09:45', is_break: false },
    { time_slot_id: 11, day_of_week: 2, period: 3, start_time: '09:50', end_time: '10:35', is_break: false },
    { time_slot_id: 12, day_of_week: 2, period: 4, start_time: '10:40', end_time: '11:25', is_break: false },
    { time_slot_id: 13, day_of_week: 2, period: 5, start_time: '11:30', end_time: '12:15', is_break: false },
    { time_slot_id: 14, day_of_week: 2, period: 6, start_time: '12:35', end_time: '13:20', is_break: false },
    { time_slot_id: 15, day_of_week: 2, period: 7, start_time: '13:25', end_time: '14:10', is_break: false },
    { time_slot_id: 16, day_of_week: 2, period: 8, start_time: '14:10', end_time: '14:55', is_break: false },
  ],

  classrooms: [
    { classroom_id: 1, classroom_name: 'Y.DIL5-A', grade_level: '5' },
    { classroom_id: 2, classroom_name: 'Y.DIL7-A', grade_level: '7' },
    { classroom_id: 3, classroom_name: '8-A',      grade_level: '8' },
  ],

  teachers: [
    { user_id: 1, full_name: 'MEHMET ORDU',   branch: 'Bilişim' },
    { user_id: 2, full_name: 'FURKAN KIRAZ',  branch: 'Türkçe'  },
    { user_id: 3, full_name: 'SIBEL YILMAZ',  branch: 'Matematik' },
  ],

  teacherUnavailability: [
    // Öğretmen 1, time_slot_id 1'de müsait değil
    { teacher_id: 1, time_slot_id: 1 },
  ],

  subjectAssignments: [
    {
      assignment_id: 1,
      classroom_id: 1,
      subject_id: 1,
      teacher_id: 1,
      weekly_hours: 2,
      subject_name: 'Yapay Zeka',
      subject_code: 'YZ',
      color: '#667eea'
    },
    {
      assignment_id: 2,
      classroom_id: 1,
      subject_id: 2,
      teacher_id: 2,
      weekly_hours: 5,
      subject_name: 'Türkçe',
      subject_code: 'TRK',
      color: '#ef4444'
    },
    {
      assignment_id: 3,
      classroom_id: 3,
      subject_id: 3,
      teacher_id: 3,
      weekly_hours: 4,
      subject_name: 'Matematik',
      subject_code: 'MAT',
      color: '#10b981'
    },
  ]
};

async function runExample() {
  console.log('='.repeat(60));
  console.log('OKULOJI - DERS PROGRAMI ALGORİTMASI ÖRNEK KULLANIM');
  console.log('='.repeat(60));

  const generator = new ScheduleGenerator({
    maxAttempts:       100000,
    maxRepairAttempts: 2000,
    maxForceAttempts:  1000,
  });

  // 1. Veriyi hazırla
  await generator.prepare(exampleData);

  // 2. Programı oluştur
  const schedule = await generator.generate();

  // 3. Validasyon
  const validation = generator.validate();
  console.log('\n📊 VALIDASYON:');
  console.log(`   ${validation.summary}`);
  if (!validation.isValid) {
    console.log('   Eksik atamalar:');
    validation.errors.forEach(e => {
      console.log(`   - ${e.classroom} / ${e.subject}: ${e.assigned}/${e.required} saat`);
    });
  }

  // 4. İlerleme
  const progress = generator.getProgress();
  console.log('\n📈 İLERLEME:');
  console.log(`   Toplam blok:    ${progress.totalBlocks}`);
  console.log(`   Yerleşen blok:  ${progress.assignedBlocks}`);
  console.log(`   Başarı oranı:   %${progress.progress}`);

  // 5. DB formatına çevir
  const dbRows = generator.toDBFormat(1);
  console.log(`\n💾 DB'ye yazılacak satır sayısı: ${dbRows.length}`);
  console.log('\nİlk 3 satır:');
  dbRows.slice(0, 3).forEach(row => {
    console.log(`   Sınıf:${row.classroom_id} Ders:${row.subject_id} Öğretmen:${row.teacher_id} ${row.day_name} ${row.period}.ders`);
  });

  // 6. Sınıf programını görüntüle
  console.log('\n📅 Y.DIL5-A SINIFI PROGRAMI:');
  const classroom = schedule.classrooms.get(1);
  if (classroom) {
    const days = ['Pazartesi', 'Sali', 'Carsamba', 'Persembe', 'Cuma'];
    days.forEach(day => {
      const periods = [];
      for (let p = 1; p <= 8; p++) {
        const slotKey = `${day}-${p}`;
        const assignment = classroom.schedule[slotKey];
        periods.push(assignment ? assignment.subject.code : '---');
      }
      console.log(`   ${day.padEnd(10)}: ${periods.join(' | ')}`);
    });
    console.log(`   Toplam saat: ${classroom.totalHours}/${classroom.maxWeeklyHours}`);
  }

  console.log('\n✅ Örnek çalışma tamamlandı!');
}

// Çalıştır
runExample().catch(console.error);

export { runExample };