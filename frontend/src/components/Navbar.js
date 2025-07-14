import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-blue-600 p-4 text-white flex justify-between items-center">
      <div className="font-bold text-lg">
        <Link to="/">Smart Door Step</Link>
      </div>
      <div className="space-x-4">
        <Link to="/">Home</Link>
        <Link to="/login">Login</Link>
        <Link to="/signup">Signup</Link>
        <Link to="/book">Book Service</Link>
        <Link to="/profile">User Profile</Link>
        <Link to="/admin">Admin Dashboard</Link>
      </div>
    </nav>
  );
}
