import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Trash2,
  Edit,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "./Dashboard.css";

const capitalize = (str) => {
  if (!str) return "";
  return str.toLowerCase().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

const formatPhone = (phone) => {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) return `${digits.slice(0,4)} ${digits.slice(4,7)} ${digits.slice(7,9)} ${digits.slice(9,11)}`;
  if (digits.length === 10) return `${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6,8)} ${digits.slice(8,10)}`;
  return phone;
};

function Teachers() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "", branch: "", email: "", phone: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    fetchTeachers();
  }, [navigate]);

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/teachers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setTeachers(data.data);
    } catch (error) {
      setMessage({ type: "error", text: "Öğretmenler yüklenirken hata oluştu" });
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...formData,
          full_name: capitalize(formData.full_name),
          branch: capitalize(formData.branch),
        }),
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

  const handleEdit = (teacher) => {
    setEditData({
      user_id: teacher.user_id,
      full_name: teacher.full_name || "",
      branch: teacher.branch || "",
      email: teacher.email || "",
      phone: teacher.phone || "",
    });
    setEditModal(true);
  };

  const handleEditChange = (e) => setEditData({ ...editData, [e.target.name]: e.target.value });

  const handleEditSave = async () => {
    setEditLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/teachers/${editData.user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          full_name: capitalize(editData.full_name),
          branch: capitalize(editData.branch),
          email: editData.email || null,
          phone: editData.phone || null,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: "success", text: "Öğretmen bilgileri güncellendi!" });
        setEditModal(false);
        setEditData(null);
        fetchTeachers();
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
    if (!window.confirm(`${name} öğretmenini silmek istediğinize emin misiniz?`)) return;
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
            {message.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
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
                  <input type="text" id="full_name" name="full_name" value={formData.full_name} onChange={handleChange} required placeholder="Örn: Ahmet Yılmaz" />
                </div>
                <div className="form-group">
                  <label htmlFor="branch">Branş *</label>
                  <input type="text" id="branch" name="branch" value={formData.branch} onChange={handleChange} required placeholder="Örn: Matematik" />
                </div>
                <div className="form-group">
                  <label htmlFor="email">E-posta</label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="Örn: ahmet@hotmail.com" />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Telefon</label>
                  <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="Örn: 0555 123 4567" />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? <>Ekleniyor...</> : <><Plus size={20} /><span>Öğretmen Ekle</span></>}
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
                    <h3>{capitalize(teacher.full_name)}</h3>
                    <p className="teacher-branch">{capitalize(teacher.branch)}</p>
                    {teacher.phone && <p className="teacher-phone">{formatPhone(teacher.phone)}</p>}
                  </div>
                  <div className="teacher-actions">
                    <button className="teacher-btn edit" onClick={() => handleEdit(teacher)} title="Düzenle">
                      <Edit size={16} /> Düzenle
                    </button>
                    <button className="teacher-btn delete" onClick={() => handleDelete(teacher.user_id, teacher.full_name)} title="Sil">
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
              <h3>✏️ Öğretmen Düzenle</h3>
              <button className="modal-close" onClick={() => setEditModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Ad Soyad *</label>
                <input type="text" name="full_name" value={editData.full_name} onChange={handleEditChange} placeholder="Ad Soyad" />
              </div>
              <div className="form-group">
                <label>Branş *</label>
                <input type="text" name="branch" value={editData.branch} onChange={handleEditChange} placeholder="Branş" />
              </div>
              <div className="form-group">
                <label>E-posta</label>
                <input type="email" name="email" value={editData.email} onChange={handleEditChange} placeholder="E-posta" />
              </div>
              <div className="form-group">
                <label>Telefon</label>
                <input type="tel" name="phone" value={editData.phone} onChange={handleEditChange} placeholder="Telefon" />
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

export default Teachers;