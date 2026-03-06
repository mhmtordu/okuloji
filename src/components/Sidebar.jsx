import { Link, useLocation } from "react-router-dom";
import { LogOut, Users, BookOpen, Calendar, Settings, School, Home, Clock, GraduationCap, AlertCircle } from "lucide-react";

function Sidebar({ onLogout }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Okuloji</h2>
      </div>

      <nav className="sidebar-nav">
        <Link to="/dashboard" className={`nav-item ${isActive('/dashboard')}`}>
          <Home size={20} />
          <span>Anasayfa</span>
        </Link>
        <Link to="/timeslots" className={`nav-item ${isActive('/timeslots')}`}>
          <Clock size={20} />
          <span>Zaman Dilimi Ayarları</span>
        </Link>
        <Link to="/school-info" className={`nav-item ${isActive('/school-info')}`}>
          <School size={20} />
          <span>Kurum Bilgileri</span>
        </Link>
        <Link to="/teachers" className={`nav-item ${isActive('/teachers')}`}>
          <Users size={20} />
          <span>Öğretmen Bilgileri</span>
        </Link>
        <Link to="/classrooms" className={`nav-item ${isActive('/classrooms')}`}>
          <BookOpen size={20} />
          <span>Şube Bilgileri</span>
        </Link>
        <Link to="/subjects" className={`nav-item ${isActive('/subjects')}`}>
          <GraduationCap size={20} />
          <span>Ders Bilgileri</span>
        </Link>
        <Link to="/subject-assignments" className={`nav-item ${isActive('/subject-assignments')}`}>
          <Calendar size={20} />
          <span>Ders Atamaları</span>
        </Link>
        <Link to="/teacher-unavailability" className={`nav-item ${isActive('/teacher-unavailability')}`}>
          <AlertCircle size={20} />
          <span>Öğretmen Kısıtlamaları</span>
        </Link>
        <Link to="/schedules" className={`nav-item ${isActive('/schedules')}`}>
          <Calendar size={20} />
          <span>Ders Programı</span>
        </Link>
        <Link to="/settings" className={`nav-item ${isActive('/settings')}`}>
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