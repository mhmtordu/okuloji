import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Users, BookOpen, Calendar, School } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    classrooms: 0,
    subjects: 0,
    teachers: 0,
    schedules: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchStats();
  }, [navigate]);

  const fetchStats = async () => {
    const token = localStorage.getItem("token");
    try {
      const classroomsRes = await fetch("http://localhost:5000/api/classrooms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const classroomsData = await classroomsRes.json();

      const subjectsRes = await fetch("http://localhost:5000/api/subjects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const subjectsData = await subjectsRes.json();

      const teachersRes = await fetch("http://localhost:5000/api/teachers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const teachersData = await teachersRes.json();

      setStats({
        classrooms: classroomsData.success ? classroomsData.classrooms.length : 0,
        subjects: subjectsData.success ? subjectsData.subjects.length : 0,
        teachers: teachersData.success ? teachersData.data.length : 0,
        schedules: 0,
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

  return (
    <div className="dashboard">
      <Sidebar onLogout={handleLogout} />

      <main className="main-content">
        <Header />

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

        <div className="info-box">
          <h2>🎉 Okuloji'ye Hoş Geldiniz!</h2>
          <p>Ders programınızı oluşturmak için şu adımları takip edin:</p>
          <ol>
            <li><strong>Kurum Bilgileri:</strong> Okul bilgilerinizi girin</li>
            <li><strong>Şube Bilgileri:</strong> Sınıflarınızı oluşturun (9-A, 10-B vb.)</li>
            <li><strong>Okutulacak Ders Bilgileri:</strong> Dersleri tanımlayın (Matematik, Fizik vb.)</li>
            <li><strong>Öğretmen Bilgileri:</strong> Öğretmenlerinizi ekleyin</li>
            <li><strong>Ders Programları:</strong> Programınızı oluşturun</li>
          </ol>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;