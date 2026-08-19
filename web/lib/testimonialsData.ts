export interface Testimonial {
  id: string;
  name: string;
  location: string;
  vehicle: string;
  rating: number;
  date: string;
  review: string;
  image: string;
  verified: boolean;
  type: "text" | "video";
  videoUrl?: string;
  highlights?: string[];
}

export const testimonials: Testimonial[] = [
  {
    id: "test-1",
    name: "Ahmed Hassan",
    location: "Addis Ababa",
    vehicle: "Geely Coolray",
    rating: 5,
    date: "2026-07-15",
    review: "I've been driving my Coolray for 8 months now and I'm absolutely impressed. The fuel efficiency is excellent for Addis traffic, and the technology features make every drive enjoyable. The panoramic sunroof and spacious interior are perfect for my family.",
    image: "/testimonials/ahmed-hassan.jpg",
    verified: true,
    type: "text",
    highlights: ["Fuel Efficiency", "Technology", "Family-Friendly"],
  },
  {
    id: "test-2",
    name: "Sarah Tekle",
    location: "Bahir Dar",
    vehicle: "Geely Emgrand",
    rating: 5,
    date: "2026-06-28",
    review: "The Emgrand has been a reliable companion for my daily commute and weekend trips to Lake Tana. The service at Bahir Dar showroom was exceptional, and the vehicle has required minimal maintenance. Great value for money!",
    image: "/testimonials/sarah-tekle.jpg",
    verified: true,
    type: "video",
    videoUrl: "/testimonials/sarah-tekle-video.mp4",
    highlights: ["Reliability", "Service Quality", "Value for Money"],
  },
  {
    id: "test-3",
    name: "Dr. Michael Worku",
    location: "Addis Ababa",
    vehicle: "Geely Monjaro",
    rating: 5,
    date: "2026-07-20",
    review: "As a family of 7, the Monjaro's spacious interior and safety features were exactly what we needed. The 360-degree camera system makes parking in tight spaces effortless, and the kids love the entertainment system during long trips.",
    image: "/testimonials/michael-worku.jpg",
    verified: true,
    type: "text",
    highlights: ["Spacious Interior", "Safety Features", "Family Vehicle"],
  },
  {
    id: "test-4",
    name: "Hanan Ali",
    location: "Hawassa",
    vehicle: "Geometry EX5",
    rating: 5,
    date: "2026-07-10",
    review: "Switching to electric with the Geometry EX5 was the best decision I made. The silence, instant acceleration, and savings on fuel costs are incredible. Charging at home is so convenient, and I love contributing to cleaner air in our city.",
    image: "/testimonials/hanan-ali.jpg",
    verified: true,
    type: "video",
    videoUrl: "/testimonials/hanan-ali-video.mp4",
    highlights: ["Electric Experience", "Cost Savings", "Environmental Impact"],
  },
  {
    id: "test-5",
    name: "Getachew Mekuria",
    location: "Mekelle",
    vehicle: "Geely Azkarra",
    rating: 4,
    date: "2026-06-15",
    review: "The Azkarra handles the terrain around Mekelle beautifully. Ground clearance is perfect for our roads, and the build quality feels solid. The after-sales service team is very responsive and professional.",
    image: "/testimonials/getachew-mekuria.jpg",
    verified: true,
    type: "text",
    highlights: ["Build Quality", "Ground Clearance", "After-Sales Service"],
  },
  {
    id: "test-6",
    name: "Zara Ibrahim",
    location: "Addis Ababa",
    vehicle: "Geely Coolray",
    rating: 5,
    date: "2026-07-05",
    review: "I'm a young professional and the Coolray fits my lifestyle perfectly. It's stylish, efficient, and loaded with tech features. The automatic transmission makes city driving stress-free, and I always get compliments on the design.",
    image: "/testimonials/zara-ibrahim.jpg",
    verified: true,
    type: "text",
    highlights: ["Stylish Design", "City Driving", "Technology Features"],
  },
];

export const getTestimonialsByVehicle = (vehicle: string): Testimonial[] => {
  return testimonials.filter((t) => 
    t.vehicle.toLowerCase().includes(vehicle.toLowerCase())
  );
};

export const getTestimonialsByRating = (minRating: number): Testimonial[] => {
  return testimonials.filter((t) => t.rating >= minRating);
};

export const getVideoTestimonials = (): Testimonial[] => {
  return testimonials.filter((t) => t.type === "video");
};

export const getAverageRating = (): number => {
  const total = testimonials.reduce((sum, t) => sum + t.rating, 0);
  return Number((total / testimonials.length).toFixed(1));
};

export const getRatingCounts = () => {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  testimonials.forEach((t) => {
    counts[t.rating as keyof typeof counts]++;
  });
  return counts;
};