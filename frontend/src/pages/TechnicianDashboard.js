import React, { useEffect, useState, useRef } from 'react';
import { bookingsAPI } from '../api/api';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';


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
  const [quoteModal, setQuoteModal] = useState({ show: false, bookingId: null, proposedPrice: '' });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [responseModal, setResponseModal] = useState({ show: false, booking: null, proposedFare: '', eta: '' });
  const [debugInfo, setDebugInfo] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const socketRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${SOCKET_URL.replace('5001', '5001')}/api/technicians/profile`, {
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

  const fetchPendingRequests = async () => {
    setPendingLoading(true);
    try {
      // Get technician ID from user data
      const user = JSON.parse(localStorage.getItem('user'));
      const technicianId = user?.id || user?.technicianId;
      
      console.log('[FRONTEND] User data:', user);
      console.log('[FRONTEND] Technician ID:', technicianId);
      
      if (!technicianId) {
        console.error('No technician ID found');
        return;
      }

      const res = await bookingsAPI.getTechnicianPendingRequests(technicianId);
      
      console.log('[FRONTEND] Pending requests response:', res.data);
      
      if (res.data.pendingRequests) {
        setPendingRequests(res.data.pendingRequests);
        setDebugInfo(res.data.debug);
      } else if (Array.isArray(res.data)) {
        setPendingRequests(res.data);
      } else {
        setPendingRequests([]);
      }
      
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load pending requests:', err);
      setDebugInfo({ error: err.message });
    } finally {
      setPendingLoading(false);
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
    fetchPendingRequests();
    
    // Connect to Socket.IO
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socket.emit('register', { userId: user.id, role: user.role });
    
    socket.on('booking:new', (booking) => {
      setNotification('New job request received!');
      fetchBookings();
      fetchPendingRequests();
      // Audio temporarily disabled
    });
    socket.on('booking:request', (request) => {
      setNotification(`New ${request.serviceName} request from ${request.customerName}!`);
      fetchPendingRequests();
      // Audio temporarily disabled
    });
    socket.on('booking:status', ({ id, status }) => {
      setNotification(`Booking #${id} status updated: ${status}`);
      fetchBookings();
      // Audio temporarily disabled
    });
    socket.on('booking:quoteResponse', ({ id, response, status, customerName, serviceName }) => {
      setNotification(`Customer ${customerName} ${response}ed your quote for ${serviceName}`);
      fetchBookings();
      // Audio temporarily disabled
    });
    
    socketRef.current = socket;
    
    // Set up polling for pending requests (every 10 seconds)
    pollingIntervalRef.current = setInterval(() => {
      fetchPendingRequests();
    }, 10000);
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
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

  const handleDeclineRequest = async (bookingId) => {
    setActionLoading((prev) => ({ ...prev, [bookingId]: true }));
    setActionError((prev) => ({ ...prev, [bookingId]: '' }));
    
    try {
      await bookingsAPI.respondToRequest(bookingId, {
        proposedFare: 0,
        responseStatus: 'rejected',
        eta: null
      });
      await fetchPendingRequests();
      setNotification('Request declined successfully!');
    } catch (err) {
      setActionError((prev) => ({ ...prev, [bookingId]: 'Failed to decline request. Try again.' }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleSetQuote = async () => {
    if (!quoteModal.proposedPrice || quoteModal.proposedPrice <= 0) {
      setActionError((prev) => ({ ...prev, [quoteModal.bookingId]: 'Please enter a valid price.' }));
      return;
    }

    setActionLoading((prev) => ({ ...prev, [quoteModal.bookingId]: true }));
    setActionError((prev) => ({ ...prev, [quoteModal.bookingId]: '' }));
    
    try {
      await bookingsAPI.setQuote(quoteModal.bookingId, parseFloat(quoteModal.proposedPrice));
      await fetchBookings();
      setQuoteModal({ show: false, bookingId: null, proposedPrice: '' });
      setNotification('Quote sent successfully!');
    } catch (err) {
      setActionError((prev) => ({ ...prev, [quoteModal.bookingId]: 'Failed to send quote. Try again.' }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [quoteModal.bookingId]: false }));
    }
  };

  const handleRespondToRequest = async () => {
    if (!responseModal.proposedFare || responseModal.proposedFare <= 0) {
      setActionError((prev) => ({ ...prev, [responseModal.booking.id]: 'Please enter a valid fare.' }));
      return;
    }

    setActionLoading((prev) => ({ ...prev, [responseModal.booking.id]: true }));
    setActionError((prev) => ({ ...prev, [responseModal.booking.id]: '' }));
    
    try {
      await bookingsAPI.respondToRequest(responseModal.booking.id, {
        proposedFare: parseFloat(responseModal.proposedFare),
        responseStatus: 'accepted',
        eta: responseModal.eta
      });
      await fetchPendingRequests();
      setResponseModal({ show: false, booking: null, proposedFare: '', eta: '' });
      setNotification('Response sent successfully!');
    } catch (err) {
      setActionError((prev) => ({ ...prev, [responseModal.booking.id]: 'Failed to send response. Try again.' }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [responseModal.booking.id]: false }));
    }
  };

  const openQuoteModal = (bookingId) => {
    setQuoteModal({ show: true, bookingId, proposedPrice: '' });
  };

  const closeQuoteModal = () => {
    setQuoteModal({ show: false, bookingId: null, proposedPrice: '' });
  };

  const filteredBookings = bookings.filter(booking => {
    if (filterStatus === 'all') return true;
    return booking.status === filterStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'quoted': 'bg-blue-100 text-blue-800',
      'confirmed': 'bg-green-100 text-green-800',
      'declined': 'bg-red-100 text-red-800',
      'in_progress': 'bg-orange-100 text-orange-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* <audio ref={audioRef} src={BELL_SOUND_URL} preload="auto" /> */}
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
        
        {/* Pending Requests Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Pending Requests</h2>
            <div className="flex items-center space-x-2">
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {pendingRequests.length} New
              </span>
              {lastRefresh && (
                <span className="text-xs text-gray-500">
                  Last refresh: {lastRefresh}
                </span>
              )}
            </div>
          </div>
          
          {/* Debug Information */}
          {debugInfo && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">Debug Info:</h4>
              <div className="text-xs text-blue-700 space-y-1">
                {debugInfo.error ? (
                  <div className="text-red-600">Error: {debugInfo.error}</div>
                ) : (
                  <>
                    <div>Total bookings found: {debugInfo.totalBookingsFound}</div>
                    <div>Filtered count: {debugInfo.filteredCount}</div>
                    <div>Timestamp: {debugInfo.timestamp}</div>
                  </>
                )}
              </div>
            </div>
          )}
          
          {pendingLoading ? (
            <div className="flex justify-center items-center h-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm">No pending requests</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {pendingRequests.map((request) => (
                <div key={request.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{request.service?.name}</h3>
                      <p className="text-sm text-gray-600">Request #{request.id}</p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full">
                      NEW REQUEST
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm text-gray-700">{request.user?.fullName}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-sm text-gray-700">{request.user?.phone}</span>
                    </div>

                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-700">
                        {request.date ? new Date(request.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        }) : 'TBD'}
                        {request.time && ` at ${new Date(`2000-01-01T${request.time}`).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })}`}
                      </span>
                    </div>

                    {request.problemNote && (
                      <div className="flex items-start">
                        <svg className="w-4 h-4 text-gray-500 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm text-gray-700">{request.problemNote}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-bold text-primary">
                      Base Price: Rs. {request.service?.basePrice || 'N/A'}
                    </span>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                      onClick={() => setResponseModal({ 
                        show: true, 
                        booking: request, 
                        proposedFare: request.service?.basePrice || '', 
                        eta: '30 minutes' 
                      })}
                    >
                      Accept & Quote
                    </button>
                    <button
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                      onClick={() => handleDeclineRequest(request.id)}
                      disabled={actionLoading[request.id]}
                    >
                      {actionLoading[request.id] ? 'Declining...' : 'Decline'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Assigned Jobs</h1>
          <div className="flex space-x-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Jobs</option>
              <option value="requested">Requested</option>
              <option value="offers_sent">Offers Sent</option>
              <option value="customer_selected">Customer Selected</option>
              <option value="admin_approved">Admin Approved</option>
              <option value="technician_assigned">Technician Assigned</option>
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

                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm text-gray-700">Kathmandu, Nepal</span>
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
                  <span className="text-lg font-bold text-primary">
                    {booking.status === 'quoted' && booking.proposedPrice 
                      ? `Rs. ${booking.proposedPrice} (Proposed)`
                      : booking.status === 'confirmed' && booking.proposedPrice
                      ? `Rs. ${booking.proposedPrice} (Accepted)`
                      : `Rs. ${booking.price || booking.service?.basePrice || 'N/A'}`
                    }
                  </span>
                </div>

                {booking.status === 'pending' && (
                  <div className="flex space-x-3">
                    <button
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 transition duration-200"
                      disabled={actionLoading[booking.id]}
                      onClick={() => openQuoteModal(booking.id)}
                    >
                      {actionLoading[booking.id] ? 'Sending...' : 'Send Quote'}
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

                {booking.status === 'quoted' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800 font-medium">Quote sent to customer</p>
                    <p className="text-xs text-blue-600">Waiting for customer response</p>
                  </div>
                )}

                {booking.status === 'confirmed' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800 font-medium">Quote accepted by customer</p>
                    <p className="text-xs text-green-600">Ready to start work</p>
                  </div>
                )}

                {booking.status === 'declined' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800 font-medium">Quote declined by customer</p>
                    <p className="text-xs text-red-600">Job cancelled</p>
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

      {/* Quote Modal */}
      {quoteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">Send Quote</h3>
              <button 
                onClick={closeQuoteModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proposed Price (Rs.)
              </label>
              <input
                type="number"
                value={quoteModal.proposedPrice}
                onChange={(e) => setQuoteModal(prev => ({ ...prev, proposedPrice: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter your proposed price"
                min="0"
                step="0.01"
              />
            </div>

            {actionError[quoteModal.bookingId] && (
              <div className="text-red-500 text-sm mb-4">{actionError[quoteModal.bookingId]}</div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleSetQuote}
                disabled={actionLoading[quoteModal.bookingId]}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 transition duration-200"
              >
                {actionLoading[quoteModal.bookingId] ? 'Sending...' : 'Send Quote'}
              </button>
              <button
                onClick={closeQuoteModal}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded-lg transition duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {responseModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">Send Response</h3>
              <button 
                onClick={() => setResponseModal({ show: false, booking: null, proposedFare: '', eta: '' })}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proposed Fare (Rs.)
              </label>
              <input
                type="number"
                value={responseModal.proposedFare}
                onChange={(e) => setResponseModal(prev => ({ ...prev, proposedFare: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter your proposed fare"
                min="0"
                step="0.01"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Time of Arrival
              </label>
              <input
                type="text"
                value={responseModal.eta}
                onChange={(e) => setResponseModal(prev => ({ ...prev, eta: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., 30 minutes"
              />
            </div>

            {actionError[responseModal.booking?.id] && (
              <div className="text-red-500 text-sm mb-4">{actionError[responseModal.booking.id]}</div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleRespondToRequest}
                disabled={actionLoading[responseModal.booking?.id]}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 transition duration-200"
              >
                {actionLoading[responseModal.booking?.id] ? 'Sending...' : 'Send Response'}
              </button>
              <button
                onClick={() => setResponseModal({ show: false, booking: null, proposedFare: '', eta: '' })}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded-lg transition duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianDashboard; 