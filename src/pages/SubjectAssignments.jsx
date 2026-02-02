import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function SubjectAssignments() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Dropdown veriler
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    classroom_id: '',
    subject_id: '',
    teacher_id: ''
  });
  
  // Mevcut atamalar
  const [assignments, setAssignments] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [classroomSummary, setClassroomSummary] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const schoolId = 1;

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
    
    fetchClassrooms();
    fetchSubjects();
    fetchTeachers();
    fetchAssignments();
  }, [navigate]);

  useEffect(() => {
    if (selectedClassroom) {
      fetchClassroomSummary();
    }
  }, [selectedClassroom, assignments]);

  const fetchClassrooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/classrooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClassrooms(res.data.classrooms || []);
    } catch (error) {
      console.error('Şubeler getirilemedi:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/subjects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Dersler yüklendi:', res.data.subjects);
      setSubjects(res.data.subjects || []);
    } catch (error) {
      console.error('❌ Dersler getirilemedi:', error);
    }
  };

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

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/subject-assignments?school_id=${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignments(res.data.data || []);
    } catch (error) {
      console.error('Atamalar getirilemedi:', error);
    }
  };

  const fetchClassroomSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${API_URL}/subject-assignments/classroom/${selectedClassroom}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setClassroomSummary(res.data.summary);
    } catch (error) {
      console.error('Özet getirilemedi:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🔵 Form gönderildi');
    console.log('📝 Form Data:', formData);
    
    if (!formData.classroom_id || !formData.subject_id || !formData.teacher_id) {
      setMessage({ type: 'error', text: 'Tüm alanları doldurun!' });
      return;
    }
    
    // Seçilen dersi bul
    const selectedSubject = subjects.find(s => s.subject_id === parseInt(formData.subject_id));
    console.log('📚 Seçilen ders:', selectedSubject);
    
    if (!selectedSubject) {
      setMessage({ type: 'error', text: 'Ders bulunamadı!' });
      return;
    }
    
    if (!selectedSubject.weekly_hours || selectedSubject.weekly_hours < 1) {
      setMessage({ 
        type: 'error', 
        text: `${selectedSubject.subject_name} dersinin haftalık saati tanımlanmamış!` 
      });
      return;
    }
    
    const dataToSend = {
      classroom_id: parseInt(formData.classroom_id),
      subject_id: parseInt(formData.subject_id),
      teacher_id: parseInt(formData.teacher_id),
      school_id: schoolId,
      weekly_hours: parseInt(selectedSubject.weekly_hours)
    };
    
    console.log('📤 Gönderilecek veri:', dataToSend);
    console.log('⏰ Haftalık saat:', selectedSubject.weekly_hours, 'tip:', typeof selectedSubject.weekly_hours);
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/subject-assignments`,
        dataToSend,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      console.log('✅ Backend yanıtı:', response.data);
      
      setMessage({ 
        type: 'success', 
        text: `Ders ataması başarıyla eklendi! (${selectedSubject.weekly_hours} saat)` 
      });
      
      setFormData({
        classroom_id: '',
        subject_id: '',
        teacher_id: ''
      });
      
      fetchAssignments();
      
    } catch (error) {
      console.error('❌ Ekleme hatası:', error);
      console.error('❌ Hata yanıtı:', error.response?.data);
      console.error('❌ Hata status:', error.response?.status);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Hata oluştu!' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu atamayı silmek istediğinize emin misiniz?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/subject-assignments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage({ type: 'success', text: 'Atama silindi!' });
      fetchAssignments();
    } catch (error) {
      setMessage({ type: 'error', text: 'Silme başarısız!' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const filteredAssignments = selectedClassroom
    ? assignments.filter(a => a.classroom_id === parseInt(selectedClassroom))
    : [];

  const selectedSubjectInfo = formData.subject_id 
    ? subjects.find(s => s.subject_id === parseInt(formData.subject_id))
    : null;

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
            <FileText size={20} />
            <span>Dersler</span>
          </Link>
          <Link to="/teachers" className="nav-item">
            <Users size={20} />
            <span>Öğretmenler</span>
          </Link>
          <Link to="/teacher-unavailability" className="nav-item">
            <Calendar size={20} />
            <span>Öğretmen Kısıtlamaları</span>
          </Link>
          <Link to="/subject-assignments" className="nav-item active">
            <FileText size={20} />
            <span>Ders Atamaları</span>
          </Link>
          <Link to="/schedules" className="nav-item">
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
          <h1>📚 Ders Atamaları</h1>
          <div className="user-info">
            <span className="user-name">{user.full_name}</span>
            <span className="user-role">
              {user.role === "admin" ? "Yönetici" : "Öğretmen"}
            </span>
          </div>
        </header>

        {message.text && (
          <div className={`message-box ${message.type}`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="form-container">
          <form onSubmit={handleSubmit} className="subject-assignment-form">
            <div className="form-section">
              <h3>➕ Yeni Ders Ataması</h3>
              
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="classroom">Sınıf *</label>
                  <select
                    id="classroom"
                    value={formData.classroom_id}
                    onChange={(e) => setFormData({ ...formData, classroom_id: e.target.value })}
                    required
                  >
                    <option value="">Sınıf seçiniz</option>
                    {classrooms.map(c => (
                      <option key={c.classroom_id} value={c.classroom_id}>
                        {c.classroom_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Ders *</label>
                  <select
                    id="subject"
                    value={formData.subject_id}
                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                    required
                  >
                    <option value="">Ders seçiniz</option>
                    {subjects.map(s => (
                      <option key={s.subject_id} value={s.subject_id}>
                        {s.subject_name} {s.weekly_hours ? `(${s.weekly_hours} saat)` : '(⚠️ Saat yok!)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="teacher">Öğretmen *</label>
                  <select
                    id="teacher"
                    value={formData.teacher_id}
                    onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                    required
                  >
                    <option value="">Öğretmen seçiniz</option>
                    {teachers.map(t => (
                      <option key={t.user_id} value={t.user_id}>
                        {t.full_name} {t.branch && `(${t.branch})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedSubjectInfo && selectedSubjectInfo.weekly_hours && (
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  marginTop: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                }}>
                  <CheckCircle size={32} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.25rem' }}>
                      {selectedSubjectInfo.subject_name}
                    </div>
                    <div style={{ fontSize: '1rem', opacity: 0.95 }}>
                      Haftalık Ders Saati: <strong style={{ fontSize: '1.5rem' }}>{selectedSubjectInfo.weekly_hours} saat</strong> (Otomatik)
                    </div>
                  </div>
                </div>
              )}

              {selectedSubjectInfo && !selectedSubjectInfo.weekly_hours && (
                <div style={{
                  background: '#fee2e2',
                  border: '2px solid #ef4444',
                  color: '#991b1b',
                  padding: '1rem',
                  borderRadius: '12px',
                  marginTop: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <AlertCircle size={24} />
                  <div>
                    <strong>{selectedSubjectInfo.subject_name}</strong> dersinin haftalık saati tanımlanmamış! 
                    Lütfen önce "Dersler" sayfasından haftalık saati ekleyin.
                  </div>
                </div>
              )}

              <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading || (selectedSubjectInfo && !selectedSubjectInfo.weekly_hours)}
                >
                  {loading ? (
                    <>⏳ Ekleniyor...</>
                  ) : (
                    <>
                      <Plus size={20} />
                      <span>Atama Ekle</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="form-container" style={{ marginTop: '2rem' }}>
          <div className="form-section">
            <h3>🔍 Sınıf Filtrele</h3>
            <div className="form-group">
              <select
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
              >
                <option value="">Tüm Sınıflar</option>
                {classrooms.map(c => (
                  <option key={c.classroom_id} value={c.classroom_id}>
                    {c.classroom_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {classroomSummary && selectedClassroom && (
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            marginTop: '2rem',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.25rem' }}>
                  Seçili Sınıf
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {classrooms.find(c => c.classroom_id === parseInt(selectedClassroom))?.classroom_name}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.25rem' }}>
                  Toplam Saat
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {classroomSummary.total_hours}/40 saat
                </div>
              </div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              height: '8px',
              borderRadius: '4px',
              marginTop: '1rem',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'white',
                height: '100%',
                width: `${Math.min((classroomSummary.total_hours / 40) * 100, 100)}%`,
                transition: 'width 0.3s'
              }} />
            </div>
          </div>
        )}

        <div className="classrooms-table-container" style={{ marginTop: '2rem' }}>
          <div className="table-header">
            <h2>📋 {selectedClassroom ? 'Seçili Sınıfın Atamaları' : 'Tüm Atamalar'}</h2>
          </div>

          {(selectedClassroom ? filteredAssignments : assignments).length > 0 ? (
            <div className="modern-table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Sınıf</th>
                    <th>Ders</th>
                    <th>Öğretmen</th>
                    <th>Branş</th>
                    <th>Haftalık Saat</th>
                    <th>Tarih</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedClassroom ? filteredAssignments : assignments).map((assignment, index) => (
                    <tr key={assignment.assignment_id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                      <td>
                        <span style={{
                          background: '#f0f4ff',
                          color: '#667eea',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontWeight: '600'
                        }}>
                          {assignment.classroom_name}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: assignment.color || '#667eea'
                          }} />
                          <strong>{assignment.subject_name}</strong>
                        </div>
                      </td>
                      <td>{assignment.teacher_name}</td>
                      <td>
                        <span style={{
                          background: '#fef3c7',
                          color: '#92400e',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '8px',
                          fontSize: '0.85rem'
                        }}>
                          {assignment.teacher_branch || '-'}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          background: '#d1fae5',
                          color: '#065f46',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontWeight: '600',
                          fontSize: '1rem'
                        }}>
                          {assignment.weekly_hours} saat
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: '#666' }}>
                        {new Date(assignment.created_at).toLocaleDateString('tr-TR')}
                      </td>
                      <td>
                        <button
                          onClick={() => handleDelete(assignment.assignment_id)}
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
          ) : (
            <div style={{
              background: '#dbeafe',
              border: '2px solid #3b82f6',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <BookOpen size={48} style={{ color: '#3b82f6', margin: '0 auto 1rem' }} />
              <h3 style={{ color: '#1e40af', marginBottom: '0.5rem' }}>
                Henüz Atama Yok
              </h3>
              <p style={{ color: '#1e40af' }}>
                Yukarıdaki formu kullanarak ders ataması yapabilirsiniz
              </p>
            </div>
          )}
        </div>

        <div className="classrooms-table-container" style={{ marginTop: '2rem' }}>
          <div className="table-header">
            <h2>📊 Sınıf Bazlı Özet</h2>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
            marginTop: '1rem'
          }}>
            {classrooms.map(classroom => {
              const classroomAssignments = assignments.filter(
                a => a.classroom_id === classroom.classroom_id
              );
              const totalHours = classroomAssignments.reduce((sum, a) => sum + a.weekly_hours, 0);
              const uniqueSubjects = new Set(classroomAssignments.map(a => a.subject_id)).size;
              const uniqueTeachers = new Set(classroomAssignments.map(a => a.teacher_id)).size;
              const isComplete = totalHours >= 40;

              return (
                <div
                  key={classroom.classroom_id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: isComplete ? '2px solid #10b981' : '2px solid #e5e7eb',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onClick={() => setSelectedClassroom(classroom.classroom_id.toString())}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>
                      {classroom.classroom_name}
                    </h3>
                    {isComplete && (
                      <CheckCircle size={24} color="#10b981" />
                    )}
                  </div>

                  <div style={{
                    background: '#f9fafb',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ fontSize: '0.9rem', color: '#666' }}>Toplam Saat</span>
                      <span style={{
                        fontWeight: '700',
                        color: totalHours >= 40 ? '#10b981' : '#667eea'
                      }}>
                        {totalHours}/40
                      </span>
                    </div>
                    <div style={{
                      background: '#e5e7eb',
                      height: '6px',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        background: totalHours >= 40 ? '#10b981' : '#667eea',
                        height: '100%',
                        width: `${Math.min((totalHours / 40) * 100, 100)}%`,
                        transition: 'width 0.3s'
                      }} />
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem'
                  }}>
                    <div style={{
                      background: '#fef3c7',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#92400e' }}>
                        {uniqueSubjects}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#92400e' }}>Ders</div>
                    </div>
                    <div style={{
                      background: '#e0e7ff',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3730a3' }}>
                        {uniqueTeachers}
                      </div>
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