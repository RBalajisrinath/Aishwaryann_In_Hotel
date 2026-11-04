import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../store';
import { adminAPI } from '../utils/api';
import { FiBarChart2, FiUsers, FiCalendar, FiTrendingUp, FiHome, FiSettings, FiLogOut, FiDownload, FiImage, FiUser, FiStar, FiToggleLeft, FiEdit, FiFileText, FiDollarSign } from 'react-icons/fi';
import io from 'socket.io-client';

const StatCard = ({ title, value, icon: Icon, color, trend, bgGradient }) => (
  <div className={`bg-gradient-to-br ${bgGradient} rounded-2xl shadow-lg p-8 text-white transform hover:scale-105 transition duration-300 border border-opacity-20 border-white`}>
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1">
        <p className="text-white text-opacity-80 text-sm font-medium mb-2">{title}</p>
        <p className="text-4xl font-bold">{value}</p>
        {trend && (
          <p className={`text-sm mt-2 flex items-center gap-1 ${trend > 0 ? 'text-green-200' : 'text-red-200'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
          </p>
        )}
      </div>
      <div className="bg-white bg-opacity-20 p-4 rounded-xl">
        <Icon className="w-8 h-8 text-white" />
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const addNotification = useNotificationStore((state) => state.addNotification);
  
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    occupancyRate: 0,
    activeBookings: 0,
    availableRooms: 0,
    totalUsers: 0,
    avgRating: 0,
    monthlyGrowth: 0
  });
  const [occupancyByRoom, setOccupancyByRoom] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();

    // Setup Socket.IO for real-time updates
    // Use VITE_SOCKET_URL or VITE_API_URL from env, fallback to current domain
    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || window.location.origin;
    const socket = io(socketUrl);
    
    socket.on('bookingUpdated', (data) => {
      console.log('Booking updated, refreshing stats:', data);
      loadStats(); // Reload stats when booking changes
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const loadStats = async () => {
    try {
      // Use the dashboard stats API for real-time accurate data
      const [statsRes, occupancyRes] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getOccupancyByRoomType()
      ]);
      
      const stats = statsRes.data?.data || statsRes.data || {};
      const occupancyData = occupancyRes.data || [];
      
      // Calculate occupancy rate based on actual rooms
      const totalRooms = parseInt(stats.totalRooms) || 0;
      const availableRooms = parseInt(stats.availableRooms) || 0;
      const occupiedRooms = totalRooms - availableRooms;
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
      
      // Process occupancy by room type
      const processedOccupancy = occupancyData.map(room => ({
        name: room.roomType,
        occupancy: Math.round(parseFloat(room.occupancyRate) || 0),
        color: getColorForRoomType(room.roomType)
      }));
      
      setStats({
        totalBookings: stats.totalBookings || 0,
        totalRevenue: stats.totalRevenue || 0,
        occupancyRate: occupancyRate,
        activeBookings: stats.confirmedBookings || 0,
        availableRooms: availableRooms,
        totalUsers: stats.totalUsers || 0,
        avgRating: 4.8,
        monthlyGrowth: 15.3
      });
      
      setOccupancyByRoom(processedOccupancy);
      setLoading(false);
    } catch (error) {
      console.error('Dashboard stats error:', error);
      addNotification({ message: 'Failed to load dashboard stats', type: 'error' });
      setLoading(false);
    }
  };

  const getColorForRoomType = (roomType) => {
    const colors = {
      'single': 'from-blue-600 to-blue-400',
      'double': 'from-purple-600 to-purple-400',
      'deluxe': 'from-pink-600 to-pink-400',
      'suite': 'from-green-600 to-green-400'
    };
    return colors[roomType.toLowerCase()] || 'from-slate-600 to-slate-400';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiBarChart2 },
    { id: 'rooms', label: 'Rooms', icon: FiHome },
    { id: 'bookings', label: 'Bookings', icon: FiCalendar },
    { id: 'users', label: 'Users', icon: FiUsers },
    { id: 'settings', label: 'Settings', icon: FiSettings }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-10 pointer-events-none" />
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-800 bg-opacity-80 backdrop-blur border-r border-slate-700 fixed h-screen overflow-y-auto z-50">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-xl">
              <FiBarChart2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Panel</h1>
              <p className="text-slate-400 text-xs">{user?.firstName || 'Admin'}</p>
            </div>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold"
            >
              <FiBarChart2 className="w-5 h-5" />
              Dashboard
            </button>
            
            <button
              onClick={() => navigate('/rooms')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <FiHome className="w-5 h-5" />
              Room Management
            </button>

            <button
              onClick={() => navigate('/amenities')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <FiSettings className="w-5 h-5" />
              Amenities Management
            </button>
            
            <button
              onClick={() => navigate('/bookings')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <FiCalendar className="w-5 h-5" />
              Bookings
            </button>
            
            <button
              onClick={() => navigate('/users')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <FiUsers className="w-5 h-5" />
              User Management
            </button>
            
            <button
              onClick={() => navigate('/guests')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <FiUsers className="w-5 h-5" />
              Guest Management
            </button>
            
            {/* Billing and bill template UI removed */}
            
            <button
              onClick={() => navigate('/reviews')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <FiStar className="w-5 h-5" />
              Reviews & Ratings
            </button>
            
            <button
              onClick={() => navigate('/website-status')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <FiToggleLeft className="w-5 h-5" />
              Website Status
            </button>
            
            <button
              onClick={() => navigate('/policies')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <FiFileText className="w-5 h-5" />
              Hotel Policies
            </button>
            
            <button
              onClick={() => navigate('/pending-approvals')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition relative"
            >
              <FiCalendar className="w-5 h-5" />
              Pending Approvals
            </button>
            
            <button
              onClick={() => navigate('/payment-settings')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <FiDollarSign className="w-5 h-5" />
              Payment Settings
            </button>
            
            <button
              onClick={() => navigate('/website-content')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <FiEdit className="w-5 h-5" />
              Website Content
            </button>
            
            <button
              onClick={() => navigate('/profile')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <FiUser className="w-5 h-5" />
              My Profile
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold transition mt-4"
            >
              <FiLogOut className="w-5 h-5" />
              Logout
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 relative z-10">
        {/* Header */}
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h2>
          <p className="text-slate-400">Welcome back, {user?.firstName} {user?.lastName}</p>
        </header>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings}
            icon={FiCalendar}
            bgGradient="from-blue-600 to-blue-800"
          />
          <StatCard
            title="Total Revenue"
            value={`₹${((stats.totalRevenue || 0) / 1000).toFixed(1)}K`}
            icon={FiTrendingUp}
            bgGradient="from-green-600 to-green-800"
          />
          <StatCard
            title="Occupancy Rate"
            value={`${stats.occupancyRate}%`}
            icon={FiHome}
            bgGradient="from-purple-600 to-purple-800"
          />
          <StatCard
            title="Active Bookings"
            value={stats.activeBookings}
            icon={FiCalendar}
            bgGradient="from-orange-600 to-orange-800"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Available Rooms"
            value={stats.availableRooms}
            icon={FiHome}
            bgGradient="from-indigo-600 to-indigo-800"
          />
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={FiUsers}
            bgGradient="from-pink-600 to-pink-800"
          />
          <StatCard
            title="Average Rating"
            value={`${stats.avgRating}⭐`}
            icon={FiBarChart2}
            bgGradient="from-yellow-600 to-yellow-800"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          {/* Occupancy Chart */}
          <div className="bg-slate-700 bg-opacity-50 backdrop-blur rounded-2xl p-8 border border-slate-600 hover:border-slate-500 transition">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Occupancy by Room Type</h3>
              <button className="text-slate-400 hover:text-white transition">
                <FiDownload className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {occupancyByRoom.length > 0 ? (
                occupancyByRoom.map((room, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">{room.name}</span>
                      <span className="text-slate-200 font-semibold">{room.occupancy}%</span>
                    </div>
                    <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${room.color} rounded-full transition-all duration-500`}
                        style={{ width: `${room.occupancy}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-center py-4">No room data available</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}