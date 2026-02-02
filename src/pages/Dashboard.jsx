import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Users,
  BookOpen,
  Calendar,
  Settings,
  School,
  Home,
  FileText,
  Clock,
} from "lucide-react";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Stats state'leri
  const [stats, setStats] = useState({
    classrooms: 0,
    subjects: 0,
    teachers: 0,
    schedules: 0,
  });

  useEffect(() => {
    // Token kontrolü
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token) {
      navigate("/login");
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Verileri çek
    fetchStats();
  }, [navigate]);

  const fetchStats = async () => {
    const token = localStorage.getItem("token");

    try {
      // Şubeleri çek
      const classroomsRes = await fetch(
        "http://localhost:5000/api/classrooms",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const classroomsData = await classroomsRes.json();

      // Dersleri çek
      const subjectsRes = await fetch("http://localhost:5000/api/subjects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const subjectsData = await subjectsRes.json();

      // Öğretmenleri çek
      const teachersRes = await fetch("http://localhost:5000/api/teachers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const teachersData = await teachersRes.json();

      // Stats'i güncelle
      setStats({
        classrooms: classroomsData.success
          ? classroomsData.classrooms.length
          : 0,
        subjects: subjectsData.success ? subjectsData.subjects.length : 0,
        teachers: teachersData.success ? teachersData.data.length : 0,
        schedules: 0, // Henüz schedule API'si yok
      });
    } catch (error) {
      console.error("Stats fetch error:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!user) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Okuloji</h2>
        </div>

        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item active">
            <Home size={20} />
            <span>Anasayfa</span>
          </Link>
          <Link to="/school-info" className="nav-item">
            <School size={20} />
            <span>Kurum Bilgileri</span>
          </Link>
          <Link to="/timeslots" className="nav-item">
            <Clock size={20} />
            <span>Zaman Dilimi Ayarları</span>
          </Link>
          <Link to="/classrooms" className="nav-item">
            <BookOpen size={20} />
            <span>Şube Bilgileri</span>
          </Link>
          <Link to="/subjects" className="nav-item">
            <BookOpen size={20} />
            <span>Okutulacak Ders Bilgileri</span>
          </Link>
          <Link to="/teachers" className="nav-item">
            <Users size={20} />
            <span>Öğretmen Bilgileri</span>
          </Link>
          <Link to="/teacher-unavailability" className="nav-item">
            <Users size={20} />
            <span>Öğretmen Kısıtlamaları</span>
          </Link>
          <Link to="/subject-assignments" className="nav-item">
            <Calendar size={20} />
            <span>Ders Atamaları</span>
          </Link>
          <Link to="/reports" className="nav-item">
            <FileText size={20} />
            <span>Raporlar</span>
          </Link>
          <Link to="/settings" className="nav-item">
            <Settings size={20} />
            <span>Ayarlar</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <h1>Hoş Geldiniz, {user.fullName}</h1>
          <div className="user-info">
            <span>{user.email}</span>
            <span className="badge">
              {user.role === "admin" ? "Yönetici" : "Öğretmen"}
            </span>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <BookOpen size={32} />
            </div>
            <div className="stat-info">
              <h3>Şubeler</h3>
              <p className="stat-number">{stats.classrooms}</p>
              <p className="stat-label">Kayıtlı şube</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <BookOpen size={32} />
            </div>
            <div className="stat-info">
              <h3>Dersler</h3>
              <p className="stat-number">{stats.subjects}</p>
              <p className="stat-label">Okutulacak ders</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              <Users size={32} />
            </div>
            <div className="stat-info">
              <h3>Öğretmenler</h3>
              <p className="stat-number">{stats.teachers}</p>
              <p className="stat-label">Kayıtlı öğretmen</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">
              <Calendar size={32} />
            </div>
            <div className="stat-info">
              <h3>Ders Programları</h3>
              <p className="stat-number">{stats.schedules}</p>
              <p className="stat-label">Oluşturulan program</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Hızlı İşlemler</h2>
          <div className="action-buttons">
            <Link to="/school-info" className="action-btn">
              <School size={24} />
              <span>Kurum Bilgileri</span>
            </Link>
            <Link to="/classrooms" className="action-btn">
              <BookOpen size={24} />
              <span>Şube Ekle</span>
            </Link>
            <Link to="/subjects" className="action-btn">
              <BookOpen size={24} />
              <span>Ders Ekle</span>
            </Link>
            <Link to="/teachers" className="action-btn">
              <Users size={24} />
              <span>Öğretmen Ekle</span>
            </Link>
          </div>
        </div>

        {/* Info Box */}
        <div className="info-box">
          <h2>🎉 Okuloji'ye Hoş Geldiniz!</h2>
          <p>Ders programınızı oluşturmak için şu adımları takip edin:</p>
          <ol>
            <li>
              <strong>Kurum Bilgileri:</strong> Okul bilgilerinizi girin
            </li>
            <li>
              <strong>Şube Bilgileri:</strong> Sınıflarınızı oluşturun (9-A,
              10-B vb.)
            </li>
            <li>
              <strong>Okutulacak Ders Bilgileri:</strong> Dersleri tanımlayın
              (Matematik, Fizik vb.)
            </li>
            <li>
              <strong>Öğretmen Bilgileri:</strong> Öğretmenlerinizi ekleyin
            </li>
            <li>
              <strong>Ders Programları:</strong> Programınızı oluşturun
            </li>
          </ol>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
