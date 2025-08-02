import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import RoleSelection from './components/RoleSelection';
import Login from './pages/Login';
import Signup from './pages/Signup';
import BookService from './pages/BookService';
import UserProfile from './pages/UserProfile';
import CustomerProfile from './pages/CustomerProfile';
import AdminDashboard from './pages/AdminDashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import LoginAdmin from './pages/LoginAdmin.jsx';
import LoginTechnician from './pages/LoginTechnician.jsx';
import LoginCustomer from './pages/LoginCustomer.jsx';

function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!token || !user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function CustomerProfileRedirect() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (user && user.role === 'user') {
    return <Navigate to="/customer/profile" replace />;
  }
  return <UserProfile />;
}

function App() {
  return (
    <Router>
      <div className="App flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<RoleSelection />} />
            <Route path="/login/admin" element={<LoginAdmin />} />
            <Route path="/login/technician" element={<LoginTechnician />} />
            <Route path="/login/customer" element={<LoginCustomer />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/book" element={<BookService />} />
            <Route path="/profile" element={
              <ProtectedRoute allowedRoles={['user', 'customer']}>
                <CustomerProfileRedirect />
              </ProtectedRoute>
            } />
            <Route path="/customer/profile" element={
              <ProtectedRoute allowedRoles={['user']}>
                <CustomerProfile />
              </ProtectedRoute>
            } />
            <Route path="/technician/profile" element={
              <ProtectedRoute allowedRoles={['technician']}>
                <TechnicianDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/technician/dashboard" element={
              <ProtectedRoute allowedRoles={['technician']}>
                <TechnicianDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
