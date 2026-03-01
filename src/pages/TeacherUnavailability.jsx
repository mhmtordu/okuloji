import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Users, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "./Dashboard.css";

const API_URL = "http://localhost:5000/api";
const SCHOOL_ID = 2;

const DAYS = [
  { id: 1, name: "Pazartesi" },
  { id: 2, name: "Salı" },
  { id: 3, name: "Çarşamba" },
  { id: 4, name: "Perşembe" },
  { id: 5, name: "Cuma" },
];

function TeacherUnavailability() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [timeSlots, setTimeSlots] = useState([]);
  const [unavailability, setUnavailability] = useState([]);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    fetchTeachers();
    fetchTimeSlots();
  }, [navigate]);

  useEffect(() => {
    if (selectedTeacher) fetchUnavailability();
    else setUnavailability([]);
  }, [selectedTeacher]);

  const getToken = () => localStorage.getItem("token");

  const fetchTeachers = async () => {
    try {
      const res = await fetch(`${API_URL}/teachers`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) setTeachers(data.data);
    } catch (e) { console.error(e); }
  };

  const fetchTimeSlots = async () => {
    try {
      const res = await fetch(`${API_URL}/timeslots`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      const slots = data.timeSlots || data.data || (Array.isArray(data) ? data : []);
      setTimeSlots(slots);
    } catch (e) { console.error(e); }
  };

  const fetchUnavailability = async () => {
    try {
      const res = await fetch(
        `${API_URL}/teacher-unavailability?teacher_id=${selectedTeacher}&school_id=${SCHOOL_ID}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      const data = await res.json();
      setUnavailability(data.data || data.unavailabilities || []);
    } catch (e) { console.error(e); }
  };

  // Sadece time_slot_id ile karşılaştır - tabloda day_of_week kolonu yok
  const isUnavailable = (slotId) =>
    unavailability.some((item) => Number(item.time_slot_id) === Number(slotId));

  const getExisting = (slotId) =>
    unavailability.find((item) => Number(item.time_slot_id) === Number(slotId));

  const toggleUnavailability = async (slotId) => {
    const existing = getExisting(slotId);

    if (existing) {
      try {
        const res = await fetch(
          `${API_URL}/teacher-unavailability/${existing.unavailability_id}`,
          { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } }
        );
        if (res.ok) {
          setUnavailability((prev) =>
            prev.filter((item) => item.unavailability_id !== existing.unavailability_id)
          );
          showMessage("✅ Kısıtlama kaldırıldı", "success");
        }
      } catch (e) { showMessage("❌ Hata oluştu!", "error"); }
    } else {
      try {
        const res = await fetch(`${API_URL}/teacher-unavailability`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            teacher_id: parseInt(selectedTeacher),
            school_id: SCHOOL_ID,
            time_slot_id: slotId,
            reason: "Müsait değil",
          }),
        });
        const data = await res.json();
        if (data.success) {
          // API'den yeni kayıt dönüyorsa state'e ekle, dönmüyorsa yeniden çek
          const newItem = data.data || data.unavailability;
          if (newItem) {
            setUnavailability((prev) => [...prev, newItem]);
          } else {
            await fetchUnavailability();
          }
          showMessage("✅ Kısıtlama eklendi", "success");
        } else {
          showMessage("❌ " + (data.message || "Hata oluştu!"), "error");
        }
      } catch (e) { showMessage("❌ Hata oluştu!", "error"); }
    }
  };

  const showMessage = (text, type) => {
    setSaveMessage({ text, type });
    setTimeout(() => setSaveMessage(""), 2500);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const slotsByDay = DAYS.map((day) => ({
    ...day,
    slots: timeSlots.filter((s) => Number(s.day_of_week) === day.id && !s.is_break),
  })).filter((day) => day.slots.length > 0);

  const headerSlots = slotsByDay[0]?.slots || [];

  const missingDays = DAYS.filter(
    (day) => !timeSlots.some((s) => Number(s.day_of_week) === day.id && !s.is_break)
  );

  const selectedTeacherName = teachers.find(
    (t) => String(t.user_id) === String(selectedTeacher)
  )?.full_name;

  const unavailableCount = unavailability.length;
  const totalSlots = slotsByDay.reduce((sum, d) => sum + d.slots.length, 0);

  return (
    <div className="dashboard">
      <Sidebar onLogout={handleLogout} />

      <main className="main-content">
        <Header />

        {/* Toast */}
        {saveMessage && (
          <div style={{
            position: "fixed", top: "20px", right: "20px",
            background: saveMessage.type === "success" ? "#10b981" : "#ef4444",
            color: "white", padding: "12px 20px", borderRadius: "10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 1000,
            fontWeight: "600", fontSize: "15px",
          }}>
            {saveMessage.text}
          </div>
        )}

        {/* Başlık */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#1f2937", marginBottom: "6px" }}>
            Öğretmen Kısıtlamaları
          </h1>
          <p style={{ color: "#6b7280", fontSize: "14px" }}>
            Öğretmenlerin müsait olmadığı zaman dilimlerini işaretleyin
          </p>
        </div>

        {/* Öğretmen Seçimi + Sayaçlar */}
        <div style={{
          background: "white", padding: "24px", borderRadius: "12px",
          marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          display: "flex", gap: "24px", alignItems: "flex-end", flexWrap: "wrap"
        }}>
          <div style={{ flex: 1, minWidth: "280px" }}>
            <label style={{
              display: "block", fontSize: "14px", fontWeight: "600",
              color: "#374151", marginBottom: "10px"
            }}>
              Öğretmen Seçin
            </label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              style={{
                width: "100%", padding: "12px 16px",
                border: "2px solid #e5e7eb", borderRadius: "10px",
                fontSize: "15px", fontWeight: "500", cursor: "pointer",
                outline: "none", background: "white"
              }}
            >
              <option value="">-- Öğretmen Seçin --</option>
              {teachers.map((t) => (
                <option key={t.user_id} value={t.user_id}>
                  {t.full_name} {t.branch ? `(${t.branch})` : ""}
                </option>
              ))}
            </select>
          </div>

          {selectedTeacher && (
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{
                background: "#d1fae5", borderRadius: "10px",
                padding: "12px 24px", textAlign: "center"
              }}>
                <div style={{ fontSize: "24px", fontWeight: "800", color: "#065f46" }}>
                  {totalSlots - unavailableCount}
                </div>
                <div style={{ fontSize: "12px", color: "#059669", fontWeight: "600" }}>Müsait</div>
              </div>
              <div style={{
                background: "#fee2e2", borderRadius: "10px",
                padding: "12px 24px", textAlign: "center"
              }}>
                <div style={{ fontSize: "24px", fontWeight: "800", color: "#991b1b" }}>
                  {unavailableCount}
                </div>
                <div style={{ fontSize: "12px", color: "#dc2626", fontWeight: "600" }}>Müsait Değil</div>
              </div>
            </div>
          )}
        </div>

        {/* Eksik Günler */}
        {missingDays.length > 0 && selectedTeacher && (
          <div style={{
            background: "#fff3cd", border: "2px solid #ffc107",
            borderRadius: "12px", padding: "16px 20px", marginBottom: "24px",
            display: "flex", alignItems: "start", gap: "12px"
          }}>
            <AlertCircle size={22} color="#856404" />
            <div>
              <p style={{ color: "#856404", fontSize: "14px", fontWeight: "600", marginBottom: "4px" }}>
                Eksik Günler: <strong>{missingDays.map((d) => d.name).join(", ")}</strong>
              </p>
              <p style={{ color: "#856404", fontSize: "13px" }}>
                <Link to="/timeslots" style={{ textDecoration: "underline" }}>
                  Zaman Dilimi Ayarları
                </Link> sayfasından ekleyebilirsiniz.
              </p>
            </div>
          </div>
        )}

        {/* Ana Grid */}
        {selectedTeacher && slotsByDay.length > 0 && (
          <div style={{
            background: "white", borderRadius: "14px",
            overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}>
            <div style={{
              padding: "20px 28px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white", display: "flex",
              justifyContent: "space-between", alignItems: "center"
            }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "4px" }}>
                  {selectedTeacherName}
                </h3>
                <p style={{ fontSize: "13px", opacity: 0.85 }}>
                  Müsait olmadığı saatlere tıklayın
                </p>
              </div>
              <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    background: "white", borderRadius: "50%", width: "28px", height: "28px",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <CheckCircle2 size={24} color="#10b981" />
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: "600" }}>Müsait</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    background: "white", borderRadius: "50%", width: "28px", height: "28px",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <XCircle size={24} color="#ef4444" />
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: "600" }}>Müsait Değil</span>
                </div>
              </div>
            </div>

            <div style={{ overflowX: "auto", padding: "20px" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "8px" }}>
                <thead>
                  <tr>
                    <th style={{
                      padding: "14px 18px", textAlign: "left",
                      fontSize: "13px", fontWeight: "700", color: "#374151",
                      textTransform: "uppercase", letterSpacing: "0.5px",
                      minWidth: "130px", background: "#f3f4f6", borderRadius: "8px"
                    }}>
                      GÜN
                    </th>
                    {headerSlots.map((slot) => (
                      <th key={slot.time_slot_id} style={{
                        padding: "14px 8px", textAlign: "center",
                        fontSize: "12px", fontWeight: "600", color: "#4b5563",
                        minWidth: "100px", background: "#f3f4f6", borderRadius: "8px"
                      }}>
                        <div style={{ fontWeight: "700", color: "#1f2937", marginBottom: "3px" }}>
                          {slot.period}. Ders
                        </div>
                        <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                          {String(slot.start_time).slice(0, 5)} - {String(slot.end_time).slice(0, 5)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {slotsByDay.map((day) => (
                    <tr key={day.id}>
                      <td style={{
                        padding: "14px 18px", fontSize: "14px", fontWeight: "700",
                        color: "#1f2937", background: "#f3f4f6", borderRadius: "8px"
                      }}>
                        {day.name}
                      </td>
                      {day.slots.map((slot) => {
                        const slotId = slot.time_slot_id;
                        const unavailable = isUnavailable(slotId);
                        return (
                          <td key={slotId} style={{ textAlign: "center" }}>
                            <button
                              onClick={() => toggleUnavailability(slotId)}
                              title={unavailable
                                ? "Müsait Değil — kaldırmak için tıkla"
                                : "Müsait — işaretlemek için tıkla"}
                              style={{
                                width: "68px", height: "68px",
                                borderRadius: "12px", border: "none",
                                cursor: "pointer", transition: "all 0.25s",
                                backgroundColor: unavailable ? "#fee2e2" : "#d1fae5",
                                boxShadow: unavailable
                                  ? "0 2px 8px rgba(239,68,68,0.25)"
                                  : "0 2px 8px rgba(16,185,129,0.25)",
                                display: "flex", alignItems: "center",
                                justifyContent: "center", margin: "0 auto",
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.08)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                            >
                              {unavailable
                                ? <XCircle size={34} color="#ef4444" strokeWidth={2.5} />
                                : <CheckCircle2 size={34} color="#10b981" strokeWidth={2.5} />
                              }
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTeacher && slotsByDay.length === 0 && (
          <div style={{
            background: "#fef3c7", border: "2px solid #fbbf24",
            borderRadius: "12px", padding: "20px",
            display: "flex", alignItems: "start", gap: "12px"
          }}>
            <AlertCircle size={22} color="#92400e" />
            <div>
              <p style={{ color: "#92400e", fontWeight: "600", marginBottom: "4px" }}>
                Zaman Dilimi Bulunamadı
              </p>
              <p style={{ color: "#92400e", fontSize: "14px" }}>
                <Link to="/timeslots" style={{ textDecoration: "underline" }}>
                  Zaman Dilimi Ayarları
                </Link> sayfasından ekleyin.
              </p>
            </div>
          </div>
        )}

        {!selectedTeacher && (
          <div style={{
            background: "#dbeafe", border: "2px solid #3b82f6",
            borderRadius: "12px", padding: "20px",
            display: "flex", alignItems: "start", gap: "12px"
          }}>
            <Users size={22} color="#1e40af" />
            <div>
              <p style={{ color: "#1e40af", fontWeight: "600", marginBottom: "4px" }}>
                Başlamak İçin
              </p>
              <p style={{ color: "#1e40af", fontSize: "14px" }}>
                Yukarıdan bir öğretmen seçerek kısıtlamalarını yönetmeye başlayın.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default TeacherUnavailability;