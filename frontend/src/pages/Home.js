import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { servicesAPI } from '../api/api';

const Home = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.role === 'technician') {
      navigate('/technician/dashboard');
    }
  }, [navigate]);

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [error, setError] = useState(null);

  const fetchServices = useCallback(async () => {
    try {
      const response = await servicesAPI.getAllServices();
      setServices(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (error) {
      setServices([]);
      setError('No services available. Try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const ServiceModal = ({ service, onClose }) => {
    if (!service) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-gray-900">{service.name}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600 mb-4">{service.description}</p>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="font-medium">Price:</span>
              <span className="text-primary font-bold">Rs. {service.basePrice}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Category:</span>
              <span className="text-gray-700">{service.category}</span>
            </div>
          </div>
          <Link
            to="/book"
            state={{ selectedService: service }}
            className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
          >
            Book Now
          </Link>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <img 
              src="/assets/logo.png" 
              alt="Smart Door Step Logo" 
              className="h-20 w-auto rounded-none shadow-none"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Smart Door Step
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Professional home services at your doorstep in Nepal. 
            From plumbing to electrical work, we've got you covered.
          </p>
          <div className="space-x-4">
            <Link
              to="/book"
              className="bg-secondary hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-200 inline-block"
            >
              Book Now
            </Link>
            <Link
              to="/signup"
              className="bg-transparent border-2 border-white hover:bg-white hover:text-primary text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-200 inline-block"
            >
              Join Us
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Professional and reliable home services delivered by certified technicians</p>
          </div>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}
          {!error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.isArray(services) && services.length > 0 ? services.map((service) => (
                <div
                  key={service.id}
                  className="bg-white rounded-lg shadow-lg hover:shadow-xl transition duration-300 overflow-hidden cursor-pointer"
                  // Remove onClick for modal, add Book Now button below
                >
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{service.description}</p>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-primary font-bold text-lg">Rs. {service.basePrice}</span>
                      <span className="text-sm text-gray-500">{service.category}</span>
                    </div>
                    <button
                      className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 mt-2"
                      onClick={() => navigate('/book', { state: { selectedService: service } })}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              )) : (
                <div className="col-span-full text-center text-gray-500 py-12">No services available.</div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Smart Door Step?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Certified Technicians</h3>
              <p className="text-gray-600">All our technicians are certified and experienced professionals</p>
            </div>

            <div className="text-center">
              <div className="bg-secondary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Quick Service</h3>
              <p className="text-gray-600">Same-day service available for urgent repairs</p>
            </div>

            <div className="text-center">
              <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Affordable Prices</h3>
              <p className="text-gray-600">Competitive pricing with no hidden charges</p>
            </div>
          </div>
        </div>
      </section>

      {/* Service Modal */}
      {selectedService && (
        <ServiceModal service={selectedService} onClose={() => setSelectedService(null)} />
      )}
    </div>
  );
};

export default Home;
