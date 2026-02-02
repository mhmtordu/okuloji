import pool from "./database.js";
import bcrypt from "bcryptjs";

const createAdmin = async () => {
  try {
    console.log("👤 Admin kullanıcısı oluşturuluyor...");

    // Şifreyi hashle
    const password = "Claude123++";
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Önce okul oluştur
    const schoolResult = await pool.query(
      `
      INSERT INTO schools (school_name, school_code, email, school_type, city, district)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING school_id
    `,
      [
        "Mehmet Hoca Test Okulu",
        "MHO001",
        "mhmtordu@gmail.com",
        "Lise",
        "Gaziantep",
        "Şahinbey",
      ]
    );

    const schoolId = schoolResult.rows[0].school_id;
    console.log("✅ Okul oluşturuldu! School ID:", schoolId);

    // Admin kullanıcısı oluştur
    await pool.query(
      `
      INSERT INTO users (school_id, full_name, email, password_hash, role, branch)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [
        schoolId,
        "Mehmet Ordu",
        "mhmtordu@gmail.com",
        passwordHash,
        "admin",
        "Bilişim Teknolojileri",
      ]
    );

    console.log("✅ Admin kullanıcısı oluşturuldu!");
    console.log("📧 Email: mhmtordu@gmail.com");
    console.log("🔑 Şifre: Claude123++");

    process.exit(0);
  } catch (error) {
    console.error("❌ Hata:", error);
    process.exit(1);
  }
};

createAdmin();
