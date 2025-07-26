import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI, servicesAPI, bookingsAPI, techniciansAPI, authAPI } from '../api/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data states
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  
  // Form states
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showTechnicianModal, setShowTechnicianModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Service form
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: ''
  });
  
  // Technician form
  const [technicianForm, setTechnicianForm] = useState({
    name: '',
    skills: '',
    experience: '',
    availability: true,
    rating: 4.5
  });

  const handleLogout = useCallback(() => {
    authAPI.logout();
    navigate('/login');
  }, [navigate]);

  const fetchAllData = useCallback(async () => {
    try {
      const [usersRes, servicesRes, bookingsRes, techniciansRes] = await Promise.all([
        usersAPI.getAllUsers(),
        servicesAPI.getAllServices(),
        bookingsAPI.getAllBookings(),
        techniciansAPI.getAllTechnicians()
      ]);
      
      setUsers(usersRes.data);
      setServices(servicesRes.data);
      setBookings(bookingsRes.data);
      setTechnicians(techniciansRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setError('Failed to load dashboard data');
      
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Map price field to basePrice for backend compatibility
      const serviceData = {
        ...serviceForm,
        basePrice: parseFloat(serviceForm.price)
      };
      delete serviceData.price; // Remove price field as backend expects basePrice
      
      if (editingItem) {
        await servicesAPI.updateService(editingItem.id, serviceData);
      } else {
        await servicesAPI.createService(serviceData);
      }
      
      setShowServiceModal(false);
      setEditingItem(null);
      setServiceForm({ name: '', description: '', price: '', category: '', image: '' });
      fetchAllData();
    } catch (error) {
      console.error('Service error:', error);
      setError('Failed to save service');
    }
  };

  const handleTechnicianSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        await techniciansAPI.updateTechnician(editingItem.id, technicianForm);
      } else {
        await techniciansAPI.createTechnician(technicianForm);
      }
      
      setShowTechnicianModal(false);
      setEditingItem(null);
      setTechnicianForm({ name: '', skills: '', experience: '', availability: true, rating: 4.5 });
      fetchAllData();
    } catch (error) {
      console.error('Technician error:', error);
      setError('Failed to save technician');
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    try {
      switch (type) {
        case 'service':
          await servicesAPI.deleteService(id);
          break;
        case 'technician':
          await techniciansAPI.deleteTechnician(id);
          break;
        case 'user':
          await usersAPI.deleteUser(id);
          break;
        default:
          break;
      }
      fetchAllData();
    } catch (error) {
      console.error('Delete error:', error);
      setError(`Failed to delete ${type}`);
    }
  };

  const handleEdit = (type, item) => {
    setEditingItem(item);
    if (type === 'service') {
      setServiceForm({
        name: item.name,
        description: item.description,
        price: item.basePrice,
        category: item.category,
        image: item.image
      });
      setShowServiceModal(true);
    } else if (type === 'technician') {
      setTechnicianForm({
        name: item.name,
        skills: item.skills,
        experience: item.experience,
        availability: item.availability,
        rating: item.rating
      });
      setShowTechnicianModal(true);
    }
  };

  const handleBookingAction = async (bookingId, action) => {
    try {
      console.log('[ADMIN ACTION]', { bookingId, action });
      
      // Map UI actions to API actions
      const apiAction = action === 'Approved' ? 'grant' : 'deny';
      
      await bookingsAPI.adminApproval(bookingId, apiAction);
      fetchAllData();
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Booking action error:', error);
      setError(`Failed to ${action.toLowerCase()} booking`);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
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
      month: 'short',
      day: 'numeric'
    });
  };

  // Defensive: ensure bookings is always an array
  const safeBookings = Array.isArray(bookings) ? bookings : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage Smart Door Step operations</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: '📊' },
                { id: 'users', name: 'Users', icon: '👥' },
                { id: 'services', name: 'Services', icon: '🔧' },
                { id: 'bookings', name: 'Bookings', icon: '📋' },
                { id: 'technicians', name: 'Technicians', icon: '👨‍🔧' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="flex items-center">
                  <div className="bg-primary text-white p-3 rounded-full">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg">
                <div className="flex items-center">
                  <div className="bg-green-500 text-white p-3 rounded-full">
                    <span className="text-2xl">🔧</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Services</p>
                    <p className="text-2xl font-bold text-gray-900">{services.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-orange-50 p-6 rounded-lg">
                <div className="flex items-center">
                  <div className="bg-secondary text-white p-3 rounded-full">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-900">{safeBookings.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-6 rounded-lg">
                <div className="flex items-center">
                  <div className="bg-purple-500 text-white p-3 rounded-full">
                    <span className="text-2xl">👨‍🔧</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Technicians</p>
                    <p className="text-2xl font-bold text-gray-900">{technicians.length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">User Management</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">
                              {user.fullName?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDelete('user', user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Services Tab */}
          {activeTab === 'services' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Service Management</h2>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setServiceForm({ name: '', description: '', price: '', category: '', image: '' });
                    setShowServiceModal(true);
                  }}
                  className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
                >
                  Add Service
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="text-3xl mb-2">{service.image}</div>
                    <h3 className="font-medium text-gray-900 mb-1">{service.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-primary font-bold">Rs. {service.basePrice}</span>
                      <span className="text-sm text-gray-500">{service.category}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit('service', service)}
                        className="text-primary hover:text-blue-700 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete('service', service.id)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Management</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Technician</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {safeBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {booking.service?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.user?.fullName || booking.user?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.technician?.name || 'Unassigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.date ? formatDate(booking.date) : 'TBD'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">
                          Rs. {booking.price || booking.service?.basePrice || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(booking.status?.toLowerCase?.() || booking.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {booking.status?.toLowerCase() === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleBookingAction(booking.id, 'Approved')}
                                className="text-green-600 hover:text-green-900 font-medium"
                              >
                                Grant
                              </button>
                              <button
                                onClick={() => handleBookingAction(booking.id, 'Rejected')}
                                className="text-red-600 hover:text-red-900 font-medium"
                              >
                                Deny
                              </button>
                            </div>
                          )}
                          {booking.status?.toLowerCase() !== 'pending' && (
                            <span className="text-gray-500">No actions available</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Technicians Tab */}
          {activeTab === 'technicians' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Technician Management</h2>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setTechnicianForm({ name: '', skills: '', experience: '', availability: true, rating: 4.5 });
                    setShowTechnicianModal(true);
                  }}
                  className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
                >
                  Add Technician
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {technicians.map((technician) => (
                  <div key={technician.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <div className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center mr-3">
                        {technician.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{technician.name}</h3>
                        <p className="text-sm text-gray-500">{technician.skills}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Experience:</span>
                        <span className="font-medium">{technician.experience} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rating:</span>
                        <span className="font-medium">{technician.rating}/5</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ${technician.availability ? 'text-green-600' : 'text-red-600'}`}>
                          {technician.availability ? 'Available' : 'Busy'}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-3">
                      <button
                        onClick={() => handleEdit('technician', technician)}
                        className="text-primary hover:text-blue-700 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete('technician', technician.id)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingItem ? 'Edit Service' : 'Add New Service'}
            </h3>
            <form onSubmit={handleServiceSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary focus:border-primary"
                  rows="3"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (NPR)</label>
                <input
                  type="number"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm({...serviceForm, price: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={serviceForm.category}
                  onChange={(e) => setServiceForm({...serviceForm, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary focus:border-primary"
                  required
                >
                  <option value="">Select category</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="ac">AC Repair</option>
                  <option value="carpentry">Carpentry</option>
                  <option value="painting">Painting</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emoji Icon</label>
                <input
                  type="text"
                  value={serviceForm.image}
                  onChange={(e) => setServiceForm({...serviceForm, image: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="🔧"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                >
                  {editingItem ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded-lg transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Technician Modal */}
      {showTechnicianModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingItem ? 'Edit Technician' : 'Add New Technician'}
            </h3>
            <form onSubmit={handleTechnicianSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={technicianForm.name}
                  onChange={(e) => setTechnicianForm({...technicianForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                <input
                  type="text"
                  value={technicianForm.skills}
                  onChange={(e) => setTechnicianForm({...technicianForm, skills: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="plumbing, electrical, all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                <input
                  type="number"
                  value={technicianForm.experience}
                  onChange={(e) => setTechnicianForm({...technicianForm, experience: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={technicianForm.rating}
                  onChange={(e) => setTechnicianForm({...technicianForm, rating: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary focus:border-primary"
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="availability"
                  checked={technicianForm.availability}
                  onChange={(e) => setTechnicianForm({...technicianForm, availability: e.target.checked})}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="availability" className="ml-2 block text-sm text-gray-900">
                  Available for work
                </label>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                >
                  {editingItem ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTechnicianModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded-lg transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
