import './Schedules.css';  // YENİ SATIR!
import './Dashboard.css';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  LogOut,
  Users,
  BookOpen,
  Calendar,
  Settings,
  Home,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader,
  Download,
  Trash2,
  RefreshCw,
  User,
  TrendingUp,
  Award
} from 'lucide-react';
import './Dashboard.css';

const API_URL = 'http://localhost:5000/api';

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];

export default function Schedules() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [stats, setStats] = useState(null);
  
  // Dual View State
  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [classroomSchedule, setClassroomSchedule] = useState([]);
  const [teacherSchedule, setTeacherSchedule] = useState([]);
  const [highlightedSlot, setHighlightedSlot] = useState(null);

  // İlk yükleme: Kullanıcı + Sınıf/Öğretmen listesi
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    // Başlangıçta sınıf ve öğretmen listesini yükle
    loadClassroomsAndTeachers();
  }, [navigate]);

  // Sınıf ve öğretmen listesi
  const loadClassroomsAndTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Sınıfları yükle
      const classRes = await axios.get(`${API_URL}/classrooms?school_id=1`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (classRes.data.data?.length > 0) {
        setClassrooms(classRes.data.data);
        setSelectedClassroom(classRes.data.data[0].classroom_id);
      }
      
      // Öğretmenleri yükle
      const teachRes = await axios.get(`${API_URL}/teachers?school_id=1`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (teachRes.data.data?.length > 0) {
        setTeachers(teachRes.data.data);
        setSelectedTeacher(teachRes.data.data[0].user_id);
      }
      
      // Programı yükle (varsa)
      loadSchedules();
      
    } catch (error) {
      console.error('❌ Listeler yüklenemedi:', error);
    }
  };

  // Programları yükle
  const loadSchedules = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const schedRes = await axios.get(`${API_URL}/schedules?school_id=1`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (schedRes.data.success && schedRes.data.data?.length > 0) {
        setSchedules(schedRes.data.data);
        
        // İlk sınıf ve öğretmen programını yükle
        if (selectedClassroom) {
          loadClassroomSchedule(selectedClassroom);
        }
        if (selectedTeacher) {
          loadTeacherSchedule(selectedTeacher);
        }
      } else {
        setSchedules([]);
      }
      
    } catch (error) {
      console.error('❌ Program yüklenemedi:', error);
    }
  };

  const loadClassroomSchedule = async (classroomId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/schedules/classroom/${classroomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClassroomSchedule(res.data.data || []);
      setSelectedClassroom(classroomId);
    } catch (error) {
      console.error('❌ Sınıf programı yüklenemedi:', error);
      setClassroomSchedule([]);
    }
  };

  const loadTeacherSchedule = async (teacherId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/schedules/teacher/${teacherId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeacherSchedule(res.data.data || []);
      setSelectedTeacher(teacherId);
    } catch (error) {
      console.error('❌ Öğretmen programı yüklenemedi:', error);
      setTeacherSchedule([]);
    }
  };

  const handleClassroomChange = (e) => {
    const classroomId = parseInt(e.target.value);
    loadClassroomSchedule(classroomId);
  };

  const handleTeacherChange = (e) => {
    const teacherId = parseInt(e.target.value);
    loadTeacherSchedule(teacherId);
  };

  const handleGenerateSchedule = async () => {
    if (!window.confirm('Program oluşturulsun mu? Bu işlem 10-30 saniye sürebilir.')) {
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    setStats(null);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/schedules/generate`,
        { school_id: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({
        type: 'success',
        text: res.data.message || 'Program başarıyla oluşturuldu!'
      });

      setStats(res.data.data);
      
      // 1 saniye sonra programları yükle
      setTimeout(() => {
        loadSchedules();
      }, 1000);

    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Program oluşturulamadı!'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!window.confirm('Mevcut programı silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/schedules`, {
        data: { school_id: 1 },
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage({
        type: 'success',
        text: 'Program silindi!'
      });

      setSchedules([]);
      setClassroomSchedule([]);
      setTeacherSchedule([]);
      setStats(null);

    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Silme başarısız!'
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Programı günlere göre grupla
  const groupByDay = (schedule) => {
    const grouped = {};
    DAYS.forEach(day => {
      grouped[day] = schedule.filter(s => s.day_name === day)
        .sort((a, b) => a.period - b.period);
    });
    return grouped;
  };

  const classroomGrouped = groupByDay(classroomSchedule);
  const teacherGrouped = groupByDay(teacherSchedule);

  const getSelectedClassroomName = () => {
    const classroom = classrooms.find(c => c.classroom_id === selectedClassroom);
    return classroom ? classroom.classroom_name : 'Seçiniz';
  };

  const getSelectedTeacherName = () => {
    const teacher = teachers.find(t => t.user_id === selectedTeacher);
    return teacher ? teacher.full_name : 'Seçiniz';
  };

  // Slot vurgulama
  const handleSlotHover = (day, period) => {
    setHighlightedSlot({ day, period });
  };

  const handleSlotLeave = () => {
    setHighlightedSlot(null);
  };

  const isSlotHighlighted = (day, period) => {
    return highlightedSlot?.day === day && highlightedSlot?.period === period;
  };

  // Gün renkleri
  const getDayColor = (index) => {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe'];
    return colors[index % colors.length];
  };

  if (!user) return <div>Yükleniyor...</div>;

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Okuloji</h2>
        </div>

        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item">
            <Home size={20} />
            <span>Anasayfa</span>
          </Link>
          <Link to="/timeslots" className="nav-item">
            <Clock size={20} />
            <span>Zaman Dilimleri</span>
          </Link>
          <Link to="/teachers" className="nav-item">
            <Users size={20} />
            <span>Öğretmen Bilgileri</span>
          </Link>
          <Link to="/classrooms" className="nav-item">
            <BookOpen size={20} />
            <span>Şube Bilgileri</span>
          </Link>
          <Link to="/subjects" className="nav-item">
            <FileText size={20} />
            <span>Dersler</span>
          </Link>
          <Link to="/teacher-unavailability" className="nav-item">
            <Calendar size={20} />
            <span>Öğretmen Kısıtlamaları</span>
          </Link>
          <Link to="/subject-assignments" className="nav-item">
            <FileText size={20} />
            <span>Ders Atamaları</span>
          </Link>
          <Link to="/schedules" className="nav-item active">
            <Calendar size={20} />
            <span>Ders Programı</span>
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

      <main className="main-content">
        <header className="page-header">
          <h1>📅 Ders Programı</h1>
          <div className="user-info">
            <span className="user-name">{user.full_name}</span>
            <span className="user-role">
              {user.role === "admin" ? "Yönetici" : "Öğretmen"}
            </span>
          </div>
        </header>

        {message.text && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Aksiyon Butonları */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3>Program Yönetimi</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleGenerateSchedule}
                disabled={loading}
                className="btn btn-primary"
                style={{ 
                  minWidth: '220px',
                  fontSize: '1.1rem',
                  padding: '1rem 1.5rem',
                  background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                {loading ? (
                  <>
                    <Loader size={20} className="spinning" />
                    <span>Oluşturuluyor...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={20} />
                    <span>🔥 PROGRAM OLUŞTUR</span>
                  </>
                )}
              </button>

              {schedules.length > 0 && (
                <>
                  <button
                    onClick={() => window.print()}
                    className="btn"
                    style={{ 
                      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    <Download size={18} />
                    <span>Yazdır / PDF</span>
                  </button>

                  <button
                    onClick={handleDeleteSchedule}
                    className="btn"
                    style={{ 
                      background: 'linear-gradient(135deg, #eb3941 0%, #f15e64 100%)',
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    <Trash2 size={18} />
                    <span>Programı Sil</span>
                  </button>
                </>
              )}
            </div>

            {loading && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                borderRadius: '12px',
                border: '2px solid #667eea'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <Loader size={24} className="spinning" style={{ color: '#667eea' }} />
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#667eea', fontSize: '1.1rem', display: 'block' }}>
                      Program oluşturuluyor...
                    </span>
                    <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                      4 fazlı algoritma çalışıyor (Greedy → Repair → Balance → Force)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {stats && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, #11998e15 0%, #38ef7d15 100%)',
                borderRadius: '12px',
                border: '2px solid #11998e'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <Award size={24} style={{ color: '#11998e' }} />
                  <h4 style={{ margin: 0, color: '#11998e' }}>
                    ✅ Program Başarıyla Oluşturuldu!
                  </h4>
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  fontSize: '0.95rem'
                }}>
                  <div style={{ padding: '0.75rem', background: 'white', borderRadius: '8px' }}>
                    <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>⏱️ Süre</div>
                    <div style={{ fontWeight: 'bold', color: '#1f2937' }}>{stats.elapsed}</div>
                  </div>
                  <div style={{ padding: '0.75rem', background: 'white', borderRadius: '8px' }}>
                    <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>💾 Kaydedilen</div>
                    <div style={{ fontWeight: 'bold', color: '#1f2937' }}>{stats.savedCount} ders</div>
                  </div>
                  <div style={{ padding: '0.75rem', background: 'white', borderRadius: '8px' }}>
                    <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>🔄 Deneme</div>
                    <div style={{ fontWeight: 'bold', color: '#1f2937' }}>{stats.attempts}</div>
                  </div>
                  <div style={{ padding: '0.75rem', background: 'white', borderRadius: '8px' }}>
                    <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>🔙 Backtrack</div>
                    <div style={{ fontWeight: 'bold', color: '#1f2937' }}>{stats.backtrackCount || 0}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* DUAL VIEW - ŞUBE + ÖĞRETMEN */}
        {schedules.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* SOL: ŞUBE PROGRAMI */}
            <div className="card" style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <div className="card-header" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <BookOpen size={28} />
                  <h3 style={{ margin: 0, fontSize: '1.3rem' }}>📚 Şube Programı</h3>
                </div>
                <select
                  value={selectedClassroom || ''}
                  onChange={handleClassroomChange}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    fontSize: '1.05rem',
                    border: '2px solid white',
                    borderRadius: '10px',
                    background: 'white',
                    color: '#1f2937',
                    cursor: 'pointer',
                    fontWeight: '600',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  {classrooms.map(c => (
                    <option key={c.classroom_id} value={c.classroom_id}>
                      {c.classroom_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="card-body" style={{ padding: '1.25rem', background: '#f9fafb' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '1rem'
                }}>
                  {DAYS.map((day, idx) => (
                    <div key={day} style={{
                      background: 'white',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}>
                      <div style={{
                        background: getDayColor(idx),
                        color: 'white',
                        padding: '0.75rem',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '0.95rem'
                      }}>
                        {day}
                      </div>
                      <div style={{ padding: '0.75rem' }}>
                        {classroomGrouped[day].length > 0 ? (
                          classroomGrouped[day].map((s, sIdx) => (
                            <div 
                              key={sIdx} 
                              onMouseEnter={() => handleSlotHover(day, s.period)}
                              onMouseLeave={handleSlotLeave}
                              style={{
                                padding: '0.75rem',
                                marginBottom: '0.75rem',
                                background: s.color || '#e5e7eb',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: isSlotHighlighted(day, s.period) ? 'scale(1.05) translateY(-2px)' : 'scale(1)',
                                boxShadow: isSlotHighlighted(day, s.period) 
                                  ? '0 8px 20px rgba(102, 126, 234, 0.4)' 
                                  : '0 2px 4px rgba(0,0,0,0.1)',
                                border: isSlotHighlighted(day, s.period) ? '2px solid #667eea' : '2px solid transparent'
                              }}
                            >
                              <div style={{ 
                                fontWeight: 'bold', 
                                fontSize: '0.85rem',
                                marginBottom: '0.25rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}>
                                <span style={{
                                  background: 'rgba(0,0,0,0.1)',
                                  padding: '0.15rem 0.4rem',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem'
                                }}>
                                  {s.period}
                                </span>
                                {s.subject_name}
                              </div>
                              <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '0.35rem' }}>
                                👨‍🏫 {s.teacher_name}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                🕐 {s.start_time?.slice(0,5)} - {s.end_time?.slice(0,5)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{
                            padding: '1.5rem',
                            textAlign: 'center',
                            color: '#9ca3af',
                            fontSize: '0.8rem'
                          }}>
                            Ders yok
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SAĞ: ÖĞRETMEN PROGRAMI */}
            <div className="card" style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <div className="card-header" style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                padding: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <User size={28} />
                  <h3 style={{ margin: 0, fontSize: '1.3rem' }}>👨‍🏫 Öğretmen Programı</h3>
                </div>
                <select
                  value={selectedTeacher || ''}
                  onChange={handleTeacherChange}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    fontSize: '1.05rem',
                    border: '2px solid white',
                    borderRadius: '10px',
                    background: 'white',
                    color: '#1f2937',
                    cursor: 'pointer',
                    fontWeight: '600',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  {teachers.map(t => (
                    <option key={t.user_id} value={t.user_id}>
                      {t.full_name} - {t.branch}
                    </option>
                  ))}
                </select>
              </div>
              <div className="card-body" style={{ padding: '1.25rem', background: '#f9fafb' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '1rem'
                }}>
                  {DAYS.map((day, idx) => (
                    <div key={day} style={{
                      background: 'white',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}>
                      <div style={{
                        background: getDayColor(idx),
                        color: 'white',
                        padding: '0.75rem',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '0.95rem'
                      }}>
                        {day}
                      </div>
                      <div style={{ padding: '0.75rem' }}>
                        {teacherGrouped[day].length > 0 ? (
                          teacherGrouped[day].map((s, sIdx) => (
                            <div 
                              key={sIdx}
                              onMouseEnter={() => handleSlotHover(day, s.period)}
                              onMouseLeave={handleSlotLeave}
                              style={{
                                padding: '0.75rem',
                                marginBottom: '0.75rem',
                                background: s.color || '#e5e7eb',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: isSlotHighlighted(day, s.period) ? 'scale(1.05) translateY(-2px)' : 'scale(1)',
                                boxShadow: isSlotHighlighted(day, s.period) 
                                  ? '0 8px 20px rgba(240, 147, 251, 0.4)' 
                                  : '0 2px 4px rgba(0,0,0,0.1)',
                                border: isSlotHighlighted(day, s.period) ? '2px solid #f093fb' : '2px solid transparent'
                              }}
                            >
                              <div style={{ 
                                fontWeight: 'bold', 
                                fontSize: '0.85rem',
                                marginBottom: '0.25rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}>
                                <span style={{
                                  background: 'rgba(0,0,0,0.1)',
                                  padding: '0.15rem 0.4rem',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem'
                                }}>
                                  {s.period}
                                </span>
                                {s.subject_name}
                              </div>
                              <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '0.35rem' }}>
                                🏫 {s.classroom_name}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                🕐 {s.start_time?.slice(0,5)} - {s.end_time?.slice(0,5)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{
                            padding: '1.5rem',
                            textAlign: 'center',
                            color: '#9ca3af',
                            fontSize: '0.8rem'
                          }}>
                            Ders yok
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-body">
              <div style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                color: '#6b7280'
              }}>
                <Calendar size={80} style={{ margin: '0 auto 1.5rem', opacity: 0.3, color: '#667eea' }} />
                <h3 style={{ marginBottom: '1rem', color: '#1f2937', fontSize: '1.5rem' }}>Henüz program oluşturulmamış</h3>
                <p style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>
                  "Program Oluştur" butonuna basarak otomatik ders programı oluşturabilirsiniz.
                </p>
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: '#f0f4ff',
                  borderRadius: '12px',
                  display: 'inline-block'
                }}>
                  <p style={{ fontSize: '0.95rem', color: '#667eea', margin: 0, fontWeight: '500' }}>
                    ✨ 4 Fazlı Algoritma: Greedy + Repair + Balance + Force Placement
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0.5rem 0 0', fontWeight: '400' }}>
                    2'li bloklar | Her gün eşit ders | %98+ başarı oranı
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media print {
          .sidebar,
          .page-header,
          .btn,
          button {
            display: none !important;
          }
          
          .main-content {
            margin: 0;
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}