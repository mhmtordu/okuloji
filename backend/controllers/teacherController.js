import db from '../config/database.js';
import bcrypt from 'bcryptjs';

// Tüm öğretmenleri getir
export const getAllTeachers = async (req, res) => {
    try {
        const school_id = req.user.school_id; // Auth middleware'den gelecek
        
        const result = await db.query(
            `SELECT user_id, school_id, full_name, email, branch, 
                    is_active, created_at, updated_at 
             FROM users 
             WHERE school_id = $1 AND role = 'teacher' 
             ORDER BY full_name ASC`,
            [school_id]
        );
        
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get teachers error:', error);
        res.status(500).json({
            success: false,
            message: 'Öğretmenler getirilirken hata oluştu'
        });
    }
};

// Tek bir öğretmen getir
export const getTeacherById = async (req, res) => {
    try {
        const { id } = req.params;
        const school_id = req.user.school_id;
        
        const result = await db.query(
            `SELECT user_id, school_id, full_name, email, branch, 
                    is_active, created_at, updated_at 
             FROM users 
             WHERE user_id = $1 AND school_id = $2 AND role = 'teacher'`,
            [id, school_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Öğretmen bulunamadı'
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Get teacher error:', error);
        res.status(500).json({
            success: false,
            message: 'Öğretmen getirilirken hata oluştu'
        });
    }
};

// Yeni öğretmen ekle
export const createTeacher = async (req, res) => {
    try {
        const { full_name, branch, email, password } = req.body;
        const school_id = req.user.school_id; // Auth middleware'den school_id alıyoruz
        
        // Zorunlu alanları kontrol et
        if (!full_name || !branch) {
            return res.status(400).json({
                success: false,
                message: 'Ad Soyad ve Branş zorunludur'
            });
        }
        
        // Email varsa ve kullanılıyorsa kontrol et
        if (email) {
            const checkEmail = await db.query(
                'SELECT user_id FROM users WHERE email = $1',
                [email]
            );
            
            if (checkEmail.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Bu email adresi zaten kullanılıyor'
                });
            }
        }
        
        // Email yoksa unique bir email oluştur (geçici)
        const teacherEmail = email || `teacher_${Date.now()}_${Math.random().toString(36).substring(7)}@temp.okul.com`;
        
        // Şifre hash'leme (varsayılan 123456)
        const password_hash = await bcrypt.hash(password || '123456', 10);
        
        const result = await db.query(
            `INSERT INTO users (school_id, full_name, email, branch, 
                               password_hash, role, is_active) 
             VALUES ($1, $2, $3, $4, $5, 'teacher', true) 
             RETURNING user_id, school_id, full_name, email, branch, 
                       is_active, created_at`,
            [school_id, full_name, teacherEmail, branch, password_hash]
        );
        
        res.status(201).json({
            success: true,
            message: 'Öğretmen başarıyla eklendi',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Create teacher error:', error);
        res.status(500).json({
            success: false,
            message: 'Öğretmen eklenirken hata oluştu',
            error: error.message
        });
    }
};

// Öğretmen güncelle
export const updateTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, email, branch, is_active } = req.body;
        const school_id = req.user.school_id;
        
        // Email varsa ve başka kullanıcıda kullanılıyor mu kontrol et
        if (email) {
            const checkEmail = await db.query(
                'SELECT user_id FROM users WHERE email = $1 AND user_id != $2',
                [email, id]
            );
            
            if (checkEmail.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Bu email adresi başka bir kullanıcı tarafından kullanılıyor'
                });
            }
        }
        
        const result = await db.query(
            `UPDATE users 
             SET full_name = $1, email = $2, branch = $3, 
                 is_active = $4, updated_at = CURRENT_TIMESTAMP 
             WHERE user_id = $5 AND school_id = $6 AND role = 'teacher' 
             RETURNING user_id, school_id, full_name, email, branch, 
                       is_active, updated_at`,
            [full_name, email, branch, is_active, id, school_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Öğretmen bulunamadı'
            });
        }
        
        res.json({
            success: true,
            message: 'Öğretmen başarıyla güncellendi',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Update teacher error:', error);
        res.status(500).json({
            success: false,
            message: 'Öğretmen güncellenirken hata oluştu'
        });
    }
};

// Öğretmen sil
export const deleteTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const school_id = req.user.school_id;
        
        // Öğretmenin programda dersi var mı kontrol et
        const checkSchedule = await db.query(
            'SELECT schedule_id FROM schedule WHERE teacher_id = $1',
            [id]
        );
        
        if (checkSchedule.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Bu öğretmenin ders programında dersleri var. Önce dersleri kaldırmalısınız.'
            });
        }
        
        const result = await db.query(
            `DELETE FROM users 
             WHERE user_id = $1 AND school_id = $2 AND role = 'teacher' 
             RETURNING user_id`,
            [id, school_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Öğretmen bulunamadı'
            });
        }
        
        res.json({
            success: true,
            message: 'Öğretmen başarıyla silindi'
        });
    } catch (error) {
        console.error('Delete teacher error:', error);
        res.status(500).json({
            success: false,
            message: 'Öğretmen silinirken hata oluştu'
        });
    }
};