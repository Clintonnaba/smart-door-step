import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const services = [
  {
    name: 'Plumbing',
    icon: (
      <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6a2 2 0 002-2v-2a2 2 0 00-2-2h-6a2 2 0 00-2 2v2a2 2 0 002 2z" /></svg>
    ),
    desc: 'Expert plumbing repairs and installations.'
  },
  {
    name: 'Electrical',
    icon: (
      <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    ),
    desc: 'Safe and reliable electrical services.'
  },
  {
    name: 'Cleaning',
    icon: (
      <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 19a4 4 0 004 4h10a4 4 0 004-4V7a4 4 0 00-4-4H7a4 4 0 00-4 4v12z" /></svg>
    ),
    desc: 'Professional home and office cleaning.'
  }
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-600 via-white to-orange-200">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-400 text-white py-16 px-4 text-center">
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight">Smart Door Step</h1>
          <p className="text-xl mb-8">Your Home, Our Priority. Book trusted home services instantly.</p>
          <a href="/book" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 py-4 rounded-xl shadow-lg text-lg transition">Book Now</a>
        </section>
        {/* Services Section */}
        <section className="max-w-5xl mx-auto py-16 px-4">
          <h2 className="text-3xl font-bold text-center mb-10 text-blue-700">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {services.map((service) => (
              <div key={service.name} className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center text-center hover:shadow-2xl transition">
                {service.icon}
                <h3 className="mt-4 text-xl font-semibold text-blue-900">{service.name}</h3>
                <p className="mt-2 text-gray-600">{service.desc}</p>
              </div>
            ))}
          </div>
        </section>
        {/* Testimonials Section */}
        <section className="bg-white py-16 px-4">
          <h2 className="text-3xl font-bold text-center mb-10 text-blue-700">What Our Customers Say</h2>
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="bg-gray-100 rounded-lg p-6 shadow text-center">
              <p className="text-gray-700 italic">“Fast, friendly, and reliable! Highly recommend.”</p>
              <div className="mt-4 font-semibold text-blue-700">— Priya S.</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-6 shadow text-center">
              <p className="text-gray-700 italic">“Booking was so easy and the service was top-notch.”</p>
              <div className="mt-4 font-semibold text-blue-700">— Amit K.</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-6 shadow text-center">
              <p className="text-gray-700 italic">“My go-to for home repairs and cleaning!”</p>
              <div className="mt-4 font-semibold text-blue-700">— Rina M.</div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
} 