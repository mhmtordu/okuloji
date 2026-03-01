import { useState, useEffect } from "react";

function Header() {
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    fetchSchool();
  }, []);

  const fetchSchool = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/school", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSchool(data.data);
      }
    } catch (error) {
      console.error("School fetch error:", error);
    }
  };

  if (!user) return null;

  return (
    <header className="dashboard-header">
      <div>
        <h1>Hoş Geldiniz, {user.fullName}</h1>
        {school && <p className="school-name">{school.school_name}</p>}
      </div>
      <div className="user-info">
        <span>{user.email}</span>
        <span className="badge">
          {user.role === "admin" ? "Yönetici" : "Öğretmen"}
        </span>
      </div>
    </header>
  );
}

export default Header;