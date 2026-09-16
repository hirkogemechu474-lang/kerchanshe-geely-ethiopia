"use client";

import { useState, useEffect } from "react";
import { Star, Shield, Filter } from "lucide-react";
import { motion } from "framer-motion";

interface Testimonial {
  id: string;
  customerName: string;
  vehicleModel: string;
  rating: number;
  comment: string;
  location?: string;
  verified?: boolean;
  createdAt: string;
}

interface TestimonialsSectionProps {
  showFilters?: boolean;
  maxItems?: number;
  vehicleFilter?: string;
}

export default function TestimonialsSection({ 
  showFilters = false, 
  maxItems,
  vehicleFilter 
}: TestimonialsSectionProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number>(0);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const response = await fetch('/api/public/testimonials');
      const data = await response.json();
      setTestimonials(data.testimonials || []);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter testimonials
  let filteredTestimonials = testimonials;

  if (vehicleFilter) {
    filteredTestimonials = filteredTestimonials.filter((t) =>
      t.vehicleModel.toLowerCase().includes(vehicleFilter.toLowerCase())
    );
  }

  if (filterRating > 0) {
    filteredTestimonials = filteredTestimonials.filter((t) => t.rating >= filterRating);
  }

  if (maxItems) {
    filteredTestimonials = filteredTestimonials.slice(0, maxItems);
  }

  const averageRating = testimonials.length > 0
    ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
    : '0.0';

  const ratingCounts = {
    5: testimonials.filter(t => t.rating === 5).length,
    4: testimonials.filter(t => t.rating === 4).length,
    3: testimonials.filter(t => t.rating === 3).length,
    2: testimonials.filter(t => t.rating === 2).length,
    1: testimonials.filter(t => t.rating === 1).length,
  };

  const renderStars = (rating: number, size: "sm" | "md" = "sm") => {
    const starSize = size === "sm" ? 16 : 20;
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={starSize}
            className={`${
              star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading testimonials...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Section Header with Stats */}
      <div className="text-center mb-12">
        <h2 className="disp text-4xl text-navy dark:text-ice font-bold mb-4">
          What Our Customers Say
        </h2>
        <p className="text-steel dark:text-steel-light text-base max-w-2xl mx-auto mb-8">
          Real experiences from Geely owners across Ethiopia. Every review is verified and authentic.
        </p>

        {/* Overall Rating Display */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-8">
          <div className="text-center">
            <div className="text-5xl font-bold text-navy dark:text-ice mb-2">{averageRating}</div>
            <div className="flex items-center gap-2 mb-2">
              {renderStars(Math.round(Number(averageRating)), "md")}
              <span className="text-sm text-steel dark:text-steel-light">({testimonials.length} reviews)</span>
            </div>
            <div className="text-sm text-steel dark:text-steel-light">Average Rating</div>
          </div>

          {/* Rating Breakdown */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm text-steel dark:text-steel-light">{rating}</span>
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{
                      width: `${(ratingCounts[rating as keyof typeof ratingCounts] / testimonials.length) * 100}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm text-steel dark:text-steel-light w-8">
                  {ratingCounts[rating as keyof typeof ratingCounts]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-4 items-center mb-8 p-4 bg-ice dark:bg-midnight rounded-lg">
          <div className="flex items-center gap-2 text-steel dark:text-steel-light text-sm font-semibold">
            <Filter size={18} />
            Filter by:
          </div>
          
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(Number(e.target.value))}
            className="px-3 py-2 border border-line dark:border-midnight-line rounded text-sm"
          >
            <option value={0}>All Ratings</option>
            <option value={5}>5 Stars Only</option>
            <option value={4}>4+ Stars</option>
            <option value={3}>3+ Stars</option>
          </select>

          <div className="text-sm text-steel dark:text-steel-light">
            Showing {filteredTestimonials.length} of {testimonials.length} reviews
          </div>
        </div>
      )}

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTestimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white dark:bg-midnight-surface border border-line dark:border-midnight-line rounded-lg overflow-hidden hover:shadow-lg transition-all"
          >
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-start gap-4 mb-4">
                {/* Avatar */}
                <div className="w-12 h-12 bg-gradient-to-br from-geely-blue to-navy rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {testimonial.customerName?.charAt(0) || '?'}
                </div>

                {/* Customer Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-navy dark:text-ice truncate">{testimonial.customerName || 'Anonymous'}</h4>
                    {testimonial.verified && (
                      <Shield size={16} className="text-green-600 flex-shrink-0" aria-label="Verified Purchase" />
                    )}
                  </div>
                  {testimonial.location && (
                    <div className="text-xs text-steel dark:text-steel-light mb-2">{testimonial.location}</div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    {renderStars(testimonial.rating)}
                    <span className="text-xs text-steel dark:text-steel-light">
                      {new Date(testimonial.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-geely-blue mb-2">
                    {testimonial.vehicleModel}
                  </div>
                </div>
              </div>

              {/* Review Text */}
              <p className="text-sm text-steel dark:text-steel-light leading-relaxed line-clamp-4">
                "{testimonial.comment}"
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* No Results */}
      {filteredTestimonials.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">😔</div>
          <h3 className="text-xl font-bold text-navy dark:text-ice mb-2">No reviews found</h3>
          <p className="text-steel dark:text-steel-light">Try adjusting your filters to see more reviews.</p>
        </div>
      )}

      {/* CTA */}
      {!maxItems && (
        <div className="text-center mt-12">
          <div className="bg-ice dark:bg-midnight p-8 rounded-lg">
            <h3 className="text-2xl font-bold text-navy dark:text-ice mb-3">
              Share Your Geely Experience
            </h3>
            <p className="text-steel dark:text-steel-light mb-6">
              Help other customers by sharing your experience with your Geely vehicle.
            </p>
            <button className="bg-geely-blue text-white font-bold text-sm px-8 py-4 hover:bg-opacity-90 transition-all">
              Write a Review
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
