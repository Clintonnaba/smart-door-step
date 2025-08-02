import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import { techniciansAPI } from '../api/api';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';


export default function BookService() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [techLoading, setTechLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/services`)
      .then(res => setServices(res.data))
      .catch(() => setServices([]));
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'user') {
      navigate('/technician/profile');
      return;
    }
  }, [navigate]);

  // Fetch technicians when service changes
  useEffect(() => {
    if (!serviceId) {
      setTechnicians([]);
      setSelectedService(null);
      return;
    }
    const service = services.find(s => s.id === Number(serviceId));
    setSelectedService(service);
    if (service) {
      setTechLoading(true);
      techniciansAPI.getTechniciansByCategory(service.category)
        .then(res => setTechnicians(res.data))
        .catch(() => setTechnicians([]))
        .finally(() => setTechLoading(false));
    }
  }, [serviceId, services]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('');
    if (!serviceId || !date || !description) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/bookings`, { serviceId, date, description }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus('Booking successful!');
      setSuccess(true);
      setServiceId(''); setDate(''); setDescription('');
      setTechnicians([]);
      setSelectedService(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-600 via-white to-orange-200">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12 px-2">
        <div className="w-full max-w-lg mx-auto bg-white rounded-3xl shadow-2xl border-t-8 border-blue-600 p-10 flex flex-col items-center">
          <h2 className="text-3xl font-extrabold text-blue-700 mb-8 text-center tracking-tight">Book a Service</h2>
          {status && <div className="mb-4 text-green-600 text-center font-semibold">{status}</div>}
          {error && <div className="mb-4 text-red-600 text-center font-semibold">{error}</div>}
          {success && (
            <div className="text-yellow-600 font-semibold text-center mt-4">
              Your booking request has been submitted and is pending admin approval.
            </div>
          )}
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Service</label>
              <select className="w-full px-5 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-lg" value={serviceId} onChange={e => setServiceId(e.target.value)} required>
                <option value="">Select a service</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Date</label>
              <input type="date" className="w-full px-5 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-lg" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Description</label>
              <textarea className="w-full px-5 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-lg" value={description} onChange={e => setDescription(e.target.value)} required placeholder="Describe your service needs..." />
            </div>
            <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg shadow-lg text-lg transition disabled:opacity-50" disabled={loading}>{loading ? 'Booking...' : 'Book Service'}</button>
          </form>
          {/* Dynamic Technician List */}
          {selectedService && (
            <div className="w-full mt-8">
              <h3 className="text-xl font-bold text-blue-700 mb-4 text-center">Available Technicians</h3>
              {techLoading ? (
                <div className="text-center text-gray-500">Loading technicians...</div>
              ) : technicians.length === 0 ? (
                <div className="text-center text-gray-500">No technicians available for this service.</div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {technicians.map(tech => (
                    <li key={tech.id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-bold text-lg text-blue-900">{tech.name}</div>
                        <div className="text-gray-600 text-sm">{tech.email}</div>
                        <div className="text-gray-600 text-sm">{tech.phone}</div>
                        <div className="text-gray-500 text-xs">Gender: {tech.gender}</div>
                      </div>
                      <div className="mt-2 md:mt-0 text-sm text-gray-700">{tech.availability}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
} 