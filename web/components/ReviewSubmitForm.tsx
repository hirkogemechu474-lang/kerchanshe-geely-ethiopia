'use client';

import { useState } from 'react';
import { Star, Send, AlertCircle } from 'lucide-react';

interface ReviewSubmitFormProps {
  onSuccess?: () => void;
}

export default function ReviewSubmitForm({ onSuccess }: ReviewSubmitFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    vehicleModel: '',
    reviewTitle: '',
    reviewMessage: '',
    profileImage: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataToSend = new FormData();
    formDataToSend.append('file', file);
    formDataToSend.append('category', 'review-profile');

    try {
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();
      if (data.url) {
        setFormData(prev => ({ ...prev, profileImage: data.url }));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.fullName || !rating || !formData.reviewTitle || !formData.reviewMessage) {
        throw new Error('Please fill in all required fields and select a rating');
      }

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          rating,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      setSuccess(true);
      setFormData({
        fullName: '',
        email: '',
        vehicleModel: '',
        reviewTitle: '',
        reviewMessage: '',
        profileImage: '',
      });
      setRating(0);

      if (onSuccess) onSuccess();

      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg border border-gray-200 p-6 md:p-8">
      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-700">
            <p className="font-semibold mb-1">Thank you for your review!</p>
            <p>Your review has been submitted for moderation and will appear shortly after approval.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your name"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email (Optional)
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your@email.com"
          />
        </div>

        {/* Vehicle Model */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vehicle Model (Optional)
          </label>
          <select
            name="vehicleModel"
            value={formData.vehicleModel}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a model</option>
            <option value="Geometry EX5">Geometry EX5</option>
            <option value="Geometry C11">Geometry C11</option>
            <option value="Geometry A">Geometry A</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating *
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-colors"
              >
                <Star
                  size={28}
                  className={`${
                    (hoverRating || rating) >= star
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && <p className="text-sm text-gray-600 mt-1">{rating} out of 5 stars</p>}
        </div>
      </div>

      {/* Review Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Review Title *
        </label>
        <input
          type="text"
          name="reviewTitle"
          value={formData.reviewTitle}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Summary of your review"
        />
      </div>

      {/* Review Message */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your Review *
        </label>
        <textarea
          name="reviewMessage"
          value={formData.reviewMessage}
          onChange={handleInputChange}
          required
          rows={5}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Share your experience with Geely vehicles..."
        />
        <p className="text-xs text-gray-500 mt-1">{formData.reviewMessage.length}/1000 characters</p>
      </div>

      {/* Profile Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile Image (Optional)
        </label>
        <div className="flex items-center gap-4">
          {formData.profileImage && (
            <img
              src={formData.profileImage}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover"
            />
          )}
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <span className="text-sm font-medium">Choose Image</span>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Send size={16} />
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
}
