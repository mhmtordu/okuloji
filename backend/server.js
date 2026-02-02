import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import schoolRoutes from "./routes/schoolRoutes.js";
import classroomRoutes from "./routes/classroomRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import timeSlotRoutes from "./routes/timeSlotRoutes.js";
import teacherUnavailabilityRoutes from './routes/teacherUnavailability.js'; 
import subjectAssignmentRoutes from './routes/subjectAssignments.js';
import scheduleRoutes from './routes/scheduleRoutes.js'; // ← YENİ EKLE ✅

// Config
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test Route
app.get("/", (req, res) => {
  res.json({
    message: "Okuloji Backend API",
    status: "Running",
    version: "1.0.0",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/school", schoolRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/timeslots", timeSlotRoutes);
app.use('/api/teacher-unavailability', teacherUnavailabilityRoutes);
app.use('/api/subject-assignments', subjectAssignmentRoutes);
app.use('/api/schedules', scheduleRoutes); // ← YENİ EKLE ✅

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Sunucu hatası!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// Server Start
app.listen(PORT, () => {
  console.log(`🚀 Server ${PORT} portunda çalışıyor...`);
  console.log(`📍 http://localhost:${PORT}`);
});