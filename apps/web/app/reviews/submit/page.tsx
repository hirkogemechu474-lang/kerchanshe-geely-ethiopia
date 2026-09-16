'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/MainLayout';
import { Star, User, Car, MessageCircle, Send, CheckCircle, Upload } from 'lucide-react';

interface VehicleRecord {
  id: string;
  name: string;
  slug?: string;
}

export default function SubmitReviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    vehicleModel: '',
    rating: 0,
    reviewTitle: '',
    reviewMessage: '',
  });

  useEffect(() => {
    let active = true;

    async function fetchVehicles() {
      try {
        const response = await fetch('/api/public/vehicles');
        if (!response.ok) return;

        const data = await response.json();
        if (active) {
          const list: VehicleRecord[] = Array.isArray(data) ? data : data?.vehicles || [];
          setVehicles(list);
        }
      } catch (error) {
        console.error('Failed to load vehicles:', error);
      } finally {
        if (active) setVehiclesLoading(false);
      }
    }

    void fetchVehicles();
    return () => {
      active = false;
    };
  }, []);

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    setImageError(null);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('category', 'reviews');
      const res = await fetch('/api/upload/image', { method: 'POST', body: uploadData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setProfileImageUrl(data.url);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Failed to upload photo. Please try again.');
    } finally {
      setImageUploading(false);
      e.target.value = '';
    }
  };

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
        body: JSON.stringify({ ...formData, profileImage: profileImageUrl || undefined }),
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
        <div className="py-16 bg-ice dark:bg-midnight">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="bg-white dark:bg-midnight-surface rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-navy dark:text-ice mb-4">Thank You!</h1>
              <p className="text-steel dark:text-steel-light text-lg mb-6">
                Your review has been submitted successfully. It will be published after moderation.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-3 bg-geely-blue text-white font-semibold hover:bg-opacity-90 transition-colors"
                >
                  Back to Home
                </button>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setProfileImageUrl(null);
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
      <div className="py-16 bg-ice dark:bg-midnight">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-navy dark:text-ice mb-4">Share Your Geely Experience</h1>
            <p className="text-steel dark:text-steel-light text-lg max-w-2xl mx-auto">
              Help other customers by sharing your honest experience with your Geely vehicle. 
              Your review will help others make informed decisions.
            </p>
          </div>

          {/* Form */}
          <div className="bg-white dark:bg-midnight-surface rounded-xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div>
                <h3 className="text-xl font-bold text-navy dark:text-ice mb-4 flex items-center gap-2">
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
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Photo <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <div className="flex items-center gap-4">
                      {profileImageUrl ? (
                        <img src={profileImageUrl} alt="Your uploaded photo" className="w-16 h-16 rounded-full object-cover border border-gray-300" />
                      ) : (
                        <div className="w-16 h-16 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-[10px] text-gray-400 text-center px-1">
                          No photo
                        </div>
                      )}
                      <label className="inline-flex items-center gap-2 border-2 border-navy dark:border-ice text-navy dark:text-ice font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-ice dark:hover:bg-midnight transition-all cursor-pointer">
                        <Upload size={16} />
                        {imageUploading ? 'Uploading…' : profileImageUrl ? 'Replace Photo' : 'Upload Photo'}
                        <input type="file" accept="image/*" onChange={handleProfileImageChange} disabled={imageUploading} className="hidden" />
                      </label>
                    </div>
                    {imageError && <p className="text-red-500 text-xs mt-1">{imageError}</p>}
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div>
                <h3 className="text-xl font-bold text-navy dark:text-ice mb-4 flex items-center gap-2">
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
                      disabled={vehiclesLoading}
                      value={formData.vehicleModel}
                      onChange={(e) => setFormData({...formData, vehicleModel: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent disabled:opacity-50"
                    >
                      <option value="">
                        {vehiclesLoading ? 'Loading models…' : 'Select your Geely model'}
                      </option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.name}>{vehicle.name}</option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div>
                <h3 className="text-xl font-bold text-navy dark:text-ice mb-4">Overall Rating *</h3>
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
                    <span className="ml-3 text-lg font-semibold text-navy dark:text-ice">
                      {formData.rating}/5 Stars
                    </span>
                  )}
                </div>
              </div>

              {/* Review Content */}
              <div>
                <h3 className="text-xl font-bold text-navy dark:text-ice mb-4 flex items-center gap-2">
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
                    className="flex items-center gap-2 bg-geely-blue text-white px-8 py-4 font-bold hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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