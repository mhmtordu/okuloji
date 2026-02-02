import pool from '../config/database.js';

// Okul bilgilerini getir
export const getSchoolInfo = async (req, res) => {
  try {
    const { schoolId } = req.user; // JWT'den okul ID'si

    const result = await pool.query(
      'SELECT * FROM schools WHERE school_id = $1',
      [schoolId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Okul bulunamadı!'
      });
    }

    res.json({
      success: true,
      school: result.rows[0]
    });
  } catch (error) {
    console.error('Get school error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası!'
    });
  }
};

// Okul bilgilerini güncelle
export const updateSchoolInfo = async (req, res) => {
  try {
    const { schoolId } = req.user;
    const { school_name, school_type, city, district, principal_name, address, phone, email } = req.body;

    // Validation
    if (!school_name || !school_type || !city || !district || !principal_name) {
      return res.status(400).json({
        success: false,
        message: 'Zorunlu alanları doldurun!'
      });
    }

    const result = await pool.query(
      `UPDATE schools 
       SET school_name = $1, school_type = $2, city = $3, district = $4, 
           principal_name = $5, address = $6, phone = $7, email = $8
       WHERE school_id = $9
       RETURNING *`,
      [school_name, school_type, city, district, principal_name, address, phone, email, schoolId]
    );

    res.json({
      success: true,
      message: 'Okul bilgileri güncellendi!',
      school: result.rows[0]
    });
  } catch (error) {
    console.error('Update school error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası!'
    });
  }
};