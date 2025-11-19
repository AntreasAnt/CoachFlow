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

import TraineeDashboardHome from "./pages/dashboards/trainee/Dashboard";
import ProfilePage from "./pages/dashboards/trainee/ProfilePage";


import MyWorkouts from "./pages/dashboards/trainee/MyWorkouts";
import MealsPage from "./pages/dashboards/trainee/MealsPage";
import Progress from "./pages/dashboards/trainee/Progress";

import Coach from "./pages/dashboards/trainee/Coach";

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
        
        
        {/* Dashboard alias route */}
        <Route 
          path="/dashboard" 
          element={
            <AuthRoot allowedPrivileges={['trainee']}>

                <TraineeDashboardHome />
             
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
        
        {/* New Page Routes */}
        <Route 
          path="/workouts" 
          element={
            <AuthRoot allowedPrivileges={['trainee']}>
              <MyWorkouts />
            </AuthRoot>
          }
        />
        <Route 
          path="/meals" 
          element={
            <AuthRoot allowedPrivileges={['trainee']}>
              <MealsPage />
            </AuthRoot>
          }
        />
        <Route 
          path="/progress" 
          element={
            <AuthRoot allowedPrivileges={['trainee']}>
              <Progress />
            </AuthRoot>
          }
        />
        <Route 
          path="/coach" 
          element={
            <AuthRoot allowedPrivileges={['trainee']}>
              <Coach />
            </AuthRoot>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
