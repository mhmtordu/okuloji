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
  Clock,
  Copy,
  Save,
} from "lucide-react";
import "./Dashboard.css";

function TimeSlots() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Adım kontrolü
  const [step, setStep] = useState(1); // 1: Gün seçimi, 2: Zaman dilimleri

  // Gün seçimi state
  const [selectedDays, setSelectedDays] = useState({
    1: true, // Pazartesi
    2: true, // Salı
    3: true, // Çarşamba
    4: true, // Perşembe
    5: true, // Cuma
    6: false, // Cumartesi
    7: false, // Pazar
  });

  const dayNames = {
    1: "Pazartesi",
    2: "Salı",
    3: "Çarşamba",
    4: "Perşembe",
    5: "Cuma",
    6: "Cumartesi",
    7: "Pazar",
  };

  // Zaman dilimleri form state (Pazartesi için şablon)
  const [timeSlotTemplate, setTimeSlotTemplate] = useState([
    {
      slot_name: "1. Ders",
      start_time: "08:05",
      end_time: "08:45",
      is_break: false,
      break_duration: 15,
    },
    {
      slot_name: "Teneffüs",
      start_time: "08:45",
      end_time: "09:00",
      is_break: true,
      break_duration: 15,
    },
    {
      slot_name: "2. Ders",
      start_time: "09:00",
      end_time: "09:40",
      is_break: false,
      break_duration: 10,
    },
    {
      slot_name: "Teneffüs",
      start_time: "09:40",
      end_time: "09:50",
      is_break: true,
      break_duration: 10,
    },
    {
      slot_name: "3. Ders",
      start_time: "09:50",
      end_time: "10:30",
      is_break: false,
      break_duration: 10,
    },
    {
      slot_name: "Teneffüs",
      start_time: "10:30",
      end_time: "10:40",
      is_break: true,
      break_duration: 10,
    },
    {
      slot_name: "4. Ders",
      start_time: "10:40",
      end_time: "11:20",
      is_break: false,
      break_duration: 10,
    },
    {
      slot_name: "Teneffüs",
      start_time: "11:20",
      end_time: "11:30",
      is_break: true,
      break_duration: 10,
    },
    {
      slot_name: "5. Ders",
      start_time: "11:30",
      end_time: "12:10",
      is_break: false,
      break_duration: 0,
    },
    {
      slot_name: "Öğle Arası",
      start_time: "12:10",
      end_time: "12:35",
      is_break: true,
      break_duration: 25,
    },
    {
      slot_name: "6. Ders",
      start_time: "12:35",
      end_time: "13:15",
      is_break: false,
      break_duration: 10,
    },
    {
      slot_name: "Teneffüs",
      start_time: "13:15",
      end_time: "13:25",
      is_break: true,
      break_duration: 10,
    },
    {
      slot_name: "7. Ders",
      start_time: "13:25",
      end_time: "14:05",
      is_break: false,
      break_duration: 5,
    },
    {
      slot_name: "Teneffüs",
      start_time: "14:05",
      end_time: "14:10",
      is_break: true,
      break_duration: 5,
    },
    {
      slot_name: "8. Ders",
      start_time: "14:10",
      end_time: "14:50",
      is_break: false,
      break_duration: 0,
    },
  ]);

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

    fetchTimeSlots();
  }, [navigate]);

  const fetchTimeSlots = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/timeslots", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setTimeSlots(data.timeSlots);
        // Eğer zaman dilimleri varsa, adım 2'ye geç
        if (data.timeSlots.length > 0) {
          setStep(2);
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setMessage({
        type: "error",
        text: "Zaman dilimleri yüklenirken hata oluştu",
      });
    }
  };

  const handleDayToggle = (day) => {
    setSelectedDays({
      ...selectedDays,
      [day]: !selectedDays[day],
    });
  };

  const handleTemplateChange = (index, field, value) => {
    const newTemplate = [...timeSlotTemplate];
    newTemplate[index][field] = value;
    setTimeSlotTemplate(newTemplate);
  };

  const addTimeSlot = () => {
    setTimeSlotTemplate([
      ...timeSlotTemplate,
      {
        slot_name: "",
        start_time: "",
        end_time: "",
        is_break: false,
        break_duration: 0,
      },
    ]);
  };

  const removeTimeSlot = (index) => {
    const newTemplate = timeSlotTemplate.filter((_, i) => i !== index);
    setTimeSlotTemplate(newTemplate);
  };

  const handleSaveTimeSlots = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      const selectedDaysList = Object.keys(selectedDays).filter(
        (day) => selectedDays[day]
      );

      if (selectedDaysList.length === 0) {
        setMessage({ type: "error", text: "En az bir gün seçmelisiniz!" });
        setLoading(false);
        return;
      }

      // Her seçili gün için tüm zaman dilimlerini kaydet
      for (const day of selectedDaysList) {
        for (let i = 0; i < timeSlotTemplate.length; i++) {
          const slot = timeSlotTemplate[i];

          if (!slot.slot_name || !slot.start_time || !slot.end_time) {
            continue; // Boş satırları atla
          }

          await fetch("http://localhost:5000/api/timeslots", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              slot_name: slot.slot_name,
              slot_order: i + 1,
              start_time: slot.start_time,
              end_time: slot.end_time,
              day_of_week: parseInt(day),
              is_break: slot.is_break,
            }),
          });
        }
      }

      setMessage({
        type: "success",
        text: "Zaman dilimleri başarıyla kaydedildi!",
      });
      fetchTimeSlots();
      setStep(2);
    } catch (error) {
      setMessage({ type: "error", text: "Kaydetme sırasında hata oluştu!" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (
      !window.confirm("TÜM zaman dilimlerini silmek istediğinize emin misiniz?")
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/timeslots", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "Tüm zaman dilimleri silindi!" });
        fetchTimeSlots();
        setStep(1);
      }
    } catch (error) {
      setMessage({ type: "error", text: "Hata oluştu!" });
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
          <Link to="/dashboard" className="nav-item">
            <Home size={20} />
            <span>Anasayfa</span>
          </Link>
          <Link to="/school-info" className="nav-item">
            <School size={20} />
            <span>Kurum Bilgileri</span>
          </Link>

          <Link to="/timeslots" className="nav-item active">
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
        <header className="dashboard-header">
          <h1>⏰ Zaman Dilimi Ayarları</h1>
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

        {/* Adım Göstergesi */}
        <div
          className="steps-indicator"
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "2rem",
            gap: "2rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              opacity: step === 1 ? 1 : 0.5,
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background:
                  step === 1
                    ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    : "#cbd5e1",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                marginRight: "0.5rem",
              }}
            >
              1
            </div>
            <span style={{ fontWeight: step === 1 ? "bold" : "normal" }}>
              Gün Seçimi
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              opacity: step === 2 ? 1 : 0.5,
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background:
                  step === 2
                    ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    : "#cbd5e1",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                marginRight: "0.5rem",
              }}
            >
              2
            </div>
            <span style={{ fontWeight: step === 2 ? "bold" : "normal" }}>
              Zaman Dilimleri
            </span>
          </div>
        </div>

        {/* ADIM 1: Gün Seçimi */}
        {step === 1 && (
          <div className="form-container">
            <div className="form-section">
              <h3>📅 Hangi günler için ders programı oluşturacaksınız?</h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1rem",
                  marginTop: "1.5rem",
                }}
              >
                {Object.keys(dayNames).map((day) => (
                  <div
                    key={day}
                    onClick={() => handleDayToggle(day)}
                    style={{
                      padding: "1.5rem",
                      border: selectedDays[day]
                        ? "3px solid #667eea"
                        : "2px solid #e2e8f0",
                      borderRadius: "12px",
                      cursor: "pointer",
                      background: selectedDays[day] ? "#f0f4ff" : "white",
                      transition: "all 0.3s",
                      textAlign: "center",
                      fontWeight: selectedDays[day] ? "bold" : "normal",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDays[day]}
                      onChange={() => {}}
                      style={{ marginRight: "0.5rem" }}
                    />
                    {dayNames[day]}
                  </div>
                ))}
              </div>

              <div className="form-actions" style={{ marginTop: "2rem" }}>
                <button
                  onClick={() => {
                    const hasSelected = Object.values(selectedDays).some(
                      (v) => v
                    );
                    if (!hasSelected) {
                      setMessage({
                        type: "error",
                        text: "En az bir gün seçmelisiniz!",
                      });
                      return;
                    }
                    setStep(2);
                  }}
                  className="btn-primary"
                  style={{ fontSize: "1.1rem", padding: "1rem 2rem" }}
                >
                  Devam Et →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADIM 2: Zaman Dilimleri */}
        {step === 2 && timeSlots.length === 0 && (
          <div className="form-container">
            <div className="form-section">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <h3>⏰ Ders Saatlerini Kurumunuza Göre Düzenleyiniz</h3>
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary"
                  style={{ fontSize: "0.9rem" }}
                >
                  ← Geri Dön
                </button>
              </div>

              <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
                Seçili günler:{" "}
                <strong>
                  {Object.keys(selectedDays)
                    .filter((d) => selectedDays[d])
                    .map((d) => dayNames[d])
                    .join(", ")}
                </strong>
              </p>

              <div className="modern-table-wrapper">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th style={{ width: "50px" }}>Sıra</th>
                      <th>Ders Adı</th>
                      <th>Giriş Saati</th>
                      <th>Çıkış Saati</th>
                      <th style={{ width: "100px" }}>Teneffüs</th>
                      <th style={{ width: "80px" }}>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlotTemplate.map((slot, index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? "even-row" : "odd-row"}
                      >
                        <td>
                          <strong>{index + 1}</strong>
                        </td>
                        <td>
                          <input
                            type="text"
                            value={slot.slot_name}
                            onChange={(e) =>
                              handleTemplateChange(
                                index,
                                "slot_name",
                                e.target.value
                              )
                            }
                            placeholder="Örn: 1. Ders"
                            style={{
                              width: "100%",
                              padding: "0.5rem",
                              border: "1px solid #e2e8f0",
                              borderRadius: "6px",
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="time"
                            value={slot.start_time}
                            onChange={(e) =>
                              handleTemplateChange(
                                index,
                                "start_time",
                                e.target.value
                              )
                            }
                            style={{
                              width: "100%",
                              padding: "0.5rem",
                              border: "1px solid #e2e8f0",
                              borderRadius: "6px",
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="time"
                            value={slot.end_time}
                            onChange={(e) =>
                              handleTemplateChange(
                                index,
                                "end_time",
                                e.target.value
                              )
                            }
                            style={{
                              width: "100%",
                              padding: "0.5rem",
                              border: "1px solid #e2e8f0",
                              borderRadius: "6px",
                            }}
                          />
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={slot.is_break}
                            onChange={(e) =>
                              handleTemplateChange(
                                index,
                                "is_break",
                                e.target.checked
                              )
                            }
                          />
                        </td>
                        <td>
                          <button
                            onClick={() => removeTimeSlot(index)}
                            className="action-btn delete-btn"
                            title="Sil"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div
                className="form-actions"
                style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}
              >
                <button onClick={addTimeSlot} className="btn-secondary">
                  <Plus size={20} />
                  Satır Ekle
                </button>

                <button
                  onClick={handleSaveTimeSlots}
                  className="btn-primary"
                  disabled={loading}
                  style={{ marginLeft: "auto" }}
                >
                  {loading ? (
                    <>Kaydediliyor...</>
                  ) : (
                    <>
                      <Save size={20} />
                      <span>Kaydet ve Tüm Günlere Uygula</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Kayıtlı Zaman Dilimleri Görünümü */}
        {timeSlots.length > 0 && (
          <div className="classrooms-table-container">
            <div className="table-header">
              <h2>✅ Kayıtlı Zaman Dilimleri</h2>
              <div className="table-controls">
                <button
                  onClick={handleDeleteAll}
                  className="btn-secondary"
                  style={{
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                  }}
                >
                  <Trash2 size={16} />
                  Tümünü Sil ve Yeniden Oluştur
                </button>
              </div>
            </div>

            {/* Günlere göre grupla */}
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const daySlots = timeSlots.filter(
                (slot) => slot.day_of_week === day
              );
              if (daySlots.length === 0) return null;

              return (
                <div key={day} style={{ marginBottom: "2rem" }}>
                  <h3 style={{ color: "#667eea", marginBottom: "1rem" }}>
                    📅 {dayNames[day]} ({daySlots.length} zaman dilimi)
                  </h3>
                  <div className="modern-table-wrapper">
                    <table className="modern-table">
                      <thead>
                        <tr>
                          <th>Sıra</th>
                          <th>Ders Adı</th>
                          <th>Başlangıç</th>
                          <th>Bitiş</th>
                          <th>Tür</th>
                        </tr>
                      </thead>
                      <tbody>
                        {daySlots.map((slot, index) => (
                          <tr
                            key={slot.slot_id}
                            className={index % 2 === 0 ? "even-row" : "odd-row"}
                          >
                            <td>
                              <strong>{slot.slot_order}</strong>
                            </td>
                            <td>
                              <strong>{slot.slot_name}</strong>
                            </td>
                            <td>{slot.start_time.slice(0, 5)}</td>
                            <td>{slot.end_time.slice(0, 5)}</td>
                            <td>
                              {slot.is_break ? (
                                <span
                                  style={{
                                    padding: "0.25rem 0.75rem",
                                    background: "#fef3c7",
                                    color: "#92400e",
                                    borderRadius: "12px",
                                    fontSize: "0.875rem",
                                    fontWeight: "500",
                                  }}
                                >
                                  ☕ Teneffüs
                                </span>
                              ) : (
                                <span
                                  style={{
                                    padding: "0.25rem 0.75rem",
                                    background: "#d1fae5",
                                    color: "#065f46",
                                    borderRadius: "12px",
                                    fontSize: "0.875rem",
                                    fontWeight: "500",
                                  }}
                                >
                                  📚 Ders
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default TimeSlots;
