import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "./Dashboard.css";

function TimeSlots() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [timeSlots, setTimeSlots] = useState([]);

  // Seçili günler (varsayılan hepsi seçili)
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]);

  // Tablo satırları
  const [rows, setRows] = useState([
    { slot_order: 1, slot_name: "1. Ders", start_time: "08:05", end_time: "08:50" },
    { slot_order: 2, slot_name: "2. Ders", start_time: "08:50", end_time: "09:35" },
    { slot_order: 3, slot_name: "3. Ders", start_time: "09:35", end_time: "10:20" },
    { slot_order: 4, slot_name: "4. Ders", start_time: "10:40", end_time: "11:25" },
    { slot_order: 5, slot_name: "5. Ders", start_time: "11:25", end_time: "12:10" },
    { slot_order: 6, slot_name: "6. Ders", start_time: "13:00", end_time: "13:45" },
    { slot_order: 7, slot_name: "7. Ders", start_time: "13:45", end_time: "14:30" },
    { slot_order: 8, slot_name: "8. Ders", start_time: "14:30", end_time: "15:15" },
  ]);

  const days = [
    { value: 1, label: "Pazartesi" },
    { value: 2, label: "Salı" },
    { value: 3, label: "Çarşamba" },
    { value: 4, label: "Perşembe" },
    { value: 5, label: "Cuma" },
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchTimeSlots();
  }, [navigate]);

  const fetchTimeSlots = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/timeslots", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && data.timeSlots.length > 0) {
        setTimeSlots(data.timeSlots);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  const handleDayToggle = (dayValue) => {
    if (selectedDays.includes(dayValue)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayValue));
    } else {
      setSelectedDays([...selectedDays, dayValue].sort());
    }
  };

  const handleRowChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = value;
    setRows(updatedRows);
  };

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        slot_order: rows.length + 1,
        slot_name: `${rows.length + 1}. Ders`,
        start_time: "",
        end_time: "",
      },
    ]);
  };

  const handleRemoveRow = (index) => {
    const updatedRows = rows.filter((_, i) => i !== index);
    // Sıraları yeniden düzenle
    updatedRows.forEach((row, i) => {
      row.slot_order = i + 1;
      row.slot_name = `${i + 1}. Ders`;
    });
    setRows(updatedRows);
  };

  const handleSave = async () => {
    if (selectedDays.length === 0) {
      setMessage({ type: "error", text: "En az bir gün seçmelisiniz!" });
      return;
    }

    if (rows.some((row) => !row.start_time || !row.end_time)) {
      setMessage({ type: "error", text: "Tüm saatleri doldurun!" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");

      // Tüm kombinasyonları oluştur
      const slots = [];
      selectedDays.forEach((day) => {
        rows.forEach((row) => {
          slots.push({
            day_of_week: day,
            slot_name: row.slot_name,
            slot_order: row.slot_order,
            period: row.slot_order,
            start_time: row.start_time,
            end_time: row.end_time,
          });
        });
      });

      // Backend'e gönder (toplu ekleme endpoint'i gerekli)
      const response = await fetch("http://localhost:5000/api/timeslots/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slots }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: `${slots.length} zaman dilimi başarıyla kaydedildi!`,
        });
        fetchTimeSlots();
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

  const getDayName = (dayNum) => {
    const day = days.find((d) => d.value === dayNum);
    return day ? day.label : dayNum;
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
          <div className="form-section">
            <h3>📅 Zaman Dilimi Ayarları</h3>

            {/* Gün Seçimi */}
            <div className="days-selector">
              <label className="section-label">Günler:</label>
              <div className="days-checkboxes">
                {days.map((day) => (
                  <label key={day.value} className="day-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedDays.includes(day.value)}
                      onChange={() => handleDayToggle(day.value)}
                    />
                    <span>{day.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tablo */}
            <div className="timeslots-table-container">
              <table className="timeslots-table">
                <thead>
                  <tr>
                    <th style={{ width: "80px" }}>Sıra</th>
                    <th style={{ width: "150px" }}>Ders</th>
                    <th style={{ width: "150px" }}>Başlangıç</th>
                    <th style={{ width: "150px" }}>Bitiş</th>
                    <th style={{ width: "80px" }}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index}>
                      <td className="text-center">{row.slot_order}</td>
                      <td>
                        <input
                          type="text"
                          value={row.slot_name}
                          onChange={(e) =>
                            handleRowChange(index, "slot_name", e.target.value)
                          }
                          className="table-input"
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          value={row.start_time}
                          onChange={(e) =>
                            handleRowChange(index, "start_time", e.target.value)
                          }
                          className="table-input"
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          value={row.end_time}
                          onChange={(e) =>
                            handleRowChange(index, "end_time", e.target.value)
                          }
                          className="table-input"
                        />
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => handleRemoveRow(index)}
                          className="btn-icon-danger"
                          title="Sil"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button onClick={handleAddRow} className="btn-add-row">
                <Plus size={18} />
                Satır Ekle
              </button>
            </div>

            {/* Kaydet Butonu */}
            <div className="form-actions">
              <button
                onClick={handleSave}
                className="btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>Kaydediliyor...</>
                ) : (
                  <>
                    <Save size={20} />
                    <span>Kaydet ({selectedDays.length} gün × {rows.length} ders = {selectedDays.length * rows.length} kayıt)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

       
        
      </main>
    </div>
  );
}

export default TimeSlots;