import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, X, AlertCircle, CheckCircle } from 'lucide-react'
import './Dashboard.css'

function EditClassroom() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [teachers, setTeachers] = useState([])
  
  const [formData, setFormData] = useState({
    classroom_name: '',
    class_teacher_id: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    
    if (!token) {
      navigate('/login')
      return
    }

    fetchClassroom()
    fetchTeachers()
  }, [id, navigate])

  const fetchClassroom = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/classrooms`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      
      if (data.success) {
        const classroom = data.classrooms.find(c => c.classroom_id === parseInt(id))
        if (classroom) {
          setFormData({
            classroom_name: classroom.classroom_name,
            class_teacher_id: classroom.class_teacher_id || ''
          })
        }
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setMessage({ type: 'error', text: 'Şube bilgileri yüklenirken hata oluştu' })
    }
  }

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('token')
      // TODO: Bu API henüz yok, öğretmenler sayfası yapınca ekleyeceğiz
      // Şimdilik boş array
      setTeachers([])
    } catch (error) {
      console.error('Teachers fetch error:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/classrooms/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Şube başarıyla güncellendi!' })
        setTimeout(() => {
          window.close()
        }, 1500)
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu!' })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    window.close()
  }

  return (
    <div className="edit-classroom-container">
      <div className="edit-classroom-content">
        <div className="edit-header">
          <h1>✏️ Şube Düzenle</h1>
          <button onClick={handleCancel} className="close-btn">
            <X size={24} />
          </button>
        </div>

        {message.text && (
          <div className={`message-box ${message.type}`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group">
            <label htmlFor="classroom_name">Şube Adı *</label>
            <input
              type="text"
              id="classroom_name"
              name="classroom_name"
              value={formData.classroom_name}
              onChange={handleChange}
              required
              placeholder="Örn: 5/A"
            />
          </div>

          <div className="form-group">
            <label htmlFor="class_teacher_id">Rehber Öğretmen</label>
            <select
              id="class_teacher_id"
              name="class_teacher_id"
              value={formData.class_teacher_id}
              onChange={handleChange}
            >
              <option value="">Seçiniz</option>
              {teachers.map(teacher => (
                <option key={teacher.user_id} value={teacher.user_id}>
                  {teacher.full_name}
                </option>
              ))}
            </select>
            {teachers.length === 0 && (
              <small style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Henüz öğretmen eklenmemiş. Önce öğretmenler sayfasından öğretmen ekleyin.
              </small>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              <X size={20} />
              <span>İptal</span>
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>Kaydediliyor...</>
              ) : (
                <>
                  <Save size={20} />
                  <span>Kaydet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditClassroom