import React, { useEffect, useState } from 'react';
import { hotelAPI } from '../api';
import { FiChevronLeft, FiChevronRight, FiPlay, FiX } from 'react-icons/fi';

export default function VideoGallery() {
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    if (videos.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % videos.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [videos.length]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await hotelAPI.getVideos?.() || { data: [] };
      setVideos(response.data || []);
      setError(false);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error || videos.length === 0) {
    return null; // Don't show section if no videos
  }

  const currentVideo = videos[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev - 1 + videos.length) % videos.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % videos.length);
  };

  return (
    <section className="py-16 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Video Display */}
        <div className="mb-12">
          <div className="relative group">
            <div className="relative h-96 rounded-lg overflow-hidden shadow-2xl bg-black">
              {/* Video Preview Thumbnail */}
              <video
                src={currentVideo.videoUrl}
                className="w-full h-full object-cover"
                onError={() => {
                  console.error('Video load error');
                }}
              />

              {/* Play Button Overlay */}
              <button
                onClick={() => setSelectedVideo(currentVideo)}
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-40 transition cursor-pointer"
              >
                <div className="bg-white bg-opacity-80 rounded-full p-6 group-hover:bg-opacity-100 group-hover:scale-110 transition transform">
                  <FiPlay className="w-8 h-8 text-gray-900 ml-1" />
                </div>
              </button>

              {/* Navigation Arrows */}
              {videos.length > 1 && (
                <>
                  <button
                    onClick={handlePrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-30 hover:bg-opacity-60 text-white p-3 rounded-full transition z-10"
                  >
                    <FiChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-30 hover:bg-opacity-60 text-white p-3 rounded-full transition z-10"
                  >
                    <FiChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Counter */}
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
                {currentIndex + 1} / {videos.length}
              </div>
            </div>

            {/* Video Info */}
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-white mb-2">{currentVideo.title}</h3>
              <p className="text-gray-300">{currentVideo.description}</p>
            </div>
          </div>
        </div>

        {/* Video Thumbnails Carousel */}
        {videos.length > 1 && (
          <div>
            <h4 className="text-lg font-semibold text-white mb-6">More Videos</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {videos.map((video, index) => (
                <button
                  key={video.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`relative group rounded-lg overflow-hidden transition transform hover:scale-105 ${
                    index === currentIndex ? 'ring-4 ring-blue-500' : ''
                  }`}
                >
                  <video
                    src={video.videoUrl}
                    className="w-full h-24 object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-40 transition">
                    <FiPlay className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition" />
                  </div>
                  {index === currentIndex && (
                    <div className="absolute inset-0 border-4 border-blue-500 rounded-lg" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Full Screen Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95 p-4">
          <div className="relative w-full max-w-4xl">
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition"
            >
              <FiX className="w-8 h-8" />
            </button>
            <video
              src={selectedVideo.videoUrl}
              autoPlay
              controls
              className="w-full h-auto rounded-lg shadow-2xl"
            />
            <div className="mt-4 text-white">
              <h3 className="text-2xl font-bold mb-2">{selectedVideo.title}</h3>
              <p className="text-gray-300">{selectedVideo.description}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
