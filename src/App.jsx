import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SchoolInfo from "./pages/SchoolInfo";
import Classrooms from "./pages/Classrooms";
import EditClassroom from "./pages/EditClassroom";
import Subjects from "./pages/Subjects";
import Teachers from './pages/Teachers'
import TimeSlots from './pages/TimeSlots'
import TeacherUnavailability from './pages/TeacherUnavailability';
import SubjectAssignments from './pages/SubjectAssignments';
import Schedules from './pages/Schedules';
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/school-info" element={<SchoolInfo />} />
        <Route path="/classrooms" element={<Classrooms />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/timeslots" element={<TimeSlots />} />
        <Route path="/teacher-unavailability" element={<TeacherUnavailability />} />
        <Route path="/subject-assignments" element={<SubjectAssignments />} />
        <Route path="/schedules" element={<Schedules />} />
      </Routes>
    </Router>
  );
}

export default App;
// Import ekle


// Routes içine ekle:
