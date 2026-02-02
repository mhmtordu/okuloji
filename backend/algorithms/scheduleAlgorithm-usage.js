/**
 * DERS PROGRAMI ALGORİTMASI - KULLANIM ÖRNEĞİ
 * 
 * Bu dosya algoritmanın nasıl kullanılacağını gösterir.
 * Controller'dan bu şekilde çağrılacak.
 */

const ScheduleGenerator = require('./scheduleAlgorithm-core');

// ============================================================================
// ÖRNEK KULLANIM
// ============================================================================

async function exampleUsage() {
  console.log('📚 Örnek Kullanım Başlıyor...\n');

  // 1. Mock data (gerçek sistemde database'den gelecek)
  const mockData = {
    timeSlots: [
      // Pazartesi
      { time_slot_id: 1, day_of_week: 1, day_name: 'Pazartesi', period: 1, start_time: '08:00', end_time: '08:45' },
      { time_slot_id: 2, day_of_week: 1, day_name: 'Pazartesi', period: 2, start_time: '08:50', end_time: '09:35' },
      { time_slot_id: 3, day_of_week: 1, day_name: 'Pazartesi', period: 3, start_time: '09:40', end_time: '10:25' },
      { time_slot_id: 4, day_of_week: 1, day_name: 'Pazartesi', period: 4, start_time: '10:30', end_time: '11:15' },
      { time_slot_id: 5, day_of_week: 1, day_name: 'Pazartesi', period: 5, start_time: '11:20', end_time: '12:05' },
      { time_slot_id: 6, day_of_week: 1, day_name: 'Pazartesi', period: 6, start_time: '13:00', end_time: '13:45' },
      { time_slot_id: 7, day_of_week: 1, day_name: 'Pazartesi', period: 7, start_time: '13:50', end_time: '14:35' },
      { time_slot_id: 8, day_of_week: 1, day_name: 'Pazartesi', period: 8, start_time: '14:40', end_time: '15:25' },
      
      // Salı (aynı şekilde...)
      { time_slot_id: 9, day_of_week: 2, day_name: 'Salı', period: 1, start_time: '08:00', end_time: '08:45' },
      { time_slot_id: 10, day_of_week: 2, day_name: 'Salı', period: 2, start_time: '08:50', end_time: '09:35' },
      // ... diğer günler
    ],

    classrooms: [
      { classroom_id: 1, classroom_name: '5/A', grade_level: '5', max_weekly_hours: 40 },
      { classroom_id: 2, classroom_name: '5/B', grade_level: '5', max_weekly_hours: 40 },
      { classroom_id: 3, classroom_name: '8/A', grade_level: '8', max_weekly_hours: 35 },
    ],

    teachers: [
      { user_id: 1, full_name: 'Ahmet Yılmaz', branch: 'Matematik' },
      { user_id: 2, full_name: 'Ayşe Demir', branch: 'Türkçe' },
      { user_id: 3, full_name: 'Mehmet Kaya', branch: 'İngilizce' },
    ],

    teacherUnavailability: [
      // Ahmet Hoca Pazartesi 1. derste müsait değil
      { teacher_id: 1, day_name: 'Pazartesi', period: 1 },
    ],

    subjectAssignments: [
      // 5/A sınıfı
      {
        assignment_id: 1,
        classroom_id: 1,
        subject_id: 1,
        teacher_id: 1,
        subject_name: 'Matematik',
        subject_code: 'MAT',
        weekly_hours: 5,
        color: '#3b82f6'
      },
      {
        assignment_id: 2,
        classroom_id: 1,
        subject_id: 2,
        teacher_id: 2,
        subject_name: 'Türkçe',
        subject_code: 'TUR',
        weekly_hours: 5,
        color: '#ef4444'
      },
      {
        assignment_id: 3,
        classroom_id: 1,
        subject_id: 3,
        teacher_id: 3,
        subject_name: 'İngilizce',
        subject_code: 'ING',
        weekly_hours: 4,
        color: '#10b981'
      },
      
      // 5/B sınıfı (aynı öğretmenler, farklı saatler)
      {
        assignment_id: 4,
        classroom_id: 2,
        subject_id: 1,
        teacher_id: 1,
        subject_name: 'Matematik',
        subject_code: 'MAT',
        weekly_hours: 5,
        color: '#3b82f6'
      },
    ]
  };

  // 2. Generator oluştur
  const generator = new ScheduleGenerator({
    maxAttempts: 10000
  });

  // 3. Verileri hazırla
  await generator.prepare(mockData);

  // 4. Programı oluştur
  console.log('\n🔥 Algoritma çalışıyor...\n');
  const schedule = await generator.generate();

  // 5. Sonuçları göster
  if (schedule) {
    console.log('\n📊 SONUÇLAR:\n');
    
    // Sınıfların programını göster
    schedule.classrooms.forEach(classroom => {
      console.log(`\n📚 ${classroom.name} (${classroom.totalHours}/${classroom.maxWeeklyHours} saat):`);
      
      const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
      days.forEach(day => {
        const dailySchedule = Object.entries(classroom.schedule)
          .filter(([key]) => key.startsWith(day))
          .sort((a, b) => {
            const periodA = parseInt(a[0].split('-')[1]);
            const periodB = parseInt(b[0].split('-')[1]);
            return periodA - periodB;
          });
        
        if (dailySchedule.length > 0) {
          console.log(`  ${day}:`);
          dailySchedule.forEach(([slotKey, assignment]) => {
            const period = slotKey.split('-')[1];
            console.log(`    ${period}. ${assignment.subject.name} (${assignment.teacher.name})`);
          });
        }
      });
    });

    // Öğretmenlerin programını göster
    console.log('\n👨‍🏫 ÖĞRETMEN PROGRAMLARI:\n');
    schedule.teachers.forEach(teacher => {
      console.log(`\n${teacher.name} - ${teacher.branch} (${teacher.totalHours} saat):`);
      
      const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
      days.forEach(day => {
        const dailySchedule = Object.entries(teacher.schedule)
          .filter(([key]) => key.startsWith(day))
          .sort((a, b) => {
            const periodA = parseInt(a[0].split('-')[1]);
            const periodB = parseInt(b[0].split('-')[1]);
            return periodA - periodB;
          });
        
        if (dailySchedule.length > 0) {
          console.log(`  ${day}: ${dailySchedule.map(([k, a]) => 
            `${k.split('-')[1]}.(${a.classroom.name})`
          ).join(', ')}`);
        }
      });
    });

    // İstatistikler
    const stats = schedule.getStats();
    console.log('\n📈 İSTATİSTİKLER:');
    console.log(`   Sınıf sayısı: ${stats.classrooms}`);
    console.log(`   Öğretmen sayısı: ${stats.teachers}`);
    console.log(`   Ders sayısı: ${stats.subjects}`);
    console.log(`   Toplam zaman dilimi: ${stats.timeSlots}`);
    console.log(`   Toplam atama: ${stats.assignments}`);
    console.log(`   Deneme sayısı: ${generator.attempts}`);
    console.log(`   Backtrack sayısı: ${generator.backtrackCount}`);

    // Validasyon
    const validation = generator.validate();
    if (validation.isValid) {
      console.log('\n✅ Validasyon: Başarılı!');
    } else {
      console.log('\n⚠️ Validasyon: Hatalar var!');
      validation.errors.forEach(err => {
        console.log(`   - ${err.classroom}: ${err.subject} (${err.assigned}/${err.required} saat)`);
      });
    }

    return schedule;
  } else {
    console.log('\n❌ Program oluşturulamadı!');
    console.log('💡 Öneriler:');
    console.log('   - Öğretmen sayısını artırın');
    console.log('   - Haftalık ders saatlerini azaltın');
    console.log('   - Öğretmen kısıtlamalarını azaltın');
    console.log('   - maxAttempts değerini artırın');
    
    return null;
  }
}

// ============================================================================
// CONTROLLER İÇİN ÖRNEK KULLANIM
// ============================================================================

async function generateScheduleForSchool(schoolData) {
  try {
    // 1. Generator oluştur
    const generator = new ScheduleGenerator({
      maxAttempts: 10000
    });

    // 2. Verileri hazırla
    await generator.prepare(schoolData);

    // 3. Progress tracking (opsiyonel)
    const progressInterval = setInterval(() => {
      const progress = generator.getProgress();
      console.log(`   Progress: ${progress.progress.toFixed(1)}% (${progress.totalAssigned}/${progress.totalRequired})`);
    }, 2000);

    // 4. Programı oluştur
    const schedule = await generator.generate();

    clearInterval(progressInterval);

    // 5. Sonucu döndür
    if (schedule) {
      return {
        success: true,
        schedule: schedule,
        stats: {
          attempts: generator.attempts,
          backtrackCount: generator.backtrackCount,
          classrooms: schedule.classrooms.size,
          teachers: schedule.teachers.size,
          totalSlots: schedule.getStats().totalSlots
        }
      };
    } else {
      return {
        success: false,
        error: 'Program oluşturulamadı',
        stats: {
          attempts: generator.attempts,
          maxAttempts: generator.maxAttempts
        }
      };
    }
  } catch (error) {
    console.error('❌ Hata:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  exampleUsage,
  generateScheduleForSchool
};

// Eğer doğrudan çalıştırılırsa örneği çalıştır
if (require.main === module) {
  exampleUsage()
    .then(() => {
      console.log('\n✅ Örnek kullanım tamamlandı!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Hata:', error);
      process.exit(1);
    });
}