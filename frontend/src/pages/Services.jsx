import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  useEffect(() => {
    axios.get(`${API_BASE_URL}/services`)
      .then(res => setServices(res.data))
      .catch(() => setError('Failed to load services.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-600 via-white to-orange-200">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto py-16 px-4">
        <h2 className="text-3xl font-bold text-blue-700 mb-10 text-center">Available Services</h2>
        {loading && <div className="text-center text-blue-600">Loading...</div>}
        {error && <div className="text-center text-red-600">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {services.map(service => (
            <div key={service.id} className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center text-center hover:shadow-2xl transition">
              <div className="w-12 h-12 mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl text-blue-600">{service.icon || '🔧'}</span>
              </div>
              <h3 className="mt-2 text-xl font-semibold text-blue-900">{service.name}</h3>
              <p className="mt-2 text-gray-600">{service.description}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
} 