import React from 'react';

export default function MaintenancePage({ message }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center">
        {/* Maintenance Icon */}
        <div className="mb-8">
          <svg
            className="mx-auto h-24 w-24 text-indigo-600 animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          We'll Be Back Soon
        </h1>

        {/* Message */}
        <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
          {message || 'We are performing scheduled maintenance. Please try again later.'}
        </p>

        {/* Status Badge */}
        <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-full mb-8">
          <div className="w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse"></div>
          <span className="text-sm font-medium">Under Maintenance</span>
        </div>

        {/* Email Contact */}
        <div className="mt-12">
          <p className="text-gray-600 mb-2">Questions? Contact us at:</p>
          <a
            href="mailto:support@hotelBooking.com"
            className="text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            support@hotelBooking.com
          </a>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
      </div>
    </div>
  );
}
