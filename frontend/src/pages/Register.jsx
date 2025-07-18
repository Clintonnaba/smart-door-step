import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !phone || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/users/register`, { name, email, phone, password });
      setLoading(false);
      navigate('/login');
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-600 via-white to-orange-200">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12 px-2">
        <div className="w-full max-w-lg mx-auto bg-white rounded-3xl shadow-2xl border-t-8 border-blue-600 p-10 flex flex-col items-center">
          <div className="flex items-center mb-6">
            <span className="text-4xl text-blue-700 mr-2">&#128272;</span>
            <span className="text-2xl font-extrabold text-blue-700 tracking-tight">Smart Door Step</span>
          </div>
          <h2 className="text-3xl font-extrabold text-blue-700 mb-8 text-center tracking-tight">Create Your Account</h2>
          {error && <div className="mb-4 text-red-600 text-center font-semibold">{error}</div>}
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Full Name</label>
              <input type="text" placeholder="Enter your full name" className="w-full px-5 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-lg" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Email</label>
              <input type="email" placeholder="Enter your email" className="w-full px-5 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-lg" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Phone</label>
              <input type="tel" placeholder="Enter your phone number" className="w-full px-5 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-lg" value={phone} onChange={e => setPhone(e.target.value)} required />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Password</label>
              <input type="password" placeholder="Create a password" className="w-full px-5 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-lg" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg shadow-lg text-lg transition disabled:opacity-50" disabled={loading}>{loading ? 'Registering...' : 'Sign Up'}</button>
          </form>
          <div className="mt-6 text-center text-gray-600">
            Already have an account? <a href="/login" className="text-orange-500 hover:underline font-semibold">Login</a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 