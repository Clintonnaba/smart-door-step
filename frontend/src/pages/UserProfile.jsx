import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [updateMsg, setUpdateMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`${API_BASE_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setUser(res.data);
        setName(res.data.name);
        setPhone(res.data.phone);
      })
      .catch(() => setError('Failed to load user info.'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdateMsg('');
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API_BASE_URL}/users/me`, { name, phone }, { headers: { Authorization: `Bearer ${token}` } });
      setUpdateMsg('Profile updated!');
      setEdit(false);
      setUser({ ...user, name, phone });
    } catch {
      setUpdateMsg('Update failed.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-600 via-white to-orange-200">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto py-16 px-4">
        <h2 className="text-3xl font-bold text-blue-700 mb-10 text-center">My Profile</h2>
        {loading && <div className="text-center text-blue-600">Loading...</div>}
        {error && <div className="text-center text-red-600">{error}</div>}
        {user && (
          <div className="bg-white rounded-2xl shadow-xl p-10 mb-8">
            {edit ? (
              <form onSubmit={handleUpdate} className="space-y-6">
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">Full Name</label>
                  <input type="text" className="w-full px-5 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-lg" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">Phone</label>
                  <input type="tel" className="w-full px-5 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-lg" value={phone} onChange={e => setPhone(e.target.value)} required />
                </div>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg text-lg">Save</button>
                <button type="button" className="ml-4 text-gray-500 hover:underline" onClick={() => setEdit(false)}>Cancel</button>
                {updateMsg && <div className="mt-2 text-green-600">{updateMsg}</div>}
              </form>
            ) : (
              <div>
                <div className="mb-2"><span className="font-semibold">Name:</span> {user.name}</div>
                <div className="mb-2"><span className="font-semibold">Email:</span> {user.email}</div>
                <div className="mb-2"><span className="font-semibold">Phone:</span> {user.phone}</div>
                <button className="mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-8 rounded-lg shadow-lg" onClick={() => setEdit(true)}>Edit Profile</button>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
} 