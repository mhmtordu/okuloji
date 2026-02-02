import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  LogOut,
  Users,
  BookOpen,
  Calendar,
  Settings,
  School,
  Home,
  FileText,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Mail,
  Award,
  Edit,
  Clock,
} from "lucide-react";
import "./Dashboard.css";

function Teachers() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    branch: "",
    email: "",
    password: "",
  });

  // İsim capitalize fonksiyonu
  const capitalizeName = (name) => {
    return name
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token) {
      navigate("/login");
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }

    fetchTeachers();
  }, [navigate]);

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/teachers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setTeachers(data.data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setMessage({
        type: "error",
        text: "Öğretmenler yüklenirken hata oluştu",
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // İsim VE Branş için capitalize
    if (name === "full_name" || name === "branch") {
      setFormData({
        ...formData,
        [name]: capitalizeName(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/teachers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "Öğretmen başarıyla eklendi!" });
        setFormData({
          full_name: "",
          branch: "",
          email: "",
          password: "",
        });
        fetchTeachers();
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Bir hata oluştu!" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (
      !window.confirm(`${name} öğretmenini silmek istediğinize emin misiniz?`)
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/teachers/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "Öğretmen başarıyla silindi!" });
        fetchTeachers();
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Öğretmen silinirken hata oluştu!" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Arama fonksiyonu
  const filteredTeachers = teachers.filter((teacher) => {
    const searchLower = searchTerm.toLowerCase();
    const teacherName = teacher.full_name.toLowerCase();
    const teacherBranch = teacher.branch ? teacher.branch.toLowerCase() : "";
    const teacherEmail = teacher.email ? teacher.email.toLowerCase() : "";

    return (
      teacherName.includes(searchLower) ||
      teacherBranch.includes(searchLower) ||
      teacherEmail.includes(searchLower)
    );
  });

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
          <Link to="/dashboard" className="nav-item">
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
          <Link to="/teachers" className="nav-item active">
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
        <header className="dashboard-header">
          <h1>👨‍🏫 Öğretmen Bilgileri</h1>
          <div className="user-info">
            <span>{user.email}</span>
            <span className="badge">
              {user.role === "admin" ? "Yönetici" : "Öğretmen"}
            </span>
          </div>
        </header>

        {message.text && (
          <div className={`message-box ${message.type}`}>
            {message.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Öğretmen Ekleme Formu */}
        <div className="form-container">
          <form onSubmit={handleSubmit} className="classroom-form">
            <div className="form-section">
              <h3>➕ Yeni Öğretmen Ekle</h3>

              {/* ZORUNLU ALANLAR - ÜST SATIR */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="full_name">Ad Soyad *</label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    placeholder="Örn: Ahmet Yılmaz"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="branch">Branş *</label>
                  <input
                    type="text"
                    id="branch"
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    required
                    placeholder="Örn: Matematik, Fizik, Beden Eğitimi"
                  />
                </div>
              </div>

              {/* OPSİYONEL ALANLAR - ALT SATIR */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">E-posta (Opsiyonel)</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Örn: ahmet@okul.com"
                  />
                  <small style={{ color: "#64748b", fontSize: "0.875rem" }}>
                    Boş bırakılabilir
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="password">Şifre (Opsiyonel)</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Varsayılan: 123456"
                  />
                  <small style={{ color: "#64748b", fontSize: "0.875rem" }}>
                    Boş bırakılırsa: 123456
                  </small>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>Ekleniyor...</>
                  ) : (
                    <>
                      <Plus size={20} />
                      <span>Öğretmen Ekle</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Öğretmenler Tablosu */}
        <div className="classrooms-table-container">
          <div className="table-header">
            <h2>👥 Kayıtlı Öğretmenler</h2>
            <div className="table-controls">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Öğretmen veya branş ara..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="entries-info">
                <span>
                  Toplam <strong>{filteredTeachers.length}</strong> öğretmen
                </span>
              </div>
            </div>
          </div>

          {teachers.length === 0 ? (
            <div className="empty-state">
              <Users size={64} />
              <h3>Henüz öğretmen eklenmemiş</h3>
              <p>Yukarıdaki formdan yeni öğretmen ekleyebilirsiniz</p>
            </div>
          ) : (
            <div className="modern-table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>
                      <div className="th-content">
                        <Users size={16} />
                        <span>Ad Soyad</span>
                      </div>
                    </th>
                    <th>
                      <div className="th-content">
                        <Award size={16} />
                        <span>Branş</span>
                      </div>
                    </th>
                    <th>
                      <div className="th-content">
                        <Mail size={16} />
                        <span>E-posta</span>
                      </div>
                    </th>
                    <th>
                      <div className="th-content">
                        <Calendar size={16} />
                        <span>Oluşturulma Tarihi</span>
                      </div>
                    </th>
                    <th>
                      <div className="th-content">
                        <Settings size={16} />
                        <span>İşlemler</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map((teacher, index) => (
                    <tr
                      key={teacher.user_id}
                      className={index % 2 === 0 ? "even-row" : "odd-row"}
                    >
                      <td>
                        <div className="cell-content">
                          <strong>{teacher.full_name}</strong>
                        </div>
                      </td>
                      <td>
                        <div className="cell-content">
                          <div className="badge-pill">{teacher.branch}</div>
                        </div>
                      </td>
                      <td>
                        <div className="cell-content">
                          <span className="email-text">
                            {teacher.email || "-"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-content">
                          <span className="date-text">
                            {new Date(teacher.created_at).toLocaleDateString(
                              "tr-TR",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              }
                            )}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-content action-cell">
                          <button
                            className="action-btn delete-btn"
                            onClick={() =>
                              handleDelete(teacher.user_id, teacher.full_name)
                            }
                            title="Sil"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Teachers;
