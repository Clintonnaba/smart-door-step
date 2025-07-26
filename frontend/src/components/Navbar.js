import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../api/api';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const audioRef = React.useRef(null);

  // Simulate receiving a notification (replace with real socket logic later)
  useEffect(() => {
    // Example: listen for a custom event or socket event
    // window.addEventListener('new-notification', ...)
    // For now, just placeholder
  }, []);

  const handleBellClick = () => {
    setShowDropdown((prev) => !prev);
    setUnreadCount(0);
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      setUser(null);
    }
  }, [location]);

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
    localStorage.clear();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition duration-200">
            <img 
              src="/assets/logo.png" 
              alt="Smart Door Step Logo" 
              className="h-10 w-auto rounded-none shadow-none"
            />
            <span className="text-xl font-bold text-gray-900">
              <span className="text-blue-700">Smart</span>
              <span className="text-gray-700"> Door Step</span>
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            {/* Role-based navigation */}
            {user ? (
              user.role === 'admin' ? (
                <>
                  <Link to="/admin/dashboard" className={`text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition duration-200 ${isActive('/admin/dashboard') ? 'font-bold underline' : ''}`}>Dashboard</Link>
                  <span className="text-gray-700 font-medium">{user.fullName} (Admin)</span>
                  <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200">Logout</button>
                </>
              ) : user.role === 'technician' ? (
                <>
                  <Link to="/technician/dashboard" className={`text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition duration-200 ${isActive('/technician/dashboard') ? 'font-bold underline' : ''}`}>Dashboard</Link>
                  <span className="text-gray-700 font-medium">{user.fullName} (Technician)</span>
                  <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/" className={`text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition duration-200 ${isActive('/') ? 'font-bold underline' : ''}`}>Home</Link>
                  <Link to="/book" className={`text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition duration-200 ${isActive('/book') ? 'font-bold underline' : ''}`}>Book Service</Link>
                  <Link to="/customer/profile" className={`text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition duration-200 ${isActive('/customer/profile') ? 'font-bold underline' : ''}`}>My Profile</Link>
                  {/* Bell Icon for notifications */}
                  <div className="relative inline-block">
                    <button
                      className="focus:outline-none"
                      onClick={handleBellClick}
                      aria-label="Notifications"
                    >
                      <svg className="w-7 h-7 text-gray-700 hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">{unreadCount}</span>
                      )}
                    </button>
                    {/* Notification Dropdown (placeholder) */}
                    {showDropdown && (
                      <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        <div className="p-4 text-gray-700 font-semibold border-b">Notifications</div>
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-4 text-gray-500 text-center">No notifications</div>
                          ) : (
                            notifications.map((n, idx) => (
                              <div key={idx} className="p-4 border-b last:border-b-0">{n.message}</div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                    {/* Audio element will be added after bell.mp3 is available */}
                  </div>
                  <span className="text-gray-700 font-medium">{user.fullName} (Customer)</span>
                  <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200">Logout</button>
                </>
              )
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition duration-200">Login</Link>
                <Link to="/signup" className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
