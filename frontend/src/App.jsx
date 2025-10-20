import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/homepage";

import SignUp from "./pages/signup";
import Login from "./pages/login";
import MailVerification from "./pages/mailverification";
import PasswordReset from "./pages/Passwords/resetpasswordsendtoken";
import ChangePasswordAfterReset from "./pages/Passwords/changepasswordafterreset";

import AuthRoot from "./contexts/AuthRoot";

// Import dashboard components for direct routing
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import ManagerDashboard from "./pages/dashboards/ManagerDashboard";
import TrainerDashboard from "./pages/dashboards/TrainerDashboard";
import TraineeDashboard from "./pages/dashboards/TraineeDashboard";
import ProfilePage from "./pages/ProfilePage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route 
          path="/signup" 
          element={
            <AuthRoot requireLogout={true}>
              <SignUp />
            </AuthRoot>
          } 
        />
        <Route 
          path="/login" 
          element={
            <AuthRoot requireLogout={true}>
              <Login />
            </AuthRoot>
          } 
        />
        <Route 
          path="/mailverification" 
          element={
            <AuthRoot requireLogout={true}>
              <MailVerification />
            </AuthRoot>
          } 
        />
        <Route 
          path="/reset-password" 
          element={
            <AuthRoot requireLogout={true}>
              <PasswordReset />
            </AuthRoot>
          } 
        />
        <Route 
          path="/new-password" 
          element={
            <AuthRoot requireLogout={true}>
              <ChangePasswordAfterReset />
            </AuthRoot>
          } 
        />
        
        {/* Protected Dashboard Routes */}
        <Route 
          path="/admin-dashboard" 
          element={
            <AuthRoot allowedPrivileges={['admin']}>
              <AdminDashboard />
            </AuthRoot>
          } 
        />
        <Route 
          path="/manager-dashboard" 
          element={
            <AuthRoot allowedPrivileges={['manager']}>
              <ManagerDashboard />
            </AuthRoot>
          } 
        />
        <Route 
          path="/trainer-dashboard" 
          element={
            <AuthRoot allowedPrivileges={['trainer']}>
              <TrainerDashboard />
            </AuthRoot>
          } 
        />
        <Route 
          path="/trainee-dashboard" 
          element={
            <AuthRoot allowedPrivileges={['trainee']}>
              <TraineeDashboard />
            </AuthRoot>
          } 
        />
        
        {/* Profile Routes */}
        <Route 
          path="/profile" 
          element={<ProfilePage />}
        />
        <Route 
          path="/user/:username" 
          element={<ProfilePage />}
        />
      </Routes>
    </Router>
  );
}

export default App;
