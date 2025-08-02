import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const role = user?.role;
  const isAdmin = role === 'admin';
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="bg-blue-700 shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center text-2xl font-bold text-white">
            <span className="text-orange-400 mr-2">&#128272;</span> Smart Door Step
          </Link>
          <div className="flex space-x-4 items-center">
            <Link to="/" className="text-white hover:text-orange-400 font-semibold">Home</Link>
            <Link to="/services" className="text-white hover:text-orange-400 font-semibold">Services</Link>
            <Link to="/book" className="text-white hover:text-orange-400 font-semibold">Book</Link>
            {token && <Link to="/user/profile" className="text-white hover:text-orange-400 font-semibold">Profile</Link>}
            {isAdmin && <Link to="/admin/dashboard" className="text-white hover:text-orange-400 font-semibold">Admin Dashboard</Link>}
            {!token && <Link to="/login" className="text-white hover:text-orange-400 font-semibold">Login</Link>}
            {!token && <Link to="/register" className="text-white hover:text-orange-400 font-semibold">Register</Link>}
            {token && <button onClick={handleLogout} className="ml-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold shadow">Logout</button>}
          </div>
        </div>
      </div>
    </nav>
  );
} 