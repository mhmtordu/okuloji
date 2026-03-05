import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Trash2,
  Edit,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "./Dashboard.css";

function Teachers() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    full_name: "",
    branch: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchTeachers();
  }, [navigate]);

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
      console.error("Fetch error:", error);
      setMessage({ type: "error", text: "Öğretmenler yüklenirken hata oluştu" });
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
        setFormData({ full_name: "", branch: "", email: "", phone: "" });
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
    if (!window.confirm(`${name} öğretmenini silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/teachers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
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
          <form onSubmit={handleSubmit} className="teacher-form">
            <div className="form-section">
              <h3>➕ Yeni Öğretmen Ekle</h3>
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
                    placeholder="Örn: Matematik"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">E-posta</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Örn: ahmet@hotmail.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Telefon</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Örn: 0555 123 4567"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
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

        <div className="teachers-container">
          <h2>👥 Kayıtlı Öğretmenler ({teachers.length})</h2>
          {teachers.length === 0 ? (
            <div className="empty-state">
              <Users size={64} />
              <h3>Henüz öğretmen eklenmemiş</h3>
              <p>Yukarıdaki formdan yeni öğretmen ekleyebilirsiniz</p>
            </div>
          ) : (
            <div className="teachers-grid">
              {teachers.map((teacher) => (
                <div key={teacher.user_id} className="teacher-card">
                  <div className="teacher-info">
                    <h3>{teacher.full_name}</h3>
                    <p className="teacher-branch">{teacher.branch}</p>
                    {teacher.email && <p className="teacher-email">{teacher.email}</p>}
                    {teacher.phone && <p className="teacher-phone">{teacher.phone}</p>}
                  </div>
                  <div className="teacher-actions">
                    <button
                      className="teacher-btn delete"
                      onClick={() => handleDelete(teacher.user_id, teacher.full_name)}
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

export default Teachers;