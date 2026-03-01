import { Routes, Route, Navigate } from "react-router-dom";
import { Landing } from "../pages/Landing";
import { Login } from "../pages/Login";
import { Signup } from "../pages/Signup";
import { Projects } from "../pages/Projects";
import { ProjectDashboard } from "../pages/ProjectDashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/:id" element={<ProjectDashboard />} />
      <Route path="/dashboard" element={<Navigate to="/projects" replace />} />
    </Routes>
  );
}

