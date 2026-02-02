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
  UserCheck,
  AlertCircle,
  CheckCircle,
  Edit,
  Clock,
} from "lucide-react";
import "./Dashboard.css";

function Classrooms() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]); // ← YENİ!
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form state
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState(""); // ← YENİ!
  
  // Sınıf seviyeleri
  const gradeLevels = [
    "Ana Sınıfı",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "Hazırlık",
    "9",
    "10",
    "11",
    "12",
  ];
  
  // Şube harfleri
  const sections = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

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
    
    fetchClassrooms();
    fetchTeachers(); // ← YENİ!
  }, [navigate]);

  const fetchClassrooms = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/classrooms", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setClassrooms(data.classrooms);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setMessage({ type: "error", text: "Şubeler yüklenirken hata oluştu" });
    }
  };

  // ← YENİ FONKSIYON!
  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/teachers?school_id=1", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log('Öğretmenler:', data); // Debug
      
      if (data.success) {
        setTeachers(data.data || []);
      }
    } catch (error) {
      console.error("Öğretmenler getirilemedi:", error);
    }
  };

  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    
    if (!selectedGrade || !selectedSection) {
      setMessage({ type: "error", text: "Lütfen sınıf ve şube seçiniz!" });
      return;
    }
    
    setLoading(true);
    setMessage({ type: "", text: "" });
    
    const classroomName = `${selectedGrade}/${selectedSection}`;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/classrooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          classroom_name: classroomName,
          grade_level: selectedGrade,
          student_count: 0,
          class_teacher_id: selectedTeacher || null, // ← YENİ!
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: "success", text: "Şube başarıyla oluşturuldu!" });
        setSelectedGrade("");
        setSelectedSection("");
        setSelectedTeacher(""); // ← YENİ!
        fetchClassrooms();
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Bir hata oluştu!" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClassroom = async (id, name) => {
    if (!window.confirm(`${name} şubesini silmek istediğinize emin misiniz?`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/classrooms/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: "success", text: "Şube başarıyla silindi!" });
        fetchClassrooms();
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Şube silinirken hata oluştu!" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const filteredClassrooms = classrooms.filter((classroom) => {
    const searchLower = searchTerm.toLowerCase();
    const classroomName = classroom.classroom_name.toLowerCase();
    const teacherName = classroom.teacher_name
      ? classroom.teacher_name.toLowerCase()
      : "";
    return (
      classroomName.includes(searchLower) || teacherName.includes(searchLower)
    );
  });

  const handleEditClassroom = (id) => {
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    window.open(
      `/classrooms/edit/${id}`,
      "EditClassroom",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
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
          <Link to="/classrooms" className="nav-item active">
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
          <Link to="/schedules" className="nav-item">
            <Calendar size={20} />
            <span>Ders Programları</span>
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
          <h1>📚 Şube Bilgileri</h1>
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

        {/* Şube Ekleme Formu */}
        <div className="form-container">
          <form onSubmit={handleCreateClassroom} className="classroom-form">
            <div className="form-section">
              <h3>➕ Yeni Şube Oluştur</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="grade">Sınıf Seviyesi *</label>
                  <select
                    id="grade"
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    required
                  >
                    <option value="">Sınıf seçiniz</option>
                    {gradeLevels.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="section">Şube *</label>
                  <select
                    id="section"
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    required
                  >
                    <option value="">Şube seçiniz</option>
                    {sections.map((section) => (
                      <option key={section} value={section}>
                        {section}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ← YENİ DROPDOWN! */}
                <div className="form-group">
                  <label htmlFor="teacher">Sınıf Öğretmeni (Opsiyonel)</label>
                  <select
                    id="teacher"
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                  >
                    <option value="">Seçiniz</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.user_id} value={teacher.user_id}>
                        {teacher.full_name} {teacher.branch && `(${teacher.branch})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-preview">
                {selectedGrade && selectedSection && (
                  <div className="preview-badge">
                    Oluşturulacak Şube:{" "}
                    <strong>
                      {selectedGrade}/{selectedSection}
                    </strong>
                    {selectedTeacher && teachers.find(t => t.user_id === parseInt(selectedTeacher)) && (
                      <span style={{ marginLeft: '1rem', color: '#10b981' }}>
                        • Öğretmen: {teachers.find(t => t.user_id === parseInt(selectedTeacher))?.full_name}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>Oluşturuluyor...</>
                  ) : (
                    <>
                      <Plus size={20} />
                      <span>Şube Oluştur</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Şubeler Listesi */}
        <div className="classrooms-table-container">
          <div className="table-header">
            <h2>📋 Kayıtlı Şubeler</h2>
            <div className="table-controls">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Şube veya öğretmen ara..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="entries-info">
                <span>
                  Toplam <strong>{filteredClassrooms.length}</strong> şube
                </span>
              </div>
            </div>
          </div>

          {classrooms.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={64} />
              <h3>Henüz şube eklenmemiş</h3>
              <p>Yukarıdaki formdan yeni şube oluşturabilirsiniz</p>
            </div>
          ) : (
            <div className="modern-table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>
                      <div className="th-content">
                        <BookOpen size={16} />
                        <span>Şube Adı</span>
                      </div>
                    </th>
                    <th>
                      <div className="th-content">
                        <UserCheck size={16} />
                        <span>Rehber Öğretmen</span>
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
                  {filteredClassrooms.map((classroom, index) => (
                    <tr
                      key={classroom.classroom_id}
                      className={index % 2 === 0 ? "even-row" : "odd-row"}
                    >
                      <td>
                        <div className="cell-content classroom-name-cell">
                          <div className="badge-pill">
                            {classroom.classroom_name}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="cell-content">
                          {classroom.teacher_name ? (
                            <div className="teacher-badge assigned">
                              <UserCheck size={16} />
                              <span>{classroom.teacher_name}</span>
                            </div>
                          ) : (
                            <div className="teacher-badge not-assigned">
                              <UserCheck size={16} />
                              <span>Atanmamış</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="cell-content">
                          <span className="date-text">
                            {new Date(classroom.created_at).toLocaleDateString(
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
                            className="action-btn edit-btn"
                            onClick={() =>
                              handleEditClassroom(classroom.classroom_id)
                            }
                            title="Düzenle"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() =>
                              handleDeleteClassroom(
                                classroom.classroom_id,
                                classroom.classroom_name
                              )
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

export default Classrooms;