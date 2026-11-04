import React, { useEffect, useState } from 'react';

const PageLoader = ({ isLoading = true }) => {
  const [show, setShow] = useState(isLoading);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setShow(false), 500);
      return () => clearTimeout(timer);
    }
    setShow(true);
  }, [isLoading]);

  if (!show) return null;

  return (
    <div className="page-loader fixed inset-0 flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 z-50">
      <div className="text-center">
        {/* Animated hotel bed emoji */}
        <div className="animate-float-bounce text-7xl mb-6">🏨</div>

        {/* Animated spinner */}
        <div className="spinner mx-auto mb-4"></div>
        
        {/* Loading text with animation */}
        <h2 className="animate-text-fade text-white text-xl font-semibold mt-4">
          Loading...
        </h2>
        
        {/* Loading bar */}
        <div className="loading-bar mt-4 w-32 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mx-auto opacity-50"></div>
      </div>

      {/* Floating elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full opacity-5 animate-bounce"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-white rounded-full opacity-5 animate-pulse-slow"></div>
    </div>
  );
};

export default PageLoader;
