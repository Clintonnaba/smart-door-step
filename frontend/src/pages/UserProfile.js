import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI, bookingsAPI, authAPI } from '../api/api';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
const BELL_SOUND_URL = 'https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae5b2.mp3'; // royalty-free bell sound

const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  const socketRef = useRef(null);
  const audioRef = useRef(null);
  const [quoteResponseLoading, setQuoteResponseLoading] = useState({});
  const [quoteResponseError, setQuoteResponseError] = useState({});

  // Move fetchUserData above useEffect
  const handleLogout = useCallback(() => {
    authAPI.logout();
    navigate('/login');
  }, [navigate]);

  const handleQuoteResponse = async (bookingId, response) => {
    setQuoteResponseLoading((prev) => ({ ...prev, [bookingId]: true }));
    setQuoteResponseError((prev) => ({ ...prev, [bookingId]: '' }));
    
    try {
      await bookingsAPI.respondToQuote(bookingId, response);
      await fetchUserData();
      setNotification(`Quote ${response}ed successfully!`);
    } catch (err) {
      setQuoteResponseError((prev) => ({ ...prev, [bookingId]: 'Failed to respond. Try again.' }));
    } finally {
      setQuoteResponseLoading((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  const fetchUserData = useCallback(async () => {
    try {
      const userResponse = await usersAPI.getCurrentUser();
      const bookingsResponse = await bookingsAPI.getUserBookings();
      setUser(userResponse.data);
      setBookings(Array.isArray(bookingsResponse.data) ? bookingsResponse.data : []);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error.response?.data?.message || 'Failed to load user. Try again.');
      if (error.response?.status === 401 || error.response?.status === 403) {
        setError('Authentication failed. Please log in again.');
        localStorage.clear();
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    // Role-based redirect
    const userObj = JSON.parse(localStorage.getItem('user'));
    if (!userObj) {
      navigate('/login');
      return;
    }
    if (userObj.role !== 'user' && userObj.role !== 'customer') {
      navigate('/technician/profile');
      return;
    }
    fetchUserData();
    // Connect to Socket.IO
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socket.emit('register', { userId: userObj.id, role: userObj.role });
    socket.on('booking:status', ({ id, status }) => {
      setNotification(`Booking #${id} status updated: ${status}`);
      fetchUserData();
      if (audioRef.current) audioRef.current.play();
    });
    socket.on('booking:quoted', ({ id, proposedPrice, technicianName, serviceName }) => {
      setNotification(`Quote received for ${serviceName} from ${technicianName}: Rs. ${proposedPrice}`);
      fetchUserData();
      if (audioRef.current) audioRef.current.play();
    });
    socket.on('booking:offer', ({ bookingId, technicianName, proposedFare, eta, responseStatus, serviceName }) => {
      if (responseStatus === 'accepted') {
        setNotification(`🎉 ${technicianName} accepted your ${serviceName} request! Fare: Rs. ${proposedFare}, ETA: ${eta}`);
      } else if (responseStatus === 'rejected') {
        setNotification(`❌ ${technicianName} declined your ${serviceName} request`);
      }
      fetchUserData();
      if (audioRef.current) audioRef.current.play();
    });
    socket.on('booking:response', ({ bookingId, technicianName, proposedFare, eta, responseStatus, serviceName }) => {
      if (responseStatus === 'accepted') {
        setNotification(`🎉 ${technicianName} accepted your ${serviceName} request! Fare: Rs. ${proposedFare}, ETA: ${eta}`);
      } else if (responseStatus === 'rejected') {
        setNotification(`❌ ${technicianName} declined your ${serviceName} request`);
      }
      fetchUserData();
      if (audioRef.current) audioRef.current.play();
    });
    socketRef.current = socket;
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [fetchUserData, navigate]);

  // Defensive: ensure bookings is always an array
  const safeBookings = Array.isArray(bookings) ? bookings : [];

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'quoted': 'bg-blue-100 text-blue-800',
      'confirmed': 'bg-green-100 text-green-800',
      'declined': 'bg-red-100 text-red-800',
      'in_progress': 'bg-orange-100 text-orange-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <audio ref={audioRef} src={BELL_SOUND_URL} preload="auto" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.fullName}!
              </h1>
              <p className="text-gray-600">
                Manage your profile and view your service bookings
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-200 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Information</h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center mr-4">
                    <span className="text-lg font-bold">
                      {user?.fullName?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{user?.fullName}</h3>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Full Name:</span>
                    <span className="font-medium">{user?.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{user?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{user?.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member Since:</span>
                    <span className="font-medium">
                      {user?.createdAt ? formatDate(user.createdAt).split(',')[0] : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Booking History</h2>
                <button
                  onClick={() => navigate('/book')}
                  className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
                >
                  Book New Service
                </button>
              </div>

              {safeBookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📋</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                  <p className="text-gray-500 mb-4">
                    You haven't made any service bookings yet.
                  </p>
                  <button
                    onClick={() => navigate('/book')}
                    className="bg-primary hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition duration-200"
                  >
                    Book Your First Service
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {safeBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {booking.service?.name || 'Service'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Booked on {formatDate(booking.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">
                            {booking.status === 'quoted' && booking.proposedPrice 
                              ? `Rs. ${booking.proposedPrice} (Proposed)`
                              : booking.status === 'confirmed' && booking.proposedPrice
                              ? `Rs. ${booking.proposedPrice} (Accepted)`
                              : `Rs. ${booking.service?.basePrice || booking.totalAmount}`
                            }
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Scheduled Date:</span>
                          <span className="ml-2 font-medium">
                            {booking.date ? new Date(booking.date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            }) : 'TBD'}
                            {booking.time && ` at ${new Date(`2000-01-01T${booking.time}`).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            })}`}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Technician:</span>
                          <span className="ml-2 font-medium">
                            {booking.technician?.name || booking.technician?.fullName || 'Assigned'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Address:</span>
                          <span className="ml-2 font-medium">
                            {booking.address || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Notes:</span>
                          <span className="ml-2 font-medium">
                            {booking.notes || booking.problemNote || 'No special instructions'}
                          </span>
                        </div>
                      </div>

                      {/* Quote Response Section */}
                      {booking.status === 'quoted' && booking.proposedPrice && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <p className="text-sm text-blue-800 font-medium mb-1">
                              Quote Received from {booking.technician?.name || 'Technician'}
                            </p>
                            <p className="text-sm text-blue-600">
                              Proposed Price: <span className="font-bold">Rs. {booking.proposedPrice}</span>
                            </p>
                          </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleQuoteResponse(booking.id, 'accept')}
                              disabled={quoteResponseLoading[booking.id]}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 transition duration-200"
                            >
                              {quoteResponseLoading[booking.id] ? 'Accepting...' : 'Accept Quote'}
                            </button>
                            <button
                              onClick={() => handleQuoteResponse(booking.id, 'reject')}
                              disabled={quoteResponseLoading[booking.id]}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 transition duration-200"
                            >
                              {quoteResponseLoading[booking.id] ? 'Rejecting...' : 'Reject Quote'}
                            </button>
                          </div>
                          {quoteResponseError[booking.id] && (
                            <div className="text-red-500 text-sm mt-2">{quoteResponseError[booking.id]}</div>
                          )}
                        </div>
                      )}

                      {/* Status Messages */}
                      {booking.status === 'confirmed' && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-sm text-green-800 font-medium">Quote Accepted</p>
                            <p className="text-xs text-green-600">Your technician will contact you soon</p>
                          </div>
                        </div>
                      )}

                      {booking.status === 'declined' && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-800 font-medium">Quote Declined</p>
                            <p className="text-xs text-red-600">This booking has been cancelled</p>
                          </div>
                        </div>
                      )}

                      {booking.status === 'pending' && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-sm text-yellow-800 font-medium">Waiting for Quote</p>
                            <p className="text-xs text-yellow-600">Technician will send you a quote soon</p>
                          </div>
                        </div>
                      )}

                      {booking.status === 'completed' && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <button className="text-primary hover:text-blue-700 text-sm font-medium">
                            Rate this service
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
