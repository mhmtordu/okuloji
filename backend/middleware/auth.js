import jwt from 'jsonwebtoken';

const auth = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Giriş yapmalısınız!'
      });
    }
    
    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Decoded token içeriğini req.user'a atıyoruz
    req.user = {
      user_id: decoded.user_id,
      school_id: decoded.school_id, // ✅ School ID burada olmalı
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Geçersiz token!'
    });
  }
};

export default auth;