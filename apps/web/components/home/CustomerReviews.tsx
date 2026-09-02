'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import Image from 'next/image';
import Button from '@/components/ui/Button';

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

interface CustomerReviewsProps {
  // Fetched server-side (see app/page.tsx) so reviews render on first paint
  // instead of this section returning null until a client fetch resolves.
  initialData: ReviewsData | null;
}

export default function CustomerReviews({ initialData }: CustomerReviewsProps) {
  const data = initialData;
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

  if (!data || data.reviews.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-ice dark:bg-midnight transition-colors">
      <div className="page-container">
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
                        ? 'fill-accent-yellow text-accent-yellow'
                        : 'text-gray-300'
                    }
                  />
                ))}
            </div>
            <span className="text-lg font-bold text-navy dark:text-ice">
              {data.average_rating.toFixed(1)} / 5.0
            </span>
          </div>
          <h2 className="disp text-4xl text-navy dark:text-ice font-bold mb-2">What Our Customers Say</h2>
          <p className="text-steel dark:text-steel-light max-w-2xl mx-auto">
            Join {data.total_reviews}+ satisfied Geely customers who are enjoying their vehicles
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {data.reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white dark:bg-midnight-surface rounded-lg border border-line dark:border-midnight-line p-6 hover:shadow-lg transition-shadow"
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
                          ? 'fill-accent-yellow text-accent-yellow'
                          : 'text-gray-300'
                      }
                    />
                  ))}
              </div>

              {/* Title */}
              <h3 className="font-bold text-navy dark:text-ice mb-2 text-lg">{review.reviewTitle}</h3>

              {/* Message */}
              <p className="text-steel dark:text-steel-light text-sm mb-4 leading-relaxed line-clamp-3">
                {review.reviewMessage}
              </p>

              {/* Customer Info */}
              <div className="flex items-center gap-3 pt-4 border-t">
                {review.profileImage && !brokenImages.has(review.id) ? (
                  <Image
                    src={review.profileImage}
                    alt={review.fullName}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={() =>
                      setBrokenImages((prev) => new Set(prev).add(review.id))
                    }
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-active-blue to-accent-purple flex items-center justify-center text-white font-bold">
                    {review.fullName.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-navy dark:text-ice text-sm">{review.fullName}</p>
                  {review.vehicleModel && (
                    <p className="text-xs text-steel dark:text-steel-light">{review.vehicleModel}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button href="/reviews/submit" variant="solid" size="md">
            Share Your Review
          </Button>
        </div>
      </div>
    </section>
  );
}
