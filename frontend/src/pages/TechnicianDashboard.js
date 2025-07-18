import React, { useEffect, useState, useRef } from 'react';
import { bookingsAPI } from '../api/api';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
const BELL_SOUND_URL = 'https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae5b2.mp3'; // royalty-free bell sound

const TechnicianDashboard = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [actionError, setActionError] = useState({});
  const [notification, setNotification] = useState('');
  const [profile, setProfile] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const socketRef = useRef(null);
  const audioRef = useRef(null);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${SOCKET_URL.replace('5001', '5001')}/technicians/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data.user);
    } catch (err) {
      setProfile(null);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await bookingsAPI.getTechnicianBookings();
      setBookings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Role-based redirect
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'technician') {
      navigate('/profile');
      return;
    }
    fetchProfile();
    fetchBookings();
    // Connect to Socket.IO
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socket.emit('register', { userId: user.id, role: user.role });
    socket.on('booking:new', (booking) => {
      setNotification('New job request received!');
      fetchBookings();
      if (audioRef.current) audioRef.current.play();
    });
    socket.on('booking:status', ({ id, status }) => {
      setNotification(`Booking #${id} status updated: ${status}`);
      fetchBookings();
      if (audioRef.current) audioRef.current.play();
    });
    socketRef.current = socket;
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [navigate]);

  const handleRespond = async (id, status) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    setActionError((prev) => ({ ...prev, [id]: '' }));
    try {
      await bookingsAPI.respondToBooking(id, status);
      await fetchBookings();
    } catch (err) {
      setActionError((prev) => ({ ...prev, [id]: 'Action failed. Try again.' }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filterStatus === 'all') return true;
    return booking.status === filterStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'accepted': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-orange-100 text-orange-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'declined': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <audio ref={audioRef} src={BELL_SOUND_URL} preload="auto" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {profile && (
          <div className="bg-white rounded-lg shadow p-6 mb-6 flex items-center gap-6">
            <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold">
              {profile.fullName?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{profile.fullName}</div>
              <div className="text-gray-600">{profile.email}</div>
              <div className="text-gray-600">{profile.phone}</div>
              <div className="text-gray-500 text-sm mt-1">Skills: {profile.skills || 'N/A'}</div>
              <div className="text-gray-500 text-sm mt-1">Role: Technician</div>
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Assigned Jobs</h1>
          <div className="flex space-x-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Jobs</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {notification && (
          <div className="mb-4 p-3 bg-blue-100 border border-blue-300 text-blue-800 rounded-lg text-center font-medium flex items-center justify-center gap-2">
            <svg className="w-6 h-6 text-blue-500 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span>{notification}</span>
            <button className="ml-4 text-blue-600 underline" onClick={() => setNotification('')}>Dismiss</button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center mb-4">{error}</div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-lg font-medium">No jobs assigned yet</p>
            <p className="text-sm">You'll see your assigned jobs here when customers book services matching your skills.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{booking.service?.name || 'Service'}</h3>
                    <p className="text-sm text-gray-600">Booking #{booking.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                    {booking.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm text-gray-700">{booking.user?.fullName || 'Customer'}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-sm text-gray-700">{booking.user?.email}</span>
                  </div>

                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-700">
                      {booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : 'TBD'}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm text-gray-700">{booking.address || 'N/A'}</span>
                  </div>

                  {booking.notes && (
                    <div className="flex items-start">
                      <svg className="w-4 h-4 text-gray-500 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-gray-700">{booking.notes}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold text-primary">Rs. {booking.totalAmount || booking.service?.basePrice}</span>
                </div>

                {booking.status === 'pending' && (
                  <div className="flex space-x-3">
                    <button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 transition duration-200"
                      disabled={actionLoading[booking.id]}
                      onClick={() => handleRespond(booking.id, 'accepted')}
                    >
                      {actionLoading[booking.id] ? 'Accepting...' : 'Accept Job'}
                    </button>
                    <button
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 transition duration-200"
                      disabled={actionLoading[booking.id]}
                      onClick={() => handleRespond(booking.id, 'declined')}
                    >
                      {actionLoading[booking.id] ? 'Declining...' : 'Decline Job'}
                    </button>
                  </div>
                )}

                {actionError[booking.id] && (
                  <div className="text-red-500 text-sm mt-2">{actionError[booking.id]}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicianDashboard; 