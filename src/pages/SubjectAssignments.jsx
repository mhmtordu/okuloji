import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Trash2, CheckCircle, AlertCircle, Edit, X, BookOpen } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import './Dashboard.css';

const API_URL = 'http://localhost:5000/api';

const capitalize = (str) => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export default function SubjectAssignments() {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formClassroom, setFormClassroom] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formTeacher, setFormTeacher] = useState('');

  const [filterClassroom, setFilterClassroom] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');

  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    if (!getToken()) { navigate('/login'); return; }
    fetchAll();
  }, [navigate]);

  const fetchAll = async () => {
    await Promise.all([fetchClassrooms(), fetchSubjects(), fetchTeachers(), fetchAssignments()]);
  };

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
      const res = await axios.get(`${API_URL}/teachers`, { headers: { Authorization: `Bearer ${getToken()}` } });
      setTeachers(res.data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchAssignments = async () => {
    try {
      const res = await axios.get(`${API_URL}/subject-assignments`, { headers: { Authorization: `Bearer ${getToken()}` } });
      setAssignments(res.data.data || []);
    } catch (e) { console.error(e); }
  };

  const selectedClassroomObj = classrooms.find(c => c.classroom_id === parseInt(formClassroom));
  const filteredSubjects = formClassroom && selectedClassroomObj
    ? subjects.filter(s => s.grade_level == selectedClassroomObj.grade_level)
    : subjects;
  const selectedSubjectObj = subjects.find(s => s.subject_id === parseInt(formSubject));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formClassroom || !formSubject || !formTeacher) {
      setMessage({ type: 'error', text: 'Tüm alanları doldurun!' }); return;
    }
    if (!selectedSubjectObj?.weekly_hours) {
      setMessage({ type: 'error', text: `${selectedSubjectObj?.subject_name} dersinin haftalık saati tanımlanmamış!` }); return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/subject-assignments`, {
        classroom_id: parseInt(formClassroom),
        subject_id: parseInt(formSubject),
        teacher_id: parseInt(formTeacher),
        weekly_hours: parseInt(selectedSubjectObj.weekly_hours)
      }, { headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' } });
      setMessage({ type: 'success', text: `Atama eklendi! (${selectedSubjectObj.weekly_hours} saat/hafta)` });
      setFormSubject('');
      setFormTeacher('');
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

  const handleEdit = (assignment) => {
    setEditData({
      assignment_id: assignment.assignment_id,
      teacher_id: assignment.teacher_id,
      weekly_hours: assignment.weekly_hours,
      subject_name: assignment.subject_name,
      classroom_name: assignment.classroom_name,
    });
    setEditModal(true);
  };

  const handleEditSave = async () => {
    setEditLoading(true);
    try {
      await axios.put(`${API_URL}/subject-assignments/${editData.assignment_id}`, {
        teacher_id: parseInt(editData.teacher_id),
        weekly_hours: parseInt(editData.weekly_hours),
      }, { headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' } });
      setMessage({ type: 'success', text: 'Atama güncellendi!' });
      setEditModal(false);
      fetchAssignments();
    } catch (e) {
      setMessage({ type: 'error', text: 'Güncelleme başarısız!' });
    } finally { setEditLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const displayedAssignments = assignments.filter(a => {
    const matchClassroom = filterClassroom ? a.classroom_id === parseInt(filterClassroom) : true;
    const matchTeacher = filterTeacher ? a.teacher_id === parseInt(filterTeacher) : true;
    return matchClassroom && matchTeacher;
  });

  // maxHours: o sınıfın grade_level'ına tanımlı derslerin weekly_hours toplamı
  const classroomStats = classrooms.map(c => {
    const ca = assignments.filter(a => a.classroom_id === c.classroom_id);
    const totalHours = ca.reduce((sum, a) => sum + (a.weekly_hours || 0), 0);
    const maxHours = subjects
      .filter(s => s.grade_level == c.grade_level)
      .reduce((sum, s) => sum + (s.weekly_hours || 0), 0);
    return { ...c, totalHours, assignmentCount: ca.length, maxHours: maxHours || null };
  });

  const selectStyle = {
    width: '100%', padding: '0.65rem 1rem', borderRadius: '8px',
    border: '1px solid #ddd', fontSize: '14px', background: 'white', cursor: 'pointer'
  };

  return (
    <div className="dashboard">
      <Sidebar onLogout={handleLogout} />
      <main className="main-content">
        <Header />

        {message.text && (
          <div className={`message-box ${message.type}`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Atama Formu */}
        <div className="form-container">
          <form onSubmit={handleSubmit} className="subject-form">
            <div className="form-section">
              <h3>➕ Yeni Ders Ataması</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Sınıf *</label>
                  <select value={formClassroom} onChange={(e) => { setFormClassroom(e.target.value); setFormSubject(''); setFormTeacher(''); }} required>
                    <option value="">Sınıf seçiniz</option>
                    {classrooms.map(c => <option key={c.classroom_id} value={c.classroom_id}>{c.classroom_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    Ders * {formClassroom && selectedClassroomObj &&
                      <span style={{ fontSize: '12px', color: '#667eea', fontWeight: '600' }}>
                        ({selectedClassroomObj.grade_level}. sınıf dersleri)
                      </span>}
                  </label>
                  <select value={formSubject} onChange={(e) => { setFormSubject(e.target.value); setFormTeacher(''); }} required disabled={!formClassroom}>
                    <option value="">Ders seçiniz</option>
                    {filteredSubjects.map(s => (
                      <option key={s.subject_id} value={s.subject_id}>
                        {s.subject_name} ({s.weekly_hours || '⚠️'} saat)
                      </option>
                    ))}
                  </select>
                  {formClassroom && filteredSubjects.length === 0 && (
                    <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>Bu sınıf seviyesine ait ders tanımlanmamış!</p>
                  )}
                </div>
                <div className="form-group">
                  <label>Öğretmen *</label>
                  <select value={formTeacher} onChange={(e) => setFormTeacher(e.target.value)} required disabled={!formSubject}>
                    <option value="">Öğretmen seçiniz</option>
                    {teachers.map(t => (
                      <option key={t.user_id} value={t.user_id}>
                        {capitalize(t.full_name)} {t.branch ? `(${capitalize(t.branch)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedSubjectObj && (
                <div style={{
                  background: selectedSubjectObj.weekly_hours ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#fee2e2',
                  color: selectedSubjectObj.weekly_hours ? 'white' : '#991b1b',
                  padding: '1rem 1.5rem', borderRadius: '10px', marginTop: '1rem',
                  display: 'flex', alignItems: 'center', gap: '1rem'
                }}>
                  {selectedSubjectObj.weekly_hours
                    ? <><CheckCircle size={24} /><span><strong>{selectedSubjectObj.subject_name}</strong> — Haftalık <strong>{selectedSubjectObj.weekly_hours} saat</strong> (otomatik atanacak)</span></>
                    : <><AlertCircle size={24} /><span><strong>{selectedSubjectObj.subject_name}</strong> — Haftalık saat tanımlanmamış!</span></>
                  }
                </div>
              )}

              <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                <button type="submit" className="btn-primary" disabled={loading || !formClassroom || !formSubject || !formTeacher}>
                  {loading ? 'Ekleniyor...' : <><Plus size={20} /><span>Atama Ekle</span></>}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Filtreler */}
        <div className="form-container" style={{ marginTop: '1.5rem' }}>
          <div className="form-section">
            <h3>🔍 Filtrele</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'flex-end', marginTop: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Sınıfa Göre</label>
                <select value={filterClassroom} onChange={(e) => setFilterClassroom(e.target.value)} style={selectStyle}>
                  <option value="">Tüm Sınıflar</option>
                  {classrooms.map(c => <option key={c.classroom_id} value={c.classroom_id}>{c.classroom_name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Öğretmene Göre</label>
                <select value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)} style={selectStyle}>
                  <option value="">Tüm Öğretmenler</option>
                  {teachers.map(t => <option key={t.user_id} value={t.user_id}>{capitalize(t.full_name)}</option>)}
                </select>
              </div>
              <div>
                {(filterClassroom || filterTeacher) && (
                  <button
                    onClick={() => { setFilterClassroom(''); setFilterTeacher(''); }}
                    style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', border: '1px solid #ddd', background: '#f9fafb', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#6b7280', whiteSpace: 'nowrap' }}
                  >
                    ✕ Temizle
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Atama Listesi */}
        <div className="form-container" style={{ marginTop: '1.5rem' }}>
          <div className="form-section">
            <h3>📋 Atamalar ({displayedAssignments.length})</h3>
            {displayedAssignments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                <BookOpen size={48} style={{ margin: '0 auto 1rem', display: 'block' }} />
                <p>Henüz atama yok</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                {displayedAssignments.map((a) => (
                  <div key={a.assignment_id} style={{
                    background: 'white', borderRadius: '10px', padding: '1rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb',
                    borderLeft: `4px solid ${a.color || '#667eea'}`,
                    display: 'flex', flexDirection: 'column', gap: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <strong style={{ fontSize: '0.95rem', color: '#1f2937' }}>{a.subject_name}</strong>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => handleEdit(a)} style={{ background: '#e0e7ff', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#4338ca' }}>
                          <Edit size={13} />
                        </button>
                        <button onClick={() => handleDelete(a.assignment_id)} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#dc2626' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>👤 {capitalize(a.teacher_name)}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ background: '#f0f4ff', color: '#667eea', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600' }}>
                        {a.classroom_name}
                      </span>
                      <span style={{ background: '#d1fae5', color: '#065f46', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700' }}>
                        {a.weekly_hours} saat
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sınıf Özet Kartları */}
        <div className="form-container" style={{ marginTop: '1.5rem' }}>
          <div className="form-section">
            <h3>📊 Sınıf Bazlı Özet</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
              {classroomStats.map(c => {
                const maxHours = c.maxHours;
                const pct = maxHours ? Math.min((c.totalHours / maxHours) * 100, 100) : 0;
                const done = maxHours && c.totalHours >= maxHours;
                return (
                  <div key={c.classroom_id}
                    onClick={() => { setFilterClassroom(c.classroom_id.toString()); setFilterTeacher(''); }}
                    style={{
                      background: 'white', borderRadius: '10px', padding: '1rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                      border: filterClassroom == c.classroom_id ? '2px solid #667eea' : done ? '2px solid #10b981' : '2px solid #e5e7eb',
                      cursor: 'pointer', transition: 'transform 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong>{c.classroom_name}</strong>
                      {done && <CheckCircle size={18} color="#10b981" />}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                      {c.totalHours} saat · {c.assignmentCount} atama
                    </div>
                    <div style={{ background: '#e5e7eb', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ background: done ? '#10b981' : '#667eea', height: '100%', width: `${pct}%`, transition: 'width 0.3s' }} />
                    </div>
                    {!maxHours && (
                      <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>⚠️ Ders tanımlanmamış</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </main>

      {/* Düzenleme Modalı */}
      {editModal && editData && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>✏️ Atama Düzenle</h3>
              <button className="modal-close" onClick={() => setEditModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#f3f4f6', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '14px', color: '#374151' }}>
                <strong>{editData.subject_name}</strong> — {editData.classroom_name}
              </div>
              <div className="form-group">
                <label>Öğretmen</label>
                <select value={editData.teacher_id} onChange={(e) => setEditData({ ...editData, teacher_id: e.target.value })}>
                  {teachers.map(t => (
                    <option key={t.user_id} value={t.user_id}>
                      {capitalize(t.full_name)} {t.branch ? `(${capitalize(t.branch)})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Haftalık Saat</label>
                <input type="number" value={editData.weekly_hours} onChange={(e) => setEditData({ ...editData, weekly_hours: e.target.value })} min="1" max="40" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setEditModal(false)}>İptal</button>
              <button className="btn-primary" onClick={handleEditSave} disabled={editLoading}>
                {editLoading ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}