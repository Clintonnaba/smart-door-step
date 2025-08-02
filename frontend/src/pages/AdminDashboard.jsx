import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';


export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    Promise.all([
      axios.get(`${API_BASE_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API_BASE_URL}/services`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API_BASE_URL}/bookings`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API_BASE_URL}/admin/bookings/pending`, { headers: { Authorization: `Bearer ${token}` } })
    ])
      .then(([usersRes, servicesRes, bookingsRes, pendingRes]) => {
        setUsers(usersRes.data);
        setServices(servicesRes.data);
        setBookings(bookingsRes.data);
        setPendingBookings(pendingRes.data);
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleApprove = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/admin/bookings/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setPendingBookings(pendingBookings.filter(b => b.id !== id));
    } catch {
      setError('Failed to approve booking.');
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/admin/bookings/${id}/reject`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setPendingBookings(pendingBookings.filter(b => b.id !== id));
    } catch {
      setError('Failed to reject booking.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-600 via-white to-orange-200">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto py-16 px-4">
        <h2 className="text-3xl font-bold text-blue-700 mb-10 text-center">Admin Dashboard</h2>
        {loading && <div className="text-center text-blue-600">Loading...</div>}
        {error && <div className="text-center text-red-600">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">{users.length}</div>
            <div className="text-gray-700">Total Users</div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center text-center">
            <div className="text-4xl font-bold text-orange-500 mb-2">{services.length}</div>
            <div className="text-gray-700">Total Services</div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center text-center">
            <div className="text-4xl font-bold text-blue-900 mb-2">{bookings.length}</div>
            <div className="text-gray-700">Total Bookings</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h3 className="text-xl font-bold text-blue-700 mb-4">Users</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="px-4 py-2">{u.name}</td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2">{u.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h3 className="text-xl font-bold text-blue-700 mb-4">Pending Bookings</h3>
          {pendingBookings.length === 0 ? (
            <div className="text-gray-500">No pending bookings.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingBookings.map(b => (
                    <tr key={b.id}>
                      <td className="px-4 py-2">{b.user?.fullName}</td>
                      <td className="px-4 py-2">{b.service?.name}</td>
                      <td className="px-4 py-2">{b.date}</td>
                      <td className="px-4 py-2">{b.time}</td>
                      <td className="px-4 py-2">{b.paymentMethod}</td>
                      <td className="px-4 py-2">{b.address}</td>
                      <td className="px-4 py-2 flex gap-2">
                        <button onClick={() => handleApprove(b.id)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded">Approve</button>
                        <button onClick={() => handleReject(b.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
} 