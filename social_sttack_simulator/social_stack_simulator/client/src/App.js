import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainPage from "./pages/MainPage";
import ApplicationForm from "./pages/ApplicationForm";
import AdminDashboard from "./Admindashboard";  // Make sure this path is correct

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/apply" element={<ApplicationForm />} />
        <Route path="/admin" element={<AdminDashboard />} />  {/* Added admin route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;