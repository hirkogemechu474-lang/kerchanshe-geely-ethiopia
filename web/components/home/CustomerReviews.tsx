'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import Link from 'next/link';

interface Review {
  id: string;
  fullName: string;
  profileImage: string | null;
  vehicleModel: string;
  rating: number;
  reviewTitle: string;
  reviewMessage: string;
  isFeatured: boolean;
}

interface ReviewsData {
  reviews: Review[];
  average_rating: number;
  total_reviews: number;
}

export default function CustomerReviews() {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews?featured=true&limit=6');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data || data.reviews.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-ice">
      <div className="max-w-[1280px] mx-auto px-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex gap-1">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className={
                      i < Math.round(data.average_rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }
                  />
                ))}
            </div>
            <span className="text-lg font-bold text-navy">
              {data.average_rating.toFixed(1)} / 5.0
            </span>
          </div>
          <h2 className="disp text-4xl text-navy font-bold mb-2">What Our Customers Say</h2>
          <p className="text-steel max-w-2xl mx-auto">
            Join {data.total_reviews}+ satisfied Geely customers who are enjoying their vehicles
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {data.reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-lg border border-line p-6 hover:shadow-lg transition-shadow"
            >
              {/* Rating */}
              <div className="flex gap-1 mb-3">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={
                        i < review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }
                    />
                  ))}
              </div>

              {/* Title */}
              <h3 className="font-bold text-navy mb-2 text-lg">{review.reviewTitle}</h3>

              {/* Message */}
              <p className="text-steel text-sm mb-4 leading-relaxed line-clamp-3">
                {review.reviewMessage}
              </p>

              {/* Customer Info */}
              <div className="flex items-center gap-3 pt-4 border-t">
                {review.profileImage ? (
                  <img
                    src={review.profileImage}
                    alt={review.fullName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
                    {review.fullName.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-navy text-sm">{review.fullName}</p>
                  {review.vehicleModel && (
                    <p className="text-xs text-steel">{review.vehicleModel}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/reviews/submit"
            className="inline-block bg-navy text-white font-bold text-sm px-8 py-3 rounded hover:bg-opacity-90 transition-all"
          >
            Share Your Review
          </Link>
        </div>
      </div>
    </section>
  );
}
