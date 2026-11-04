import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store';
import { FiMenu, FiX, FiLogOut, FiUser } from 'react-icons/fi';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/all-rooms', label: 'All Rooms' },
    { path: '/amenities', label: 'Amenities' },
    { path: '/my-bookings', label: 'My Bookings' },
    { path: '/contact', label: 'Contact' }
  ];

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition" onClick={() => { navigate('/'); setIsOpen(false); }}>
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-lg">A</span>
            </div>
            <span className="font-bold text-xl hidden sm:inline">Aishwaryam Inn</span>
            <span className="font-bold text-xl sm:hidden">Aishwaryam</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button key={link.path} onClick={() => navigate(link.path)} className={`transition-colors font-medium ${isActive(link.path) ? 'border-b-2 border-white text-white' : 'text-blue-100 hover:text-white'}`}>
                {link.label}
              </button>
            ))}

            {isAuthenticated && user?.role === 'super-admin' && (
              <div className="flex items-center gap-4 border-l border-blue-400 pl-4">
                <div className="flex items-center gap-2">
                  <FiUser className="w-4 h-4" />
                  <span className="text-sm">{user?.firstName || 'Admin'}</span>
                </div>
                <button onClick={() => { window.location.href = '/admin/'; setIsOpen(false); }} className="px-3 py-1 bg-orange-500 hover:bg-orange-600 rounded transition font-medium text-sm">
                  Admin Dashboard
                </button>
                <button onClick={handleLogout} className="flex items-center gap-1 px-3 py-1 bg-red-500 hover:bg-red-600 rounded transition font-medium text-sm">
                  <FiLogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>

          <button className="md:hidden p-2 hover:bg-blue-700 rounded transition" onClick={toggleMenu}>
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4 space-y-3">
            {navLinks.map((link) => (
              <button key={link.path} onClick={() => { navigate(link.path); setIsOpen(false); }} className={`w-full text-left px-3 py-2 rounded transition ${isActive(link.path) ? 'bg-blue-500 text-white' : 'text-blue-100 hover:bg-blue-700'}`}>
                {link.label}
              </button>
            ))}

            {isAuthenticated && user?.role === 'super-admin' && (
              <div className="border-t border-blue-400 pt-3 space-y-2">
                <div className="px-3 py-2 bg-blue-700 rounded text-sm">
                  <FiUser className="w-4 h-4 inline mr-2" />
                  {user?.firstName || 'Admin'}
                </div>
                <button onClick={() => { window.location.href = '/admin/'; setIsOpen(false); }} className="w-full px-3 py-2 bg-orange-500 hover:bg-orange-600 rounded transition text-left">
                  Admin Dashboard
                </button>
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 rounded transition">
                  <FiLogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
