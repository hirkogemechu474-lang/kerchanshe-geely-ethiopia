'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/MainLayout';
import { Star, User, Car, MessageCircle, Send, CheckCircle } from 'lucide-react';

export default function SubmitReviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    vehicleModel: '',
    rating: 0,
    reviewTitle: '',
    reviewMessage: '',
  });

  const vehicleModels = [
    'Coolray',
    'Monjaro',
    'Okavango', 
    'Azkarra',
    'Emgrand',
    'Geometry EX5',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.rating === 0) {
      alert('Please select a rating');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <MainLayout>
        <div className="py-16 bg-ice">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-navy mb-4">Thank You!</h1>
              <p className="text-steel text-lg mb-6">
                Your review has been submitted successfully. It will be published after moderation.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-3 bg-geely-blue text-white rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
                >
                  Back to Home
                </button>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      fullName: '',
                      email: '',
                      vehicleModel: '',
                      rating: 0,
                      reviewTitle: '',
                      reviewMessage: '',
                    });
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Submit Another Review
                </button>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="py-16 bg-ice">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-navy mb-4">Share Your Geely Experience</h1>
            <p className="text-steel text-lg max-w-2xl mx-auto">
              Help other customers by sharing your honest experience with your Geely vehicle. 
              Your review will help others make informed decisions.
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div>
                <h3 className="text-xl font-bold text-navy mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                      placeholder="your@email.com (optional)"
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div>
                <h3 className="text-xl font-bold text-navy mb-4 flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Vehicle Information
                </h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Vehicle Model *
                    </label>
                    <select
                      required
                      value={formData.vehicleModel}
                      onChange={(e) => setFormData({...formData, vehicleModel: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                    >
                      <option value="">Select your Geely model</option>
                      {vehicleModels.map((model) => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div>
                <h3 className="text-xl font-bold text-navy mb-4">Overall Rating *</h3>
                <div className="flex items-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({...formData, rating: star})}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        size={32}
                        className={`${
                          star <= formData.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300 hover:text-yellow-300'
                        }`}
                      />
                    </button>
                  ))}
                  {formData.rating > 0 && (
                    <span className="ml-3 text-lg font-semibold text-navy">
                      {formData.rating}/5 Stars
                    </span>
                  )}
                </div>
              </div>

              {/* Review Content */}
              <div>
                <h3 className="text-xl font-bold text-navy mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Your Review
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Review Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.reviewTitle}
                      onChange={(e) => setFormData({...formData, reviewTitle: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                      placeholder="e.g., 'Great family car with excellent fuel economy'"
                      maxLength={100}
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum 100 characters</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Experience *
                    </label>
                    <textarea
                      required
                      value={formData.reviewMessage}
                      onChange={(e) => setFormData({...formData, reviewMessage: e.target.value})}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                      placeholder="Share your experience with your Geely vehicle. What do you like most? How has it performed? Would you recommend it to others?"
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.reviewMessage.length}/500 characters
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 bg-geely-blue text-white px-8 py-4 rounded-lg font-bold hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Submit Review
                      </>
                    )}
                  </button>
                  <p className="text-sm text-gray-500">
                    Your review will be published after moderation to ensure quality and authenticity.
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}