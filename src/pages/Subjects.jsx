import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Plus, Trash2, Edit, AlertCircle, CheckCircle, Clock, X } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "./Dashboard.css";

const GRADE_OPTIONS = [
  { value: "", label: "Seçiniz" },
  { value: "1", label: "1. Sınıf" },
  { value: "2", label: "2. Sınıf" },
  { value: "3", label: "3. Sınıf" },
  { value: "4", label: "4. Sınıf" },
  { value: "5", label: "5. Sınıf" },
  { value: "6", label: "6. Sınıf" },
  { value: "7", label: "7. Sınıf" },
  { value: "8", label: "8. Sınıf" },
  { value: "13", label: "Hazırlık" },
  { value: "9", label: "9. Sınıf" },
  { value: "10", label: "10. Sınıf" },
  { value: "11", label: "11. Sınıf" },
  { value: "12", label: "12. Sınıf" },
];

const COLOR_OPTIONS = [
  { value: "#4338ca", name: "Lacivert" },
  { value: "#dc2626", name: "Kırmızı" },
  { value: "#16a34a", name: "Yeşil" },
  { value: "#ea580c", name: "Turuncu" },
  { value: "#7c3aed", name: "Mor" },
  { value: "#0891b2", name: "Cyan" },
  { value: "#db2777", name: "Pembe" },
  { value: "#65a30d", name: "Lime" },
];

const gradeLabel = (level) => {
  if (!level) return "";
  if (level == 13) return "Hazırlık";
  return `${level}. Sınıf`;
};

function Subjects() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const [formData, setFormData] = useState({
    subject_name: "",
    subject_code: "",
    weekly_hours: "",
    color: "#4338ca",
    grade_level: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    fetchSubjects();
  }, [navigate]);

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/subjects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setSubjects(data.subjects);
    } catch (error) {
      setMessage({ type: "error", text: "Dersler yüklenirken hata oluştu" });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "subject_name") {
      const capitalized = value.split(' ').map(w => w.length === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: "success", text: "Ders başarıyla eklendi!" });
        setFormData({ subject_name: "", subject_code: "", weekly_hours: "", color: "#4338ca", grade_level: "" });
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

  const handleEdit = (subject) => {
    setEditData({
      subject_id: subject.subject_id,
      subject_name: subject.subject_name || "",
      subject_code: subject.subject_code || "",
      weekly_hours: subject.weekly_hours || "",
      color: subject.color || "#4338ca",
      grade_level: subject.grade_level || "",
    });
    setEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (name === "subject_code") {
      setEditData({ ...editData, [name]: value.toUpperCase() });
    } else {
      setEditData({ ...editData, [name]: value });
    }
  };

  const handleEditSave = async () => {
    setEditLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/subjects/${editData.subject_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editData),
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: "success", text: "Ders bilgileri güncellendi!" });
        setEditModal(false);
        setEditData(null);
        fetchSubjects();
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Güncelleme sırasında hata oluştu!" });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`${name} dersini silmek istediğinize emin misiniz?`)) return;
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
            {message.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
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
                  <input type="text" id="subject_name" name="subject_name" value={formData.subject_name} onChange={handleChange} required placeholder="Örn: Matematik" />
                </div>
                <div className="form-group">
                  <label htmlFor="subject_code">Ders Kodu *</label>
                  <input type="text" id="subject_code" name="subject_code" value={formData.subject_code} onChange={handleChange} required placeholder="Örn: MAT" maxLength="10" />
                </div>
                <div className="form-group">
                  <label htmlFor="grade_level">Sınıf Seviyesi *</label>
                  <select id="grade_level" name="grade_level" value={formData.grade_level} onChange={handleChange} required>
                    {GRADE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="weekly_hours">Haftalık Saat *</label>
                  <input type="number" id="weekly_hours" name="weekly_hours" value={formData.weekly_hours} onChange={handleChange} required placeholder="Örn: 5" min="1" max="40" />
                </div>
                <div className="form-group">
                  <label htmlFor="color">Renk *</label>
                  <select id="color" name="color" value={formData.color} onChange={handleChange} required>
                    {COLOR_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? <>Ekleniyor...</> : <><Plus size={20} /><span>Ders Ekle</span></>}
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
                <div key={subject.subject_id} className="subject-card" style={{ borderTopColor: subject.color }}>
                  <div className="subject-header">
                    <div className="subject-color-badge" style={{ backgroundColor: subject.color }}></div>
                    <h3>{subject.subject_name}</h3>
                  </div>
                  <div className="subject-info">
                    <div className="info-row">
                      <span className="label">Kod:</span>
                      <span className="code-badge">{subject.subject_code}</span>
                    </div>
                    {subject.grade_level && (
                      <div className="info-row">
                        <span className="label">Sınıf:</span>
                        <span>{gradeLabel(subject.grade_level)}</span>
                      </div>
                    )}
                    <div className="info-row">
                      <Clock size={16} />
                      <span><strong>{subject.weekly_hours}</strong> saat/hafta</span>
                    </div>
                  </div>
                  <div className="subject-actions">
                    <button className="subject-btn edit" onClick={() => handleEdit(subject)} title="Düzenle">
                      <Edit size={16} /> Düzenle
                    </button>
                    <button className="subject-btn delete" onClick={() => handleDelete(subject.subject_id, subject.subject_name)} title="Sil">
                      <Trash2 size={16} /> Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Düzenleme Modalı */}
      {editModal && editData && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>✏️ Ders Düzenle</h3>
              <button className="modal-close" onClick={() => setEditModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Ders Adı *</label>
                <input type="text" name="subject_name" value={editData.subject_name} onChange={handleEditChange} placeholder="Ders Adı" />
              </div>
              <div className="form-group">
                <label>Ders Kodu *</label>
                <input type="text" name="subject_code" value={editData.subject_code} onChange={handleEditChange} placeholder="MAT" maxLength="10" />
              </div>
              <div className="form-group">
                <label>Sınıf Seviyesi</label>
                <select name="grade_level" value={editData.grade_level} onChange={handleEditChange}>
                  {GRADE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Haftalık Saat *</label>
                <input type="number" name="weekly_hours" value={editData.weekly_hours} onChange={handleEditChange} min="1" max="40" />
              </div>
              <div className="form-group">
                <label>Renk</label>
                <select name="color" value={editData.color} onChange={handleEditChange}>
                  {COLOR_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.name}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setEditModal(false)}>İptal</button>
              <button className="btn-primary" onClick={handleEditSave} disabled={editLoading}>
                {editLoading ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Subjects;