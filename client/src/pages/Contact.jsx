import React, { useState, useEffect } from 'react';
import { FiPhone, FiMail, FiMapPin, FiClock, FiSend, FiCheckCircle } from 'react-icons/fi';
import axios from 'axios';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [faqs, setFaqs] = useState([]);
  const [faqsLoading, setFaqsLoading] = useState(true);

  // Fetch FAQs from admin
  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const response = await axios.get('/api/site-content/faqs');
      if (response.data.success) {
        setFaqs(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      setFaqs([]);
    } finally {
      setFaqsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate form submission
    setTimeout(() => {
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setLoading(false);
      
      // Reset success message after 5 seconds
      setTimeout(() => setSubmitted(false), 5000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Page Header */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-3">Contact Us</h1>
          <p className="text-blue-100 text-lg">We'd love to hear from you. Get in touch with us today!</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Contact Info Cards */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition">
            <div className="flex items-center mb-4">
              <div className="bg-blue-600 text-white p-3 rounded-full mr-4">
                <FiPhone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Phone</h3>
            </div>
            <p className="text-gray-600 mb-2">Call us anytime during business hours</p>
            <p className="text-2xl font-bold text-blue-600">+91 9443224498</p>
            <p className="text-sm text-gray-500 mt-2">Available 24/7 for emergencies</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition">
            <div className="flex items-center mb-4">
              <div className="bg-green-600 text-white p-3 rounded-full mr-4">
                <FiMail className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Email</h3>
            </div>
            <p className="text-gray-600 mb-2">Reach us via email anytime</p>
            <p className="text-lg font-bold text-green-600">aishwaryaminn@gmail.com</p>
            <p className="text-sm text-gray-500 mt-2">We respond within 24 hours</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition">
            <div className="flex items-center mb-4">
              <div className="bg-purple-600 text-white p-3 rounded-full mr-4">
                <FiMapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Location</h3>
            </div>
            <p className="text-gray-600 mb-2">Visit us at our office</p>
            <p className="font-bold text-purple-600">Aishwaryam Inn</p>
            <p className="text-sm text-gray-600">Suguna Vilas, No:1</p>
            <p className="text-sm text-gray-600">Nagloor-Yercaud Rd, Kombaikkadu</p>
            <p className="text-sm text-gray-600">Tamil Nadu 636602, India</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Send us a Message</h2>
            
            {submitted && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <FiCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-800">Success!</p>
                  <p className="text-sm text-green-700">Your message has been sent. We'll get back to you soon!</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="john@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="Booking inquiry"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  placeholder="Your message here..."
                  rows="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <FiSend className="w-5 h-5" />
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          {/* FAQ - Loaded from Admin */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs && faqs.length > 0 ? (
                faqs.map((faq) => (
                  <div key={faq.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition cursor-pointer">
                    <h3 className="font-bold text-gray-800 mb-2">{faq.question}</h3>
                    <p className="text-gray-600 text-sm">{faq.answer}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No FAQs available at the moment.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 mt-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Book Your Stay?</h2>
          <p className="text-blue-100 mb-6">Contact us today or browse our available rooms</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/all-rooms" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 transition inline-block">
              Browse Rooms
            </a>
            <a href="mailto:aishwaryaminn@gmail.com" className="bg-blue-500 hover:bg-blue-400 px-8 py-3 rounded-lg font-bold transition inline-block">
              Email Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
