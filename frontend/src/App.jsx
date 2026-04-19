import React from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
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
import TrainerDashboardHome from "./pages/dashboards/trainer/TrainerDashboardHome";
import TrainerProfile from "./pages/dashboards/trainer/TrainerProfile";
import TrainerPayments from "./pages/dashboards/trainer/TrainerPayments";
import TrainerMessages from "./pages/dashboards/trainer/TrainerMessages";
import CreatePrograms from "./pages/dashboards/trainer/CreatePrograms";
import ManageClientPrograms from "./pages/dashboards/trainer/ManageClientPrograms";
import TrainerClientsManagement from "./pages/dashboards/trainer/TrainerClientsManagement";
import ClientAnalytics from "./pages/dashboards/trainer/ClientAnalytics";

import TraineeDashboardHome from "./pages/dashboards/trainee/Dashboard";
import ProfilePage from "./pages/dashboards/trainee/ProfilePage";
import ProgramMarketplace from "./pages/dashboards/trainee/ProgramMarketplace";

import ProgramView from "./pages/dashboards/trainee/ProgramView";
import UserProgramView from "./pages/dashboards/trainee/UserProgramView";
import EditUserProgram from "./pages/dashboards/trainee/EditUserProgram";
import Progress from "./pages/dashboards/trainee/Progress";
import MessagesPage from "./pages/dashboards/trainee/MessagesPage";
import AnalyticsDashboard from "./pages/dashboards/trainee/AnalyticsDashboard";
import TrainingPeriodManager from "./pages/dashboards/trainee/TrainingPeriodManager";

import Coach from "./pages/dashboards/trainee/Coach";
import MyCoach from "./pages/dashboards/trainee/MyCoach";
import TrainerProfileView from "./pages/dashboards/trainee/TrainerProfile";

import AdminProfile from "./pages/dashboards/admin/AdminProfile";

import AdminUserDashboard from "./pages/dashboards/admin/UsersDashboard/UsersDashboard";
import EmailMarketing from "./pages/dashboards/admin/EmailMarketing";
import AdminMessages from "./pages/dashboards/admin/AdminMessages";
import AdminAnalytics from "./pages/dashboards/admin/AdminAnalytics";

// Trainee Connection System Pages
import FindTrainersPage from "./pages/dashboards/trainee/FindTrainersPage";
import MyPlansPage from "./pages/dashboards/trainee/MyPlansPage";   

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
          path="/admin-profile" 
          element={
            <AuthRoot allowedPrivileges={['admin', 'manager']}>
              <AdminProfile />
            </AuthRoot>
          } 
        />
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
          path="/profile" 
          element={
            <AuthRoot allowedPrivileges={['trainer']}>
              <TrainerProfile />
            </AuthRoot>
          } 
        />
        <Route 
          path="/programs" 
          element={
            <AuthRoot allowedPrivileges={['trainer', 'trainee']}>
              <CreatePrograms />
            </AuthRoot>
          } 
        />

        <Route 
          path="/clients" 
          element={
            <AuthRoot allowedPrivileges={['trainer']}>
              <TrainerClientsManagement />
            </AuthRoot>
          } 
        />
        <Route 
          path="/clients/:clientId/manage" 
          element={
            <AuthRoot allowedPrivileges={['trainer']}>
              <ManageClientPrograms />
            </AuthRoot>
          } 
        />
        <Route 
          path="/clients/:clientId/analytics" 
          element={
            <AuthRoot allowedPrivileges={['trainer']}>
              <ClientAnalytics />
            </AuthRoot>
          } 
        />
        <Route 
          path="/payments" 
          element={
            <AuthRoot allowedPrivileges={['trainer']}>
              <TrainerPayments />
            </AuthRoot>
          } 
        />
        <Route 
          path="/messages" 
          element={
            <AuthRoot allowedPrivileges={['trainer']}>
              <TrainerMessages />
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
              <Navigate to="/trainee-dashboard/my-plans" replace />
            </AuthRoot>
          }
        />
        <Route 
          path="/trainee-dashboard/marketplace" 
          element={
            <AuthRoot allowedPrivileges={['trainee']}>
              <ProgramMarketplace />
            </AuthRoot>
          }
        />
        <Route 
          path="/trainee-dashboard/program/:programId" 
          element={
            <AuthRoot allowedPrivileges={['trainee']}>
              <ProgramView />
            </AuthRoot>
          }
        />
        <Route 
          path="/trainee-dashboard/user-program/:programId" 
          element={
            <AuthRoot allowedPrivileges={['trainee']}>
              <UserProgramView />
            </AuthRoot>
          }
        />
        <Route 
          path="/trainee-dashboard/user-program/:programId/edit" 
          element={
            <AuthRoot allowedPrivileges={['trainee']}>
              <EditUserProgram />
            </AuthRoot>
          }
        />
        <Route 
          path="/trainee-dashboard/workouts" 
          element={
            <AuthRoot allowedPrivileges={['trainee']}>
              <Navigate to="/trainee-dashboard/my-plans" replace />
            </AuthRoot>
          }
        />
        <Route 
          path="/meals" 
          element={
            <AuthRoot allowedPrivileges={['trainee']}>
              <Navigate to="/trainee-dashboard/my-plans" replace state={{ activeTab: 'meals' }} />
            </AuthRoot>
          }
        />
        <Route 
          path="/trainee-dashboard/analytics" 
          element={<AuthRoot allowedPrivileges={['trainee']}>
              <AnalyticsDashboard />
            </AuthRoot>
          }
        />
        <Route 
          path="/trainee-dashboard/training-periods" 
          element={<AuthRoot allowedPrivileges={['trainee']}>
              <TrainingPeriodManager />
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
          path="/messages" 
          element={
            <AuthRoot allowedPrivileges={['trainee']}>
              <MessagesPage />
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
        <Route 
          path="/trainee-dashboard/my-coach" 
          element={
            <AuthRoot allowedPrivileges={['trainee']}>
              <MyCoach />
            </AuthRoot>
          }
        />
        <Route 
          path="/trainee-dashboard/trainer/:trainerId" 
          element={
            <AuthRoot allowedPrivileges={['trainee']}>
              <TrainerProfileView />
            </AuthRoot>
          }
        />
        <Route 
          path="/trainee-dashboard/find-trainer" 
          element={
            <AuthRoot allowedPrivileges={['trainee']}>
              <FindTrainersPage />
            </AuthRoot>
          }
        />
        <Route 
          path="/trainee-dashboard/my-plans" 
          element={
            <AuthRoot allowedPrivileges={['trainee']}>
              <MyPlansPage />
            </AuthRoot>
          }
        />
        <Route 
          path="/trainee-dashboard/my-requests" 
          element={
            <AuthRoot allowedPrivileges={['trainee']}>
              <Navigate
                to="/trainee-dashboard/my-coach"
                replace
                state={{ showCoachBrowser: true, initialConnectionView: 'requests' }}
              />
            </AuthRoot>
          }
        />
        <Route 
          path="/trainee-dashboard/profile" 
          element={
            <AuthRoot allowedPrivileges={['trainee']}>
              <ProfilePage />
            </AuthRoot>
          }
        />
        <Route 
          path="/trainee-dashboard/messages" 
          element={
            <AuthRoot allowedPrivileges={['trainee']}>
              <MessagesPage />
            </AuthRoot>
          }
        />

 <Route 
          path="/admin/users" 
          element={
            <AuthRoot allowedPrivileges={['admin']}>
              <AdminUserDashboard />
            </AuthRoot>
          } 
        />

        <Route 
          path="/admin/email-marketing" 
          element={
            <AuthRoot allowedPrivileges={['admin']}>
              <EmailMarketing />
            </AuthRoot>
          } 
        />

        <Route 
          path="/admin/messages" 
          element={
            <AuthRoot allowedPrivileges={['admin']}>
              <AdminMessages />
            </AuthRoot>
          } 
        />

        <Route
          path="/admin/analytics"
          element={
            <AuthRoot allowedPrivileges={['admin']}>
              <AdminAnalytics />
            </AuthRoot>
          }
        />

      </Routes>
    </Router>
  );
}

export default App;
