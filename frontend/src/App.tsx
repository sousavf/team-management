import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Capacity from './pages/Capacity';
import TimeOff from './pages/TimeOff';
import HolidayCalendar from './pages/HolidayCalendar';
import Users from './pages/Users';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={<Navigate to="/holiday-calendar" replace />} />
          {/* Public: anyone can view team availability without signing in. */}
          <Route
            path="/holiday-calendar"
            element={
              <Layout>
                <HolidayCalendar />
              </Layout>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Layout>
                <Dashboard />
              </Layout>
            }
          />
          <Route
            path="/capacity"
            element={
              <ProtectedRoute>
                <Layout>
                  <Capacity />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/time-off"
            element={
              <ProtectedRoute requiredRole={['ADMIN', 'MANAGER', 'DEVELOPER', 'QA_MANAGER', 'TESTER']}>
                <Layout>
                  <TimeOff />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute requiredRole={['ADMIN']}>
                <Layout>
                  <Users />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
