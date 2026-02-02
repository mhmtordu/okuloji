import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  LogOut,
  Users,
  BookOpen,
  Calendar,
  Settings,
  School,
  Home,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Save,
  AlertCircle
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const DAYS = [
  { id: 1, name: 'Pazartesi' },
  { id: 2, name: 'Salı' },
  { id: 3, name: 'Çarşamba' },
  { id: 4, name: 'Perşembe' },
  { id: 5, name: 'Cuma' },
];

export default function TeacherUnavailability() {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [timeSlots, setTimeSlots] = useState([]);
  const [unavailability, setUnavailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const schoolId = 1;

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (selectedTeacher) {
      fetchTimeSlots();
      fetchUnavailability();
      setHasChanges(false);
    }
  }, [selectedTeacher]);

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/teachers?school_id=${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeachers(res.data.data || []);
    } catch (error) {
      console.error('Öğretmenler getirilemedi:', error);
    }
  };

  const fetchTimeSlots = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/timeslots`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { school_id: schoolId }
      });
      
      let slots = [];
      if (res.data.timeSlots) {
        slots = res.data.timeSlots;
      } else if (res.data.data) {
        slots = res.data.data;
      } else if (Array.isArray(res.data)) {
        slots = res.data;
      }
      
      setTimeSlots(slots);
    } catch (error) {
      console.error('Zaman dilimleri getirilemedi:', error);
    }
  };

  const fetchUnavailability = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${API_URL}/teacher-unavailability?teacher_id=${selectedTeacher}&school_id=${schoolId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setUnavailability(res.data.data || []);
    } catch (error) {
      console.error('Kısıtlamalar getirilemedi:', error);
    }
  };

  const isUnavailable = (dayOfWeek, slotId) => {
    return unavailability.some(
      (item) => item.day_of_week === dayOfWeek && item.slot_id === slotId
    );
  };

  const toggleUnavailability = async (dayOfWeek, slotId) => {
    const token = localStorage.getItem('token');
    const existing = unavailability.find(
      (item) => item.day_of_week === dayOfWeek && item.slot_id === slotId
    );

    if (existing) {
      try {
        await axios.delete(
          `${API_URL}/teacher-unavailability/${existing.unavailability_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUnavailability(
          unavailability.filter((item) => item.unavailability_id !== existing.unavailability_id)
        );
        setHasChanges(true);
        showSaveMessage('✅ Kısıtlama kaldırıldı', 'success');
      } catch (error) {
        console.error('Kısıtlama silinemedi:', error);
        showSaveMessage('❌ Hata oluştu!', 'error');
      }
    } else {
      try {
        const res = await axios.post(
          `${API_URL}/teacher-unavailability`,
          {
            teacher_id: parseInt(selectedTeacher),
            school_id: schoolId,
            day_of_week: dayOfWeek,
            slot_id: slotId,
            reason: 'Müsait değil'
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUnavailability([...unavailability, res.data.data]);
        setHasChanges(true);
        showSaveMessage('✅ Kısıtlama eklendi', 'success');
      } catch (error) {
        console.error('Kısıtlama eklenemedi:', error);
        showSaveMessage('❌ Hata oluştu!', 'error');
      }
    }
  };

  const showSaveMessage = (message, type) => {
    setSaveMessage({ text: message, type });
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Günlere göre grupla - SADECE DERS OLAN SLOTLAR
  const slotsByDay = DAYS.map((day) => ({
    ...day,
    slots: timeSlots.filter((slot) => slot.day_of_week === day.id && !slot.is_break),
  })).filter(day => day.slots.length > 0);

  const headerSlots = slotsByDay[0]?.slots || [];

  // Eksik günleri kontrol et
  const missingDays = DAYS.filter(day => 
    !timeSlots.some(slot => slot.day_of_week === day.id && !slot.is_break)
  );

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
          <Link to="/teacher-unavailability" className="nav-item active">
            <Users size={20} />
            <span>Öğretmen Kısıtlamaları</span>
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
        {/* Header */}
        <header className="dashboard-header">
          <div>
            <h1 style={{ marginBottom: '8px' }}>Öğretmen Kısıtlamaları</h1>
            <p style={{ color: '#666', fontSize: '14px' }}>
              Öğretmenlerin müsait olmadığı zaman dilimlerini işaretleyin
            </p>
          </div>
        </header>

        {/* Save Message */}
        {saveMessage && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: saveMessage.type === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            fontWeight: '600',
            animation: 'slideIn 0.3s ease'
          }}>
            {saveMessage.text}
          </div>
        )}

        {/* Öğretmen Seçimi */}
        <div style={{ 
          background: 'white', 
          padding: '24px', 
          borderRadius: '12px', 
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <label style={{ 
            display: 'block', 
            fontSize: '15px', 
            fontWeight: '600', 
            color: '#1f2937',
            marginBottom: '12px' 
          }}>
            Öğretmen Seçin
          </label>
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '500px',
              padding: '14px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <option value="">-- Öğretmen Seçin --</option>
            {teachers.map((teacher) => (
              <option key={teacher.user_id} value={teacher.user_id}>
                {teacher.full_name} {teacher.branch && `(${teacher.branch})`}
              </option>
            ))}
          </select>
        </div>

        {/* Eksik Günler Uyarısı */}
        {missingDays.length > 0 && selectedTeacher && (
          <div style={{
            background: '#fff3cd',
            border: '2px solid #ffc107',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'start',
            gap: '12px'
          }}>
            <AlertCircle size={24} color="#856404" />
            <div>
              <p style={{ color: '#856404', fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>
                Eksik Günler Tespit Edildi
              </p>
              <p style={{ color: '#856404', fontSize: '14px' }}>
                <strong>{missingDays.map(d => d.name).join(', ')}</strong> günleri için zaman dilimi tanımlanmamış. 
                <Link to="/timeslots" style={{ textDecoration: 'underline', marginLeft: '4px' }}>
                  Zaman Dilimi Ayarları
                </Link> sayfasından ekleyebilirsiniz.
              </p>
            </div>
          </div>
        )}

        {/* Grid */}
        {selectedTeacher && slotsByDay.length > 0 && (
          <div style={{ 
            background: 'white', 
            borderRadius: '12px', 
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{ 
              padding: '24px', 
              borderBottom: '2px solid #f3f4f6',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '6px' }}>
                  Haftalık Ders Programı
                </h3>
                <p style={{ fontSize: '14px', opacity: 0.9 }}>
                  Müsait olmadığı saatleri işaretleyin
                </p>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={20} color="#10b981" style={{ background: 'white', borderRadius: '50%' }} />
                  <span style={{ fontSize: '14px' }}>Müsait</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <XCircle size={20} color="#ef4444" style={{ background: 'white', borderRadius: '50%' }} />
                  <span style={{ fontSize: '14px' }}>Müsait Değil</span>
                </div>
              </div>
            </div>
            
            <div style={{ overflowX: 'auto', padding: '20px' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'separate',
                borderSpacing: '12px'
              }}>
                <thead>
                  <tr>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#1f2937',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      minWidth: '140px',
                      background: '#f9fafb',
                      borderRadius: '10px'
                    }}>
                      GÜN
                    </th>
                    {headerSlots.map((slot) => (
                      <th
                        key={slot.slot_id}
                        style={{
                          padding: '16px',
                          textAlign: 'center',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#4b5563',
                          minWidth: '120px',
                          background: '#f9fafb',
                          borderRadius: '10px'
                        }}
                      >
                        <div style={{ fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
                          {slot.slot_name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                          {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {slotsByDay.map((day) => (
                    <tr key={day.id}>
                      <td style={{
                        padding: '16px',
                        fontSize: '15px',
                        fontWeight: '700',
                        color: '#1f2937',
                        background: '#f9fafb',
                        borderRadius: '10px'
                      }}>
                        {day.name}
                      </td>
                      {day.slots.map((slot) => {
                        const unavailable = isUnavailable(day.id, slot.slot_id);
                        return (
                          <td key={slot.slot_id} style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => toggleUnavailability(day.id, slot.slot_id)}
                              style={{
                                width: '70px',
                                height: '70px',
                                borderRadius: '14px',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                backgroundColor: unavailable ? '#fee2e2' : '#d1fae5',
                                boxShadow: unavailable 
                                  ? '0 2px 8px rgba(239, 68, 68, 0.2)' 
                                  : '0 2px 8px rgba(16, 185, 129, 0.2)',
                                transform: 'scale(1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.boxShadow = unavailable 
                                  ? '0 4px 16px rgba(239, 68, 68, 0.3)' 
                                  : '0 4px 16px rgba(16, 185, 129, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = unavailable 
                                  ? '0 2px 8px rgba(239, 68, 68, 0.2)' 
                                  : '0 2px 8px rgba(16, 185, 129, 0.2)';
                              }}
                              title={unavailable ? 'Müsait Değil (Kaldırmak için tıkla)' : 'Müsait (İşaretlemek için tıkla)'}
                            >
                              {unavailable ? (
                                <XCircle size={36} color="#ef4444" strokeWidth={2.5} />
                              ) : (
                                <CheckCircle2 size={36} color="#10b981" strokeWidth={2.5} />
                              )}
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
            background: '#fef3c7',
            border: '2px solid #fbbf24',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            alignItems: 'start',
            gap: '12px'
          }}>
            <AlertCircle size={24} color="#92400e" />
            <div>
              <p style={{ color: '#92400e', fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>
                Zaman Dilimi Bulunamadı
              </p>
              <p style={{ color: '#92400e', fontSize: '14px' }}>
                Bu okul için henüz zaman dilimi tanımlanmamış. <Link to="/timeslots" style={{ textDecoration: 'underline' }}>Zaman Dilimi Ayarları</Link> sayfasından zaman dilimlerini oluşturun.
              </p>
            </div>
          </div>
        )}

        {!selectedTeacher && (
          <div style={{
            background: '#dbeafe',
            border: '2px solid #3b82f6',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            alignItems: 'start',
            gap: '12px'
          }}>
            <AlertCircle size={24} color="#1e40af" />
            <div>
              <p style={{ color: '#1e40af', fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>
                Başlamak İçin
              </p>
              <p style={{ color: '#1e40af', fontSize: '14px' }}>
                Yukarıdan bir öğretmen seçerek kısıtlamalarını yönetmeye başlayın.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}