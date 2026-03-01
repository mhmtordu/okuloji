import { Link, useLocation } from "react-router-dom";
import { LogOut, Users, BookOpen, Calendar, Settings, School, Home, Clock } from "lucide-react";

function Sidebar({ onLogout }) {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Okuloji</h2>
      </div>

      <nav className="sidebar-nav">
        <Link to="/dashboard" className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
          <Home size={20} />
          <span>Anasayfa</span>
        </Link>
        <Link to="/timeslots" className={`nav-item ${location.pathname === '/timeslots' ? 'active' : ''}`}>
          <Clock size={20} />
          <span>Zaman Dilimi Ayarları</span>
        </Link>
        <Link to="/school-info" className={`nav-item ${location.pathname === '/school-info' ? 'active' : ''}`}>
          <School size={20} />
          <span>Kurum Bilgileri</span>
        </Link>
        <Link to="/teachers" className={`nav-item ${location.pathname === '/teachers' ? 'active' : ''}`}>
          <Users size={20} />
          <span>Öğretmen Bilgileri</span>
        </Link>
        <Link to="/classrooms" className={`nav-item ${location.pathname === '/classrooms' ? 'active' : ''}`}>
          <BookOpen size={20} />
          <span>Şube Bilgileri</span>
        </Link>
        <Link to="/subjects" className={`nav-item ${location.pathname === '/subjects' ? 'active' : ''}`}>
          <BookOpen size={20} />
          <span>Okutulacak Ders Bilgileri</span>
        </Link>
        <Link to="/teacher-unavailability" className={`nav-item ${location.pathname === '/teacher-unavailability' ? 'active' : ''}`}>
          <Users size={20} />
          <span>Öğretmen Kısıtlamaları</span>
        </Link>
        <Link to="/subject-assignments" className={`nav-item ${location.pathname === '/subject-assignments' ? 'active' : ''}`}>
          <Calendar size={20} />
          <span>Ders Atamaları</span>
        </Link>
        <Link to="/schedules" className={`nav-item ${location.pathname === '/schedules' ? 'active' : ''}`}>
          <Calendar size={20} />
          <span>Ders Programı</span>
        </Link>
        <Link to="/settings" className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`}>
          <Settings size={20} />
          <span>Ayarlar</span>
        </Link>
      </nav>

      <div className="sidebar-footer">
        <button onClick={onLogout} className="logout-btn">
          <LogOut size={20} />
          <span>Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;