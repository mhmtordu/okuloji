import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  LogOut, Users, BookOpen, Calendar, Settings, School, Home,
  FileText, Clock, Plus, Trash2, CheckCircle, AlertCircle
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function SubjectAssignments() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [formData, setFormData] = useState({ classroom_id: '', subject_id: '', teacher_id: '' });
  const [assignments, setAssignments] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [classroomSummary, setClassroomSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const getSchoolId = () => JSON.parse(localStorage.getItem('user') || '{}').schoolId;
  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    if (!getToken()) { navigate('/login'); return; }
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    fetchClassrooms(); fetchSubjects(); fetchTeachers(); fetchAssignments();
  }, [navigate]);

  useEffect(() => {
    if (selectedClassroom) fetchClassroomSummary();
    else setClassroomSummary(null);
  }, [selectedClassroom, assignments]);

  const fetchClassrooms = async () => {
    try {
      const res = await axios.get(`${API_URL}/classrooms`, { headers: { Authorization: `Bearer ${getToken()}` } });
      setClassrooms(res.data.classrooms || []);
    } catch (e) { console.error(e); }
  };

  const fetchSubjects = async () => {
    try {
      const res = await axios.get(`${API_URL}/subjects`, { headers: { Authorization: `Bearer ${getToken()}` } });
      setSubjects(res.data.subjects || []);
    } catch (e) { console.error(e); }
  };

  const fetchTeachers = async () => {
    try {
      const res = await axios.get(`${API_URL}/teachers?school_id=${getSchoolId()}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      setTeachers(res.data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchAssignments = async () => {
    try {
      const res = await axios.get(`${API_URL}/subject-assignments?school_id=${getSchoolId()}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      setAssignments(res.data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchClassroomSummary = async () => {
    try {
      const res = await axios.get(`${API_URL}/subject-assignments/classroom/${selectedClassroom}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      setClassroomSummary(res.data.summary);
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.classroom_id || !formData.subject_id || !formData.teacher_id) {
      setMessage({ type: 'error', text: 'Tüm alanları doldurun!' }); return;
    }
    const selectedSubject = subjects.find(s => s.subject_id === parseInt(formData.subject_id));
    if (!selectedSubject) { setMessage({ type: 'error', text: 'Ders bulunamadı!' }); return; }
    if (!selectedSubject.weekly_hours || selectedSubject.weekly_hours < 1) {
      setMessage({ type: 'error', text: `${selectedSubject.subject_name} dersinin haftalık saati tanımlanmamış!` }); return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/subject-assignments`, {
        classroom_id: parseInt(formData.classroom_id),
        subject_id: parseInt(formData.subject_id),
        teacher_id: parseInt(formData.teacher_id),
        school_id: getSchoolId(),
        weekly_hours: parseInt(selectedSubject.weekly_hours)
      }, { headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' } });
      setMessage({ type: 'success', text: `Ders ataması eklendi! (${selectedSubject.weekly_hours} saat)` });
      setFormData({ classroom_id: '', subject_id: '', teacher_id: '' });
      fetchAssignments();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Hata oluştu!' });
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu atamayı silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`${API_URL}/subject-assignments/${id}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      setMessage({ type: 'success', text: 'Atama silindi!' });
      fetchAssignments();
    } catch (e) { setMessage({ type: 'error', text: 'Silme başarısız!' }); }
  };

  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };

  // Filtre: hem sınıf hem öğretmen
  const displayedAssignments = assignments.filter(a => {
    const matchClassroom = selectedClassroom ? a.classroom_id === parseInt(selectedClassroom) : true;
    const matchTeacher = selectedTeacher ? a.teacher_id === parseInt(selectedTeacher) : true;
    return matchClassroom && matchTeacher;
  });

  const selectedSubjectInfo = formData.subject_id ? subjects.find(s => s.subject_id === parseInt(formData.subject_id)) : null;

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
          <Link to="/subject-assignments" className="nav-item active"><FileText size={20} /><span>Ders Atamaları</span></Link>
          <Link to="/schedules" className="nav-item"><Calendar size={20} /><span>Ders Programı</span></Link>
          <Link to="/settings" className="nav-item"><Settings size={20} /><span>Ayarlar</span></Link>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn"><LogOut size={20} /><span>Çıkış Yap</span></button>
        </div>
      </aside>

      <main className="main-content">
        <header className="page-header">
          <h1>📚 Ders Atamaları</h1>
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

        {/* Form */}
        <div className="form-container">
          <form onSubmit={handleSubmit} className="subject-assignment-form">
            <div className="form-section">
              <h3>➕ Yeni Ders Ataması</h3>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Sınıf *</label>
                  <select value={formData.classroom_id} onChange={(e) => setFormData({ ...formData, classroom_id: e.target.value })} required>
                    <option value="">Sınıf seçiniz</option>
                    {classrooms.map(c => <option key={c.classroom_id} value={c.classroom_id}>{c.classroom_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Ders *</label>
                  <select value={formData.subject_id} onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })} required>
                    <option value="">Ders seçiniz</option>
                    {subjects.map(s => (
                      <option key={s.subject_id} value={s.subject_id}>
                        {s.subject_name} {s.weekly_hours ? `(${s.weekly_hours} saat)` : '(⚠️ Saat yok!)'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Öğretmen *</label>
                  <select value={formData.teacher_id} onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })} required>
                    <option value="">Öğretmen seçiniz</option>
                    {teachers.map(t => <option key={t.user_id} value={t.user_id}>{t.full_name} {t.branch && `(${t.branch})`}</option>)}
                  </select>
                </div>
              </div>

              {selectedSubjectInfo && selectedSubjectInfo.weekly_hours && (
                <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '1.5rem', borderRadius: '12px', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 4px 12px rgba(102,126,234,0.4)' }}>
                  <CheckCircle size={32} />
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.25rem' }}>{selectedSubjectInfo.subject_name}</div>
                    <div>Haftalık Ders Saati: <strong style={{ fontSize: '1.5rem' }}>{selectedSubjectInfo.weekly_hours} saat</strong> (Otomatik)</div>
                  </div>
                </div>
              )}

              {selectedSubjectInfo && !selectedSubjectInfo.weekly_hours && (
                <div style={{ background: '#fee2e2', border: '2px solid #ef4444', color: '#991b1b', padding: '1rem', borderRadius: '12px', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <AlertCircle size={24} />
                  <div><strong>{selectedSubjectInfo.subject_name}</strong> dersinin haftalık saati tanımlanmamış!</div>
                </div>
              )}

              <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                <button type="submit" className="btn-primary" disabled={loading || (selectedSubjectInfo && !selectedSubjectInfo.weekly_hours)}>
                  {loading ? <>⏳ Ekleniyor...</> : <><Plus size={20} /><span>Atama Ekle</span></>}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Filtre */}
        <div className="form-container" style={{ marginTop: '2rem' }}>
          <div className="form-section">
            <h3>🔍 Sınıf ve Öğretmen Filtrele</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Sınıf</label>
                <select
                  value={selectedClassroom}
                  onChange={(e) => setSelectedClassroom(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
                >
                  <option value="">Tüm Sınıflar</option>
                  {classrooms.map(c => <option key={c.classroom_id} value={c.classroom_id}>{c.classroom_name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Öğretmen</label>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
                >
                  <option value="">Tüm Öğretmenler</option>
                  {teachers.map(t => <option key={t.user_id} value={t.user_id}>{t.full_name}</option>)}
                </select>
              </div>
            </div>
            {(selectedClassroom || selectedTeacher) && (
              <button
                onClick={() => { setSelectedClassroom(''); setSelectedTeacher(''); }}
                style={{ marginTop: '0.75rem', background: '#f3f4f6', border: 'none', borderRadius: '8px', padding: '6px 16px', cursor: 'pointer', fontSize: '13px', color: '#6b7280', fontWeight: '600' }}
              >
                ✕ Filtreyi Temizle
              </button>
            )}
          </div>
        </div>

        {/* Sınıf özeti banner - sadece sınıf filtresi seçiliyken */}
        {classroomSummary && selectedClassroom && (
          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '1.5rem', borderRadius: '12px', marginTop: '2rem', boxShadow: '0 4px 12px rgba(102,126,234,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Seçili Sınıf</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{classrooms.find(c => c.classroom_id === parseInt(selectedClassroom))?.classroom_name}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Toplam Saat</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{classroomSummary.total_hours}/40 saat</div>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', height: '8px', borderRadius: '4px', marginTop: '1rem', overflow: 'hidden' }}>
              <div style={{ background: 'white', height: '100%', width: `${Math.min((classroomSummary.total_hours / 40) * 100, 100)}%`, transition: 'width 0.3s' }} />
            </div>
          </div>
        )}

        {/* Atama Kartları */}
        <div className="classrooms-table-container" style={{ marginTop: '2rem' }}>
          <div className="table-header">
            <h2>📋 Atamalar ({displayedAssignments.length})</h2>
          </div>

          {displayedAssignments.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
              {displayedAssignments.map((assignment) => (
                <div key={assignment.assignment_id} style={{
                  background: 'white', borderRadius: '10px', padding: '1rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb',
                  borderLeft: `4px solid ${assignment.color || '#667eea'}`,
                  display: 'flex', flexDirection: 'column', gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <strong style={{ fontSize: '0.95rem', color: '#1f2937', lineHeight: 1.3 }}>{assignment.subject_name}</strong>
                    <button onClick={() => handleDelete(assignment.assignment_id)}
                      style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#dc2626', flexShrink: 0, marginLeft: '0.5rem' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>👤 {assignment.teacher_name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                    <span style={{ background: '#f0f4ff', color: '#667eea', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600' }}>
                      {assignment.classroom_name}
                    </span>
                    <span style={{ background: '#d1fae5', color: '#065f46', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700' }}>
                      {assignment.weekly_hours} saat
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: '#dbeafe', border: '2px solid #3b82f6', borderRadius: '12px', padding: '2rem', textAlign: 'center', marginTop: '1rem' }}>
              <BookOpen size={48} style={{ color: '#3b82f6', margin: '0 auto 1rem' }} />
              <h3 style={{ color: '#1e40af', marginBottom: '0.5rem' }}>Sonuç Bulunamadı</h3>
              <p style={{ color: '#1e40af' }}>Filtre kriterlerinize uygun atama yok</p>
            </div>
          )}
        </div>

        {/* Sınıf Bazlı Özet Kartları */}
        <div className="classrooms-table-container" style={{ marginTop: '2rem' }}>
          <div className="table-header"><h2>📊 Sınıf Bazlı Özet</h2></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {classrooms.map(classroom => {
              const ca = assignments.filter(a => a.classroom_id === classroom.classroom_id);
              const totalHours = ca.reduce((sum, a) => sum + a.weekly_hours, 0);
              const uniqueSubjects = new Set(ca.map(a => a.subject_id)).size;
              const uniqueTeachers = new Set(ca.map(a => a.teacher_id)).size;
              const isComplete = totalHours >= 40;
              return (
                <div key={classroom.classroom_id}
                  style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: isComplete ? '2px solid #10b981' : '2px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.3s' }}
                  onClick={() => { setSelectedClassroom(classroom.classroom_id.toString()); setSelectedTeacher(''); }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>{classroom.classroom_name}</h3>
                    {isComplete && <CheckCircle size={24} color="#10b981" />}
                  </div>
                  <div style={{ background: '#f9fafb', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.9rem', color: '#666' }}>Toplam Saat</span>
                      <span style={{ fontWeight: '700', color: totalHours >= 40 ? '#10b981' : '#667eea' }}>{totalHours}/40</span>
                    </div>
                    <div style={{ background: '#e5e7eb', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ background: totalHours >= 40 ? '#10b981' : '#667eea', height: '100%', width: `${Math.min((totalHours / 40) * 100, 100)}%`, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ background: '#fef3c7', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#92400e' }}>{uniqueSubjects}</div>
                      <div style={{ fontSize: '0.75rem', color: '#92400e' }}>Ders</div>
                    </div>
                    <div style={{ background: '#e0e7ff', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3730a3' }}>{uniqueTeachers}</div>
                      <div style={{ fontSize: '0.75rem', color: '#3730a3' }}>Öğretmen</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}