-- ============================================================================
-- OKULOJI - GÜNCELLENMIŞ DATABASE SCHEMA
-- ============================================================================

-- Schools Table (Okullar)
CREATE TABLE IF NOT EXISTS schools (
    school_id SERIAL PRIMARY KEY,
    school_name VARCHAR(255) NOT NULL,
    school_type VARCHAR(50) NOT NULL,
    city VARCHAR(100),
    district VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    principal_name VARCHAR(100),
    school_code VARCHAR(50) UNIQUE NOT NULL,
    student_capacity INT,
    current_student_count INT DEFAULT 0,
    teacher_count INT DEFAULT 0,
    classroom_count INT DEFAULT 0,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    website VARCHAR(255),
    founding_year INT,
    meb_code VARCHAR(50),
    notes TEXT
);

-- Users Table (Kullanıcılar - Öğretmenler ve Yöneticiler)
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'teacher',
    phone VARCHAR(20),
    branch VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subjects Table (Dersler)
CREATE TABLE IF NOT EXISTS subjects (
    subject_id SERIAL PRIMARY KEY,
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    subject_name VARCHAR(100) NOT NULL,
    subject_code VARCHAR(20),
    weekly_hours INT DEFAULT 0,
    color VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Classrooms Table (Sınıflar - 5A, 6B gibi)
CREATE TABLE IF NOT EXISTS classrooms (
    classroom_id SERIAL PRIMARY KEY,
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    classroom_name VARCHAR(50) NOT NULL,
    grade_level VARCHAR(50),
    max_weekly_hours INT DEFAULT 40, -- ✅ YENİ: Haftalık maksimum ders saati
    student_count INT DEFAULT 0,
    guide_teacher_id INT REFERENCES users(user_id) ON DELETE SET NULL, -- ✅ DEĞİŞTİ: class_teacher_id → guide_teacher_id
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Time Slots Table (Zaman Dilimleri)
CREATE TABLE IF NOT EXISTS time_slots (
    time_slot_id SERIAL PRIMARY KEY, -- ✅ DEĞİŞTİ: slot_id → time_slot_id
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    slot_name VARCHAR(50) NOT NULL,
    slot_order INT NOT NULL,
    period INT NOT NULL, -- ✅ YENİ: period kolonu (1, 2, 3, ...)
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    day_of_week INT NOT NULL, -- 1=Pazartesi, 2=Salı, ...
    is_break BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_school_day_slot UNIQUE(school_id, day_of_week, slot_order)
);

-- Teacher Unavailability Table (Öğretmen Kısıtlamaları)
CREATE TABLE IF NOT EXISTS teacher_unavailability (
    unavailability_id SERIAL PRIMARY KEY,
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    teacher_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    time_slot_id INT REFERENCES time_slots(time_slot_id) ON DELETE CASCADE, -- ✅ DEĞİŞTİ: slot_id → time_slot_id
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_teacher_unavailability UNIQUE(teacher_id, time_slot_id)
);

-- Subject Assignments Table (Ders Atamaları) -- ✅ YENİ TABLO
CREATE TABLE IF NOT EXISTS subject_assignments (
    assignment_id SERIAL PRIMARY KEY,
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    classroom_id INT REFERENCES classrooms(classroom_id) ON DELETE CASCADE,
    subject_id INT REFERENCES subjects(subject_id) ON DELETE CASCADE,
    teacher_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    weekly_hours INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_classroom_subject UNIQUE(classroom_id, subject_id)
);

-- Schedules Table (Ders Programı) -- ✅ DEĞİŞTİ: schedule → schedules (çoğul)
CREATE TABLE IF NOT EXISTS schedules (
    schedule_id SERIAL PRIMARY KEY,
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    classroom_id INT REFERENCES classrooms(classroom_id) ON DELETE CASCADE,
    subject_id INT REFERENCES subjects(subject_id) ON DELETE CASCADE,
    teacher_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    time_slot_id INT REFERENCES time_slots(time_slot_id) ON DELETE CASCADE, -- ✅ DEĞİŞTİ: slot_id → time_slot_id
    day_name VARCHAR(20) NOT NULL, -- ✅ YENİ: Pazartesi, Salı, ...
    period INT NOT NULL, -- ✅ YENİ: 1, 2, 3, ...
    start_time TIME NOT NULL, -- ✅ YENİ
    end_time TIME NOT NULL, -- ✅ YENİ
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_classroom_time UNIQUE(classroom_id, time_slot_id),
    CONSTRAINT unique_teacher_time UNIQUE(teacher_id, time_slot_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_school ON subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_school ON classrooms(school_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_school ON time_slots(school_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_day ON time_slots(day_of_week);
CREATE INDEX IF NOT EXISTS idx_time_slots_period ON time_slots(period); -- ✅ YENİ
CREATE INDEX IF NOT EXISTS idx_teacher_unavailability_teacher ON teacher_unavailability(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_unavailability_slot ON teacher_unavailability(time_slot_id); -- ✅ YENİ
CREATE INDEX IF NOT EXISTS idx_subject_assignments_classroom ON subject_assignments(classroom_id); -- ✅ YENİ
CREATE INDEX IF NOT EXISTS idx_subject_assignments_teacher ON subject_assignments(teacher_id); -- ✅ YENİ
CREATE INDEX IF NOT EXISTS idx_schedules_school ON schedules(school_id);
CREATE INDEX IF NOT EXISTS idx_schedules_classroom ON schedules(classroom_id);
CREATE INDEX IF NOT EXISTS idx_schedules_teacher ON schedules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day_period ON schedules(day_name, period); -- ✅ YENİ

-- ============================================================================
-- MİGRATION SCRIPT: MEVCUT VERİLERİ KORUYARAK GÜNCELLE
-- ============================================================================

-- 1. time_slots tablosuna period kolonu ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='time_slots' AND column_name='period'
    ) THEN
        ALTER TABLE time_slots ADD COLUMN period INT;
        UPDATE time_slots SET period = slot_order WHERE period IS NULL;
        ALTER TABLE time_slots ALTER COLUMN period SET NOT NULL;
    END IF;
END $$;

-- 2. time_slots primary key'i değiştir (slot_id → time_slot_id)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='time_slots' AND column_name='slot_id'
    ) THEN
        -- Yeni kolon ekle
        ALTER TABLE time_slots ADD COLUMN IF NOT EXISTS time_slot_id SERIAL;
        
        -- Değerleri kopyala
        UPDATE time_slots SET time_slot_id = slot_id WHERE time_slot_id IS NULL;
        
        -- Primary key değiştir (dikkat: foreign key'ler etkilenecek)
        -- NOT: Bu adım riskli, production'da dikkatli yapılmalı
    END IF;
END $$;

-- 3. classrooms tablosuna max_weekly_hours ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='classrooms' AND column_name='max_weekly_hours'
    ) THEN
        ALTER TABLE classrooms ADD COLUMN max_weekly_hours INT DEFAULT 40;
    END IF;
END $$;

-- 4. classrooms tablosunda class_teacher_id → guide_teacher_id
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='classrooms' AND column_name='class_teacher_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='classrooms' AND column_name='guide_teacher_id'
    ) THEN
        ALTER TABLE classrooms RENAME COLUMN class_teacher_id TO guide_teacher_id;
    END IF;
END $$;

-- 5. subject_assignments tablosu yoksa oluştur
CREATE TABLE IF NOT EXISTS subject_assignments (
    assignment_id SERIAL PRIMARY KEY,
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    classroom_id INT REFERENCES classrooms(classroom_id) ON DELETE CASCADE,
    subject_id INT REFERENCES subjects(subject_id) ON DELETE CASCADE,
    teacher_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    weekly_hours INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_classroom_subject UNIQUE(classroom_id, subject_id)
);

-- 6. schedules tablosu yoksa oluştur (schedule → schedules)
CREATE TABLE IF NOT EXISTS schedules (
    schedule_id SERIAL PRIMARY KEY,
    school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
    classroom_id INT REFERENCES classrooms(classroom_id) ON DELETE CASCADE,
    subject_id INT REFERENCES subjects(subject_id) ON DELETE CASCADE,
    teacher_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    time_slot_id INT REFERENCES time_slots(time_slot_id) ON DELETE CASCADE,
    day_name VARCHAR(20) NOT NULL,
    period INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS unique_classroom_slot ON schedules(classroom_id, day_name, period);
CREATE UNIQUE INDEX IF NOT EXISTS unique_teacher_slot ON schedules(teacher_id, day_name, period);

SELECT '✅ Database schema güncellendi!' as result;