import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { servicesAPI, bookingsAPI } from '../api/api';
import NotificationOffers from '../components/ProviderList';
import { io } from 'socket.io-client';

// Payment logos: use /images/ path for local files
const paymentLogos = [
  {
    name: 'eSewa',
    src: '/images/esewa.png',
    alt: 'eSewa Logo',
  },
  {
    name: 'IME Pay',
    src: '/images/imepay.png',
    alt: 'IME Pay Logo',
  },
  {
    name: 'Khalti',
    src: '/images/khalti.png',
    alt: 'Khalti Logo',
  },
];

const paymentOptions = [
  ...paymentLogos,
  {
    name: 'Cash on Delivery',
    src: '',
    alt: 'Cash on Delivery',
  },
];

const BookService = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showOffers, setShowOffers] = useState(false);
  const [baseFare, setBaseFare] = useState(1000);
  const [acceptedTechnician, setAcceptedTechnician] = useState(null); // Will store the full offer object
  const [latestBookingId, setLatestBookingId] = useState(null); // Store the latest booking ID
  const [confirming, setConfirming] = useState(false); // loading state for confirmation

  const [formData, setFormData] = useState({
    scheduledDate: '',
    scheduledTime: '',
    address: '',
    notes: ''
  });

  // Add new state for field-level errors
  const [fieldErrors, setFieldErrors] = useState({});

  // Add state for payment selection, confirmation, and booking flow
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [realOffers, setRealOffers] = useState([]); // Store real technician offers
  const socketRef = useRef(null);

  // Real-time validation function (memoized)
  const validateFields = useCallback(() => {
    const errors = {};
    if (!selectedService) errors.selectedService = 'Please select a service.';
    if (!formData.scheduledDate) errors.scheduledDate = 'Please select a date.';
    if (!formData.scheduledTime) errors.scheduledTime = 'Please select a time.';
    if (!formData.address) errors.address = 'Please enter your address.';
    return errors;
  }, [selectedService, formData]);

  // Update field errors on any change
  useEffect(() => {
    setFieldErrors(validateFields());
  }, [selectedService, formData, validateFields]);

  // Update onChange handlers to always update state
  const handleDateChange = (e) => {
    setFormData((prev) => ({ ...prev, scheduledDate: e.target.value }));
  };
  const handleTimeChange = (e) => {
    setFormData((prev) => ({ ...prev, scheduledTime: e.target.value }));
  };
  const handleAddressChange = (e) => {
    setFormData((prev) => ({ ...prev, address: e.target.value }));
  };
  const handleNotesChange = (e) => {
    setFormData((prev) => ({ ...prev, notes: e.target.value }));
  };

  // Disable button unless all fields are valid
  const isFormValid =
    selectedService &&
    formData.scheduledDate &&
    formData.scheduledTime &&
    formData.address;

  const fetchServices = useCallback(async () => {
    try {
      const response = await servicesAPI.getAllServices();
      setServices(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setServices([]);
      setError('No services available. Try again later.');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchServices().finally(() => setLoading(false));
    if (location.state?.selectedService) {
      setSelectedService(location.state.selectedService);
    }
  }, [fetchServices, location.state]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'user' && user.role !== 'customer') {
      navigate('/technician/profile');
      return;
    }

    // Connect to Socket.IO for real-time offers
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5001');
    socket.emit('register', { userId: user.id, role: user.role });
    
    // Listen for technician offers
    socket.on('technician-offer-created', (offer) => {
      console.log('[REAL OFFER RECEIVED]', offer);
      setRealOffers(prev => [...prev, offer]);
      setShowOffers(true);
    });

    // Listen for admin approval
    socket.on('admin:booking-approved', (data) => {
      console.log('[ADMIN APPROVAL]', data);
      if (data.action === 'grant') {
        setSuccess('Your booking has been approved by admin!');
      } else {
        setError('Your booking was declined by admin.');
      }
    });

    socketRef.current = socket;
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    // Debug log to verify selectedService
    console.log('DEBUG selectedService:', selectedService);
    // Format date to YYYY-MM-DD
    let date = formData.scheduledDate;
    if (date && date.includes('/')) {
      const [d, m, y] = date.split('/');
      date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    // Format time to HH:mm:ss
    let time = formData.scheduledTime;
    if (time && !time.includes(':00')) {
      const [raw, ampm] = time.split(' ');
      let [h, m] = raw.split(':');
      h = parseInt(h, 10);
      if (ampm && ampm.toLowerCase() === 'pm' && h < 12) h += 12;
      if (ampm && ampm.toLowerCase() === 'am' && h === 12) h = 0;
      time = `${h.toString().padStart(2, '0')}:${m}:00`;
    }
    // Ensure serviceId is set correctly
    const serviceId = selectedService?.id || selectedService?._id;
    const bookingData = {
      serviceId,
      date,
      time,
      address: formData.address,
      notes: formData.notes,
      price: selectedService?.basePrice
    };
    setBaseFare(selectedService?.basePrice || 1000);
    try {
      const bookingRes = await bookingsAPI.createBooking(bookingData);
      setLatestBookingId(bookingRes.data.id); // Store booking ID for confirmation
      setSuccess('Booking created successfully! Waiting for technician offers...');
      // Don't auto-show offers - wait for real technician responses
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking. Please try again.');
      console.error('Booking error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Accept offer: store full offer object
  const handleAcceptOffer = (offer) => {
    setAcceptedTechnician(offer); // Store the full offer object
    setShowOffers(false);
    setShowPayment(true);
    setSelectedPayment(null);
    setBookingConfirmed(false);
    setError(''); // Clear any previous error
    setSuccess(''); // Clear any previous success
  };

  // When payment is selected and confirmed, call backend to confirm booking
  const handleConfirmBooking = async () => {
    if (!latestBookingId || !acceptedTechnician || !selectedPayment) {
      setError('Please select a technician and payment method.');
      setSuccess('');
      return;
    }
    setConfirming(true);
    setError('');
    setSuccess('');
    // Debug: log bookingId and technicianId
    console.log('Confirming booking:', { bookingId: latestBookingId, technician: acceptedTechnician });
    try {
      // Use offer.id as technicianId fallback if no real technicianId
      const technicianId = acceptedTechnician.technicianId || acceptedTechnician.id;
      await bookingsAPI.confirmBooking(latestBookingId, {
        technicianId,
        status: 'Approved',
        paymentMethod: selectedPayment,
      });
      setBookingConfirmed(true);
      setSuccess('Your booking has been successful! Your technician will notify you before arrival.');
      // Optionally, refetch bookings or redirect to profile
      // navigate('/profile');
    } catch (err) {
      setError('Failed to confirm booking. Please try again.');
      setSuccess('');
    } finally {
      setConfirming(false);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
                  <NotificationOffers 
              show={showOffers} 
              baseFare={baseFare} 
              onAccept={handleAcceptOffer}
              realOffers={realOffers}
            />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book a Service</h1>
          <p className="text-gray-600">Select a service and schedule your appointment</p>
        </div>
        {bookingConfirmed ? (
          <div className="flex flex-col items-center">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 mt-6 text-center text-lg font-semibold max-w-md mx-auto animate-fade-in">
              <span className="text-2xl mr-2">✅</span> Your booking is confirmed{acceptedTechnician && selectedService ? ` with technician ${acceptedTechnician.technicianName} for ${selectedService.name}` : ''}. Payment will be collected upon service.
            </div>
            <button
              className="mt-2 bg-primary hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
              onClick={() => {
                setShowPayment(false);
                setSelectedPayment(null);
                setBookingConfirmed(false);
                setSelectedService(null);
                setFormData({ scheduledDate: '', scheduledTime: '', address: '', notes: '' });
                setAcceptedTechnician(null);
                setLatestBookingId(null); // Reset booking ID
              }}
            >
              Book Another Service
            </button>
          </div>
        ) : (
          <>
            {/* Service Selection and Booking Details */}
            {!showPayment && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Select Service</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {services.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-gray-400 text-6xl mb-4">🛠️</div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No services available.</h3>
                          <p className="text-gray-500">Please try again later or contact support.</p>
                        </div>
                      ) : (
                        services.map((service) => (
                          <div
                            key={service.id}
                            className={`border-2 rounded-lg p-4 cursor-pointer transition duration-200 ${selectedService?.id === service.id ? 'border-primary bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                            onClick={() => setSelectedService(service)}
                          >
                            <h3 className="font-medium text-gray-900 mb-1">{service.name}</h3>
                            <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                            <div className="flex justify-between items-center">
                              <span className="text-primary font-bold">Rs. {service.basePrice}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Details</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 mb-2">Preferred Date *</label>
                      <input
                        type="date"
                        id="scheduledDate"
                        name="scheduledDate"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={formData.scheduledDate}
                        onChange={handleDateChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary focus:border-primary"
                      />
                      {fieldErrors.scheduledDate && <div className="text-red-500 text-xs mt-1">{fieldErrors.scheduledDate}</div>}
                    </div>
                    <div>
                      <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700 mb-2">Preferred Time *</label>
                      <select
                        id="scheduledTime"
                        name="scheduledTime"
                        required
                        value={formData.scheduledTime}
                        onChange={handleTimeChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary focus:border-primary"
                      >
                        <option value="">Select time</option>
                        <option value="09:00">9:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="12:00">12:00 PM</option>
                        <option value="13:00">1:00 PM</option>
                        <option value="14:00">2:00 PM</option>
                        <option value="15:00">3:00 PM</option>
                        <option value="16:00">4:00 PM</option>
                      </select>
                      {fieldErrors.scheduledTime && <div className="text-red-500 text-xs mt-1">{fieldErrors.scheduledTime}</div>}
                    </div>
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        required
                        value={formData.address}
                        onChange={handleAddressChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary focus:border-primary"
                      />
                      {fieldErrors.address && <div className="text-red-500 text-xs mt-1">{fieldErrors.address}</div>}
                    </div>
                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleNotesChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary focus:border-primary"
                        rows={3}
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
                      disabled={!isFormValid || submitting}
                    >
                      {submitting ? 'Booking...' : 'Book Service'}
                    </button>
                  </form>
                </div>
              </div>
            )}
            {/* Payment method section (fade-in animation, only visible after offer accepted) */}
            {showPayment && !bookingConfirmed && (
              <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center mt-4 w-full max-w-md mx-auto animate-fade-in">
                <div className="text-gray-700 font-semibold mb-2 text-lg">Select Payment Method</div>
                <div className="grid grid-cols-2 gap-4 w-full">
                  {paymentOptions.map((option) => (
                    <button
                      key={option.name}
                      type="button"
                      onClick={() => setSelectedPayment(option.name)}
                      className={`flex flex-col items-center justify-center border-2 rounded-lg p-4 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50 hover:bg-blue-50 relative ${selectedPayment === option.name ? 'border-green-500 ring-2 ring-green-400' : 'border-gray-200'}`}
                    >
                      {option.src ? (
                        <img
                          src={option.src}
                          alt={option.alt}
                          className="h-10 w-auto mb-2 object-contain"
                          style={{ maxWidth: 60 }}
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-3xl mb-2">💵</span>
                      )}
                      <span className="font-medium text-gray-800">{option.name}</span>
                      {selectedPayment === option.name && (
                        <span className="absolute top-2 right-2 text-green-500 text-xl">✔️</span>
                      )}
                    </button>
                  ))}
                </div>
                {error && !success && <div className="text-red-600 font-medium mt-2">{error}</div>}
                {success && !error && <div className="text-green-600 font-medium mt-2">{success}</div>}
                <button
                  type="button"
                  className={`mt-6 w-full bg-primary hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 ${!selectedPayment || confirming ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!selectedPayment || confirming}
                  onClick={handleConfirmBooking}
                >
                  {confirming ? 'Confirming...' : 'Confirm Booking'}
                </button>
              </div>
            )}
          </>
        )}
        {/* Booking History always visible at the bottom */}
        <div className="max-w-2xl mx-auto mt-12 bg-white rounded-xl shadow p-6">
          <div className="text-xl font-bold text-gray-800 mb-4">Booking History</div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Technician</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-2 whitespace-nowrap">Cleaning</td>
                  <td className="px-4 py-2 whitespace-nowrap">Sita Kumari</td>
                  <td className="px-4 py-2 whitespace-nowrap">Cash on Delivery</td>
                  <td className="px-4 py-2 whitespace-nowrap text-green-600 font-semibold">Confirmed</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 whitespace-nowrap">Plumbing</td>
                  <td className="px-4 py-2 whitespace-nowrap">Ram Bahadur</td>
                  <td className="px-4 py-2 whitespace-nowrap">eSewa</td>
                  <td className="px-4 py-2 whitespace-nowrap text-yellow-600 font-semibold">Pending</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 whitespace-nowrap">AC Repair</td>
                  <td className="px-4 py-2 whitespace-nowrap">Kiran Gurung</td>
                  <td className="px-4 py-2 whitespace-nowrap">IME Pay</td>
                  <td className="px-4 py-2 whitespace-nowrap text-red-600 font-semibold">Cancelled</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookService;
