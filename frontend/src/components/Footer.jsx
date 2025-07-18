import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-blue-700 text-white py-6 mt-8">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <div className="font-bold text-lg">Smart Door Step</div>
        <div className="mt-2 md:mt-0 text-sm">&copy; {new Date().getFullYear()} All rights reserved.</div>
        <div className="flex space-x-4 mt-2 md:mt-0">
          <a href="/" className="hover:text-orange-400">Home</a>
          <a href="/services" className="hover:text-orange-400">Services</a>
          <a href="/book" className="hover:text-orange-400">Book</a>
        </div>
      </div>
    </footer>
  );
} 