import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  LogOut, Users, BookOpen, Calendar, Settings, School,
  Home, FileText, Clock, RefreshCw, Printer, AlertCircle, CheckCircle
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];

export default function Schedules() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [scheduleData, setScheduleData] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [viewMode, setViewMode] = useState('classroom'); // 'classroom' | 'teacher'
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [stats, setStats] = useState(null);

  const getSchoolId = () => JSON.parse(localStorage.getItem('user') || '{}').schoolId;
  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    if (!getToken()) { navigate('/login'); return; }
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    fetchClassrooms();
    fetchTeachers();
    fetchTimeSlots();
  }, [navigate]);

  useEffect(() => {
    if (viewMode === 'classroom' && selectedClassroom) fetchSchedule();
    if (viewMode === 'teacher' && selectedTeacher) fetchSchedule();
  }, [selectedClassroom, selectedTeacher, viewMode]);

  const fetchClassrooms = async () => {
    try {
      const res = await axios.get(`${API_URL}/classrooms`, { headers: { Authorization: `Bearer ${getToken()}` } });
      setClassrooms(res.data.classrooms || []);
    } catch (e) { console.error(e); }
  };

  const fetchTeachers = async () => {
    try {
      const res = await axios.get(`${API_URL}/teachers?school_id=${getSchoolId()}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      setTeachers(res.data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchTimeSlots = async () => {
    try {
      const res = await axios.get(`${API_URL}/timeslots?school_id=${getSchoolId()}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const slots = (res.data.timeSlots || res.data.data || []).filter(s => !s.is_break);
      setTimeSlots(slots);
    } catch (e) { console.error(e); }
  };

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ school_id: getSchoolId() });
      if (viewMode === 'classroom' && selectedClassroom) params.append('classroom_id', selectedClassroom);
      if (viewMode === 'teacher' && selectedTeacher) params.append('teacher_id', selectedTeacher);
      const res = await axios.get(`${API_URL}/schedules?${params}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      setScheduleData(res.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    if (!window.confirm('Mevcut program silinip yeniden oluşturulacak. Devam edilsin mi?')) return;
    setGenerating(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await axios.post(`${API_URL}/schedules/generate`,
        { school_id: getSchoolId() },
        { headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' } }
      );
      setStats(res.data.stats);
      setMessage({ type: 'success', text: `Program oluşturuldu! %${res.data.stats.successRate} başarı (${res.data.stats.placedBlocks}/${res.data.stats.totalBlocks} blok)` });
      if (selectedClassroom || selectedTeacher) fetchSchedule();
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.message || 'Hata oluştu!' });
    } finally { setGenerating(false); }
  };

  // Grid oluştur: { 'Pazartesi': { 1: {...}, 2: {...} }, ... }
  const buildGrid = () => {
    const grid = {};
    DAYS.forEach(day => {
      grid[day] = {};
      timeSlots.forEach(slot => { grid[day][slot.period] = null; });
    });

    scheduleData.forEach(entry => {
      const day = entry.day_name;
      const period = entry.period;
      if (grid[day] !== undefined) {
        grid[day][period] = entry;
      }
    });
    return grid;
  };

  // Benzersiz periyotları al
  const periods = [...new Set(timeSlots.map(s => s.period))].sort((a, b) => a - b);

  // Periyoda göre saat bul
  const getSlotTime = (period) => {
    const slot = timeSlots.find(s => s.period === period);
    return slot ? slot.start_time?.slice(0, 5) : '';
  };

  const grid = buildGrid();

  const selectedLabel = viewMode === 'classroom'
    ? classrooms.find(c => c.classroom_id === parseInt(selectedClassroom))?.classroom_name
    : teachers.find(t => t.user_id === parseInt(selectedTeacher))?.full_name;

  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };

  if (!user) return <div>Yükleniyor...</div>;

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-header"><h2>Okuloji</h2></div>
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item"><Home size={20} /><span>Anasayfa</span></Link>
          <Link to="/school-info" className="nav-item"><School size={20} /><span>Kurum Bilgileri</span></Link>
          <Link to="/timeslots" className="nav-item"><Clock size={20} /><span>Zaman Dilimi Ayarları</span></Link>
          <Link to="/classrooms" className="nav-item"><BookOpen size={20} /><span>Şube Bilgileri</span></Link>
          <Link to="/subjects" className="nav-item"><FileText size={20} /><span>Dersler</span></Link>
          <Link to="/teachers" className="nav-item"><Users size={20} /><span>Öğretmenler</span></Link>
          <Link to="/teacher-unavailability" className="nav-item"><Calendar size={20} /><span>Öğretmen Kısıtlamaları</span></Link>
          <Link to="/subject-assignments" className="nav-item"><FileText size={20} /><span>Ders Atamaları</span></Link>
          <Link to="/schedules" className="nav-item active"><Calendar size={20} /><span>Ders Programı</span></Link>
          <Link to="/settings" className="nav-item"><Settings size={20} /><span>Ayarlar</span></Link>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn"><LogOut size={20} /><span>Çıkış Yap</span></button>
        </div>
      </aside>

      <main className="main-content">
        <header className="page-header">
          <h1>📅 Ders Programı</h1>
          <div className="user-info">
            <span className="user-name">{user.fullName}</span>
            <span className="user-role">{user.role === 'admin' ? 'Yönetici' : 'Öğretmen'}</span>
          </div>
        </header>

        {message.text && (
          <div className={`message-box ${message.type}`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Kontrol Paneli */}
        <div className="form-container">
          <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              
              {/* Sol: Görünüm modu + seçici */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                {/* Mod seçici */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Görünüm</label>
                  <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
                    <button
                      onClick={() => { setViewMode('classroom'); setSelectedTeacher(''); setScheduleData([]); }}
                      style={{ padding: '8px 16px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px', background: viewMode === 'classroom' ? '#667eea' : 'white', color: viewMode === 'classroom' ? 'white' : '#374151' }}
                    >🏫 Sınıf</button>
                    <button
                      onClick={() => { setViewMode('teacher'); setSelectedClassroom(''); setScheduleData([]); }}
                      style={{ padding: '8px 16px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px', background: viewMode === 'teacher' ? '#667eea' : 'white', color: viewMode === 'teacher' ? 'white' : '#374151' }}
                    >👤 Öğretmen</button>
                  </div>
                </div>

                {/* Dropdown */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                    {viewMode === 'classroom' ? 'Sınıf Seç' : 'Öğretmen Seç'}
                  </label>
                  {viewMode === 'classroom' ? (
                    <select value={selectedClassroom} onChange={e => setSelectedClassroom(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', minWidth: '180px' }}>
                      <option value="">-- Sınıf seçiniz --</option>
                      {classrooms.map(c => <option key={c.classroom_id} value={c.classroom_id}>{c.classroom_name}</option>)}
                    </select>
                  ) : (
                    <select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', minWidth: '220px' }}>
                      <option value="">-- Öğretmen seçiniz --</option>
                      {teachers.map(t => <option key={t.user_id} value={t.user_id}>{t.full_name}</option>)}
                    </select>
                  )}
                </div>
              </div>

              {/* Sağ: Butonlar */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={handleGenerate} disabled={generating}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: generating ? '#9ca3af' : 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '8px', cursor: generating ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '14px' }}>
                  <RefreshCw size={16} style={{ animation: generating ? 'spin 1s linear infinite' : 'none' }} />
                  {generating ? 'Oluşturuluyor...' : 'Program Oluştur'}
                </button>
                {scheduleData.length > 0 && (
                  <button onClick={() => window.print()}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'white', color: '#374151', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                    <Printer size={16} />
                    Yazdır
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            {stats && (
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                {[
                  { label: 'Başarı', value: stats.successRate, color: '#10b981' },
                  { label: 'Yerleşen', value: `${stats.placedBlocks}/${stats.totalBlocks}`, color: '#667eea' },
                  { label: 'DB Satır', value: stats.dbRows, color: '#f59e0b' },
                  { label: 'Deneme', value: stats.attempts, color: '#6b7280' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#f9fafb', borderRadius: '8px', padding: '8px 16px', textAlign: 'center', border: `2px solid ${s.color}20` }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Program Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>⏳ Yükleniyor...</div>
        ) : scheduleData.length > 0 ? (
          <div className="form-container" style={{ marginTop: '2rem' }}>
            {/* Başlık */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>T.C. SEVİNÇ GÖYMEN ORTAOKULU</div>
              <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#1f2937' }}>
                {selectedLabel} — Haftalık Ders Programı
              </div>
            </div>

            {/* Tablo */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th style={{ background: '#1e3a5f', color: 'white', padding: '10px 16px', textAlign: 'left', borderRight: '1px solid #2d5a8e', minWidth: '90px' }}>
                      Gün
                    </th>
                    {periods.map(period => (
                      <th key={period} style={{ background: '#1e3a5f', color: 'white', padding: '10px 8px', textAlign: 'center', borderRight: '1px solid #2d5a8e', minWidth: '90px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '700' }}>{period}</div>
                        <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>{getSlotTime(period)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day, dayIndex) => (
                    <tr key={day} style={{ background: dayIndex % 2 === 0 ? 'white' : '#f8faff' }}>
                      <td style={{ padding: '8px 16px', fontWeight: '700', color: '#1e3a5f', borderRight: '2px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', fontSize: '13px' }}>
                        {day}
                      </td>
                      {periods.map(period => {
                        const cell = grid[day]?.[period];
                        return (
                          <td key={period} style={{ padding: '4px', borderRight: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', textAlign: 'center', verticalAlign: 'middle', height: '56px' }}>
                            {cell ? (
                              <div style={{
                                background: cell.color ? `${cell.color}18` : '#f0f4ff',
                                borderLeft: `3px solid ${cell.color || '#667eea'}`,
                                borderRadius: '6px',
                                padding: '4px 6px',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                gap: '2px'
                              }}>
                                <div style={{ fontWeight: '700', fontSize: '12px', color: '#1f2937', lineHeight: 1.2 }}>
                                  {viewMode === 'classroom' ? cell.subject_code || cell.subject_name : cell.classroom_name}
                                </div>
                                <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: 1.2 }}>
                                  {viewMode === 'classroom' ? cell.teacher_name?.split(' ').pop() : cell.subject_code || cell.subject_name}
                                </div>
                              </div>
                            ) : (
                              <div style={{ color: '#d1d5db', fontSize: '18px' }}>—</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Alt bilgi */}
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem' }}>
              <span>Toplam Ders Saati: <strong>{scheduleData.length}</strong></span>
              <span>{new Date().toLocaleDateString('tr-TR')}</span>
            </div>
          </div>
        ) : (selectedClassroom || selectedTeacher) ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <Calendar size={48} style={{ margin: '0 auto 1rem', color: '#d1d5db' }} />
            <p>Program bulunamadı. "Program Oluştur" butonuna tıklayın.</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <Calendar size={48} style={{ margin: '0 auto 1rem', color: '#d1d5db' }} />
            <p>Görüntülemek için sınıf veya öğretmen seçin.</p>
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media print {
          .sidebar, .page-header, .form-container:first-of-type { display: none !important; }
          .main-content { margin: 0 !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}