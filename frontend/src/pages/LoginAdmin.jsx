import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// import Navbar from '../components/Navbar';
// import Footer from '../components/Footer';

export default function LoginAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/admin/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setLoading(false);
      navigate('/admin/dashboard');
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-600 via-white to-orange-200">
      {/* <Navbar /> */}
      <main className="flex-1 flex items-center justify-center py-12 px-2">
        <div className="w-full max-w-lg mx-auto bg-white rounded-3xl shadow-2xl border-t-8 border-blue-600 p-10 flex flex-col items-center">
          <h2 className="text-3xl font-extrabold text-blue-700 mb-8 text-center tracking-tight">Admin Login</h2>
          {error && <div className="mb-4 text-red-600 text-center font-semibold">{error}</div>}
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Email</label>
              <input type="email" placeholder="Enter your email" className="w-full px-5 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-lg" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Password</label>
              <input type="password" placeholder="Enter your password" className="w-full px-5 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-lg" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg text-lg transition disabled:opacity-50" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
          </form>
        </div>
      </main>
      {/* <Footer /> */}
    </div>
  );
} 