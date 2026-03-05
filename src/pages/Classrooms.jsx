import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "./Dashboard.css";

function Classrooms() {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    classroom_name: "",
    grade_level: "",
    guide_teacher_id: "",
    shift: "sabah",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchClassrooms();
    fetchTeachers();
  }, [navigate]);

  const fetchClassrooms = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/classrooms", {
        headers: { Authorization: `Bearer ${token}` },
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

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/teachers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTeachers(data.data);
      }
    } catch (error) {
      console.error("Teachers fetch error:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/classrooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "Şube başarıyla eklendi!" });
        setFormData({
          classroom_name: "",
          grade_level: "",
          guide_teacher_id: "",
          shift: "sabah",
        });
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

  const handleDelete = async (id, name) => {
    if (!window.confirm(`${name} şubesini silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/classrooms/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

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

  return (
    <div className="dashboard">
      <Sidebar onLogout={handleLogout} />

      <main className="main-content">
        <Header />

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

        <div className="form-container">
          <form onSubmit={handleSubmit} className="classroom-form">
            <div className="form-section">
              <h3>➕ Yeni Şube Ekle</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="classroom_name">Şube Adı *</label>
                  <input
                    type="text"
                    id="classroom_name"
                    name="classroom_name"
                    value={formData.classroom_name}
                    onChange={handleChange}
                    required
                    placeholder="Örn: 5-A"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="grade_level">Sınıf Seviyesi *</label>
                  <select
                    id="grade_level"
                    name="grade_level"
                    value={formData.grade_level}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seçiniz</option>
                    <option value="5">5. Sınıf</option>
                    <option value="6">6. Sınıf</option>
                    <option value="7">7. Sınıf</option>
                    <option value="8">8. Sınıf</option>
                    <option value="9">9. Sınıf</option>
                    <option value="10">10. Sınıf</option>
                    <option value="11">11. Sınıf</option>
                    <option value="12">12. Sınıf</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="guide_teacher_id">Rehber Öğretmen</label>
                  <select
                    id="guide_teacher_id"
                    name="guide_teacher_id"
                    value={formData.guide_teacher_id}
                    onChange={handleChange}
                  >
                    <option value="">Seçiniz</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.user_id} value={teacher.user_id}>
                        {teacher.full_name} - {teacher.branch}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Devre Grubu</label>
                  <div className="shift-toggle">
                    <button
                      type="button"
                      className={`toggle-btn ${formData.shift === "sabah" ? "active" : ""}`}
                      onClick={() => setFormData({ ...formData, shift: "sabah" })}
                    >
                       Sabah
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${formData.shift === "ogle" ? "active" : ""}`}
                      onClick={() => setFormData({ ...formData, shift: "ogle" })}
                    >
                       Öğle
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? (
                    <>Ekleniyor...</>
                  ) : (
                    <>
                      <Plus size={20} />
                      <span>Şube Ekle</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="classrooms-container">
          <h2>Kayıtlı Şubeler ({classrooms.length})</h2>
          {classrooms.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={64} />
              <h3>Henüz şube eklenmemiş</h3>
              <p>Yukarıdaki formdan yeni şube ekleyebilirsiniz</p>
            </div>
          ) : (
            <div className="classrooms-grid">
              {classrooms.map((classroom) => (
                <div key={classroom.classroom_id} className="classroom-card">
                  <div className="classroom-info">
                    <h3>{classroom.classroom_name}</h3>
                    <p className="classroom-grade">
                      {classroom.grade_level}. Sınıf  
                    </p>
                    <p>  </p>
                    <p className={`classroom-shift ${classroom.shift || "sabah"}`}>
                      {classroom.shift === "ogle" ? "Öğle Grubu" : "Sabah Grubu"}
                    </p>
                    {classroom.guide_teacher_name && (
                      <p className="classroom-teacher">
                        Rehber: {classroom.guide_teacher_name}
                      </p>
                    )}
                  </div>
                  <div className="classroom-actions">
                    <button
                      className="classroom-btn delete"
                      onClick={() =>
                        handleDelete(
                          classroom.classroom_id,
                          classroom.classroom_name
                        )
                      }
                      title="Sil"
                    >
                      <Trash2 size={16} />
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Classrooms;