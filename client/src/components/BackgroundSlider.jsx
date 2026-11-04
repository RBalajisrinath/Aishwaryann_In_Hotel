import React, { useEffect, useState } from 'react';
import { adminAPI } from '../api';

export default function BackgroundSlider() {
  const [yearCards, setYearCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchYearCards();
  }, []);

  useEffect(() => {
    if (yearCards.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % yearCards.length);
      }, 8000); // Change every 8 seconds
      return () => clearInterval(interval);
    }
  }, [yearCards.length]);

  const fetchYearCards = async () => {
    try {
      const response = await adminAPI.getYearCards();
      if (response.data && response.data.length > 0) {
        setYearCards(response.data);
      }
    } catch (error) {
      console.error('Error fetching year cards:', error);
    }
  };

  if (yearCards.length === 0) {
    return (
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" />
    );
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Background Images */}
      {yearCards.map((card, idx) => (
        <div
          key={card.id}
          className={`absolute inset-0 transition-opacity duration-2000 ${
            idx === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transitionDuration: '2000ms' }}
        >
          {card.imageUrl && (
            <div
              className="w-full h-full bg-cover bg-center bg-no-repeat transform scale-110"
              style={{
                backgroundImage: `url(${card.imageUrl})`,
                filter: 'blur(3px) brightness(1.1)',
              }}
            />
          )}
        </div>
      ))}

      {/* Multiple Overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/90 to-white/95" />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/40 via-transparent to-purple-50/40" />
      
      {/* Subtle pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
