import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "./Dashboard.css";

function Subjects() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    subject_name: "",
    subject_code: "",
    weekly_hours: "",
    color: "#4338ca",
  });

  const colorOptions = [
    { value: "#4338ca", name: "Lacivert" },
    { value: "#dc2626", name: "Kırmızı" },
    { value: "#16a34a", name: "Yeşil" },
    { value: "#ea580c", name: "Turuncu" },
    { value: "#7c3aed", name: "Mor" },
    { value: "#0891b2", name: "Cyan" },
    { value: "#db2777", name: "Pembe" },
    { value: "#65a30d", name: "Lime" },
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchSubjects();
  }, [navigate]);

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/subjects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setSubjects(data.subjects);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setMessage({ type: "error", text: "Dersler yüklenirken hata oluştu" });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "subject_name") {
      const capitalized = value
        .split(' ')
        .map(word => {
          if (word.length === 0) return word;
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
      setFormData({ ...formData, [name]: capitalized });
    } else if (name === "subject_code") {
      setFormData({ ...formData, [name]: value.toUpperCase() });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "Ders başarıyla eklendi!" });
        setFormData({
          subject_name: "",
          subject_code: "",
          weekly_hours: "",
          color: "#4338ca",
        });
        fetchSubjects();
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
    if (!window.confirm(`${name} dersini silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/subjects/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "Ders başarıyla silindi!" });
        fetchSubjects();
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Ders silinirken hata oluştu!" });
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
          <form onSubmit={handleSubmit} className="subject-form">
            <div className="form-section">
              <h3>➕ Yeni Ders Ekle</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="subject_name">Ders Adı *</label>
                  <input
                    type="text"
                    id="subject_name"
                    name="subject_name"
                    value={formData.subject_name}
                    onChange={handleChange}
                    required
                    placeholder="Örn: Matematik"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject_code">Ders Kodu *</label>
                  <input
                    type="text"
                    id="subject_code"
                    name="subject_code"
                    value={formData.subject_code}
                    onChange={handleChange}
                    required
                    placeholder="Örn: MAT"
                    maxLength="5"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="weekly_hours">Haftalık Saat *</label>
                  <input
                    type="number"
                    id="weekly_hours"
                    name="weekly_hours"
                    value={formData.weekly_hours}
                    onChange={handleChange}
                    required
                    placeholder="Örn: 5"
                    min="1"
                    max="40"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="color">Renk *</label>
                  <select
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    required
                  >
                    {colorOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? (
                    <>Ekleniyor...</>
                  ) : (
                    <>
                      <Plus size={20} />
                      <span>Ders Ekle</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="subjects-container">
          <h2>📖 Kayıtlı Dersler ({subjects.length})</h2>
          {subjects.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={64} />
              <h3>Henüz ders eklenmemiş</h3>
              <p>Yukarıdaki formdan yeni ders ekleyebilirsiniz</p>
            </div>
          ) : (
            <div className="subjects-grid">
              {subjects.map((subject) => (
                <div
                  key={subject.subject_id}
                  className="subject-card"
                  style={{ borderTopColor: subject.color }}
                >
                  <div className="subject-header">
                    <div
                      className="subject-color-badge"
                      style={{ backgroundColor: subject.color }}
                    ></div>
                    <h3>{subject.subject_name}</h3>
                  </div>
                  <div className="subject-info">
                    <div className="info-row">
                      <span className="label">Kod:</span>
                      <span className="code-badge">{subject.subject_code}</span>
                    </div>
                    <div className="info-row">
                      <Clock size={16} />
                      <span>
                        <strong>{subject.weekly_hours}</strong> saat/hafta
                      </span>
                    </div>
                  </div>
                  <div className="subject-actions">
                    <button
                      className="subject-btn delete"
                      onClick={() =>
                        handleDelete(subject.subject_id, subject.subject_name)
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

export default Subjects;