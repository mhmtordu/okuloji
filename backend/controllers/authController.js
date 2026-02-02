import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email ve şifre gerekli!'
      });
    }

    // Kullanıcıyı bul
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email veya şifre hatalı!'
      });
    }

    const user = result.rows[0];

    // Şifreyi kontrol et
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email veya şifre hatalı!'
      });
    }

    // JWT Token oluştur - ✅ İsimleri düzelttik
    const token = jwt.sign(
      { 
        user_id: user.user_id,      // ✅ userId -> user_id
        school_id: user.school_id,  // ✅ schoolId -> school_id
        email: user.email,          // ✅ email eklendi
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      message: 'Giriş başarılı!',
      token,
      user: {
        userId: user.user_id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        schoolId: user.school_id
      }
    });
  } catch (error) {
    console.error('Login hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası!'
    });
  }
};

// Get Current User
export const getMe = async (req, res) => {
  try {
    // ✅ req.user.userId -> req.user.user_id
    const result = await pool.query(
      'SELECT user_id, school_id, full_name, email, role, branch FROM users WHERE user_id = $1',
      [req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı!'
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('GetMe hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası!'
    });
  }
};