import pool from '../config/database.js';

export const getSchoolInfo = async (req, res) => {
  try {
    const { school_id } = req.user;
    
    const result = await pool.query(
      `SELECT school_id, school_name, school_type, city, district, email, 
              school_code, principal_name, website, phone, address
       FROM schools 
       WHERE school_id = $1`,
      [school_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Okul bulunamadı' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get school error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Okul bilgisi alınamadı',
      error: error.message 
    });
  }
};

export const updateSchoolInfo = async (req, res) => {
  try {
    const { school_id } = req.user;
    const { school_name, school_type, city, district, address, phone, email, principal_name, website } = req.body;
    
    const result = await pool.query(
      `UPDATE schools 
       SET school_name = $1, school_type = $2, city = $3, district = $4, 
           address = $5, phone = $6, email = $7, principal_name = $8, 
           website = $9, updated_at = CURRENT_TIMESTAMP
       WHERE school_id = $10
       RETURNING *`,
      [school_name, school_type, city, district, address, phone, email, principal_name, website, school_id]
    );
    
    res.json({
      success: true,
      message: 'Okul bilgileri güncellendi',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update school error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Okul bilgileri güncellenemedi',
      error: error.message 
    });
  }
};