import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings as SettingsIcon,
  Save,
  AlertCircle,
  CheckCircle,
  User,
  Lock,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "./Dashboard.css";

function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token) {
      navigate("/login");
      return;
    }

    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      setFormData({
        full_name: parsed.fullName || "",
        email: parsed.email || "",
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    // Şifre kontrolü
    if (formData.new_password && formData.new_password !== formData.confirm_password) {
      setMessage({ type: "error", text: "Yeni şifreler eşleşmiyor!" });
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/auth/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "Bilgiler başarıyla güncellendi!" });
        
        // LocalStorage'ı güncelle
        const updatedUser = { ...user, fullName: formData.full_name, email: formData.email };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);

        // Şifre alanlarını temizle
        setFormData({
          ...formData,
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Bir hata oluştu!" });
    } finally {
      setLoading(false);
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
          <form onSubmit={handleSubmit} className="settings-form">
            <div className="form-section">
              <h3>👤 Profil Bilgileri</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="full_name">Ad Soyad</label>
                  <div className="input-with-icon">
                    <User size={20} />
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Ad Soyad"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">E-posta</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="E-posta"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>🔒 Şifre Değiştir</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="current_password">Mevcut Şifre</label>
                  <div className="input-with-icon">
                    <Lock size={20} />
                    <input
                      type="password"
                      id="current_password"
                      name="current_password"
                      value={formData.current_password}
                      onChange={handleChange}
                      placeholder="Mevcut şifreniz"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="new_password">Yeni Şifre</label>
                  <div className="input-with-icon">
                    <Lock size={20} />
                    <input
                      type="password"
                      id="new_password"
                      name="new_password"
                      value={formData.new_password}
                      onChange={handleChange}
                      placeholder="Yeni şifre"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirm_password">Yeni Şifre (Tekrar)</label>
                  <div className="input-with-icon">
                    <Lock size={20} />
                    <input
                      type="password"
                      id="confirm_password"
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      placeholder="Yeni şifre tekrar"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <>Kaydediliyor...</>
                ) : (
                  <>
                    <Save size={20} />
                    <span>Değişiklikleri Kaydet</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Settings;