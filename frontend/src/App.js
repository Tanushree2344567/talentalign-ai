import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Landing       from "./pages/Landing";
import Login         from "./pages/Login";
import Signup        from "./pages/Signup";
import Dashboard     from "./pages/Dashboard";
import CreateProject from "./pages/CreateProject";
import Upload        from "./pages/Upload";
import Results       from "./pages/Results";
import SupportTickets from "./pages/SupportTickets";
import ChoosePlan    from "./pages/ChoosePlan";
import Payment       from "./pages/Payment";       // ← NEW
import Profile       from "./pages/Profile";
import History       from "./pages/History";
import ChatWidget    from "./components/ChatWidget";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("access_token");
  if (!token) return <Navigate to="/login" />;
  return children;
};

function App() {
  const token = localStorage.getItem("access_token");

  return (
    <BrowserRouter>
      <Routes>

        <Route path="/"        element={<Landing />} />
        <Route path="/login"   element={<Login />} />
        <Route path="/signup"  element={<Signup />} />

        <Route path="/choose-plan" element={<PrivateRoute><ChoosePlan /></PrivateRoute>} />
        <Route path="/payment"     element={<PrivateRoute><Payment /></PrivateRoute>} />  {/* ← NEW */}

        <Route path="/dashboard"                  element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/projects/new"               element={<PrivateRoute><CreateProject /></PrivateRoute>} />
        <Route path="/projects/:projectId/upload" element={<PrivateRoute><Upload /></PrivateRoute>} />
        <Route path="/projects/:projectId/results"element={<PrivateRoute><Results /></PrivateRoute>} />
        <Route path="/support/tickets"            element={<PrivateRoute><SupportTickets /></PrivateRoute>} />
        <Route path="/profile"                    element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/history"                    element={<PrivateRoute><History /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" />} />

      </Routes>

      {token && <ChatWidget />}
    </BrowserRouter>
  );
}

export default App;
