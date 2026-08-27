/**
 * In-Memory Rate Limiter for API Routes
 * 
 * PRODUCTION NOTE:
 * This implementation uses an in-memory Map for rate limiting, which works
 * well for single-instance deployments. For multi-instance/production environments
 * with load balancing, replace the Map with Redis for distributed rate limiting.
 * 
 * Redis Migration:
 * - Replace `rateLimitStore` Map with Redis client
 * - Use Redis INCR with EXPIRE for sliding window
 * - Key format: `rate_limit:{ip}:{route}`
 * - Example: redis.incr(key).then(count => redis.expire(key, windowMs/1000))
 */

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  max: number;       // Maximum requests per window
  message?: string;  // Custom error message
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store: Map<string, RateLimitEntry>
// Key format: "ip:route"
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Clean up expired entries every 5 minutes to prevent memory leaks
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Extract client IP from request headers
 */
function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  // Fallback to 'unknown' if no IP found
  return 'unknown';
}

/**
 * Rate limit middleware for API routes
 * 
 * @param request - The incoming request
 * @param config - Rate limit configuration
 * @returns Response if rate limited, null if allowed
 * 
 * @example
 * ```typescript
 * // In your API route:
 * const rateLimitResult = await rateLimit(request, {
 *   windowMs: 15 * 60 * 1000, // 15 minutes
 *   max: 5, // 5 requests per window
 *   message: 'Too many login attempts'
 * });
 * 
 * if (rateLimitResult) {
 *   return rateLimitResult; // Return 429 response
 * }
 * 
 * // Continue with normal request handling...
 * ```
 */
export async function rateLimit(
  request: Request,
  config: RateLimitConfig
): Promise<Response | null> {
  const ip = getClientIP(request);
  const route = new URL(request.url).pathname;
  const key = `${ip}:${route}`;
  
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetTime < now) {
    // First request or window expired - create new entry
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    });
    return null; // Allow request
  }
  
  if (entry.count >= config.max) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000); // seconds
    
    return new Response(
      JSON.stringify({
        error: config.message || 'Too many requests. Please try again later.',
        retryAfter
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.max.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetTime.toString()
        }
      }
    );
  }
  
  // Increment count and allow request
  entry.count += 1;
  rateLimitStore.set(key, entry);
  
  return null; // Allow request
}

/**
 * Predefined rate limit configurations for common use cases
 */
export const rateLimitConfigs = {
  // Authentication endpoints - strict limits
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many login attempts. Please try again in 15 minutes.'
  },
  
  // Contact/Message forms - prevent spam
  contactForm: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3,
    message: 'Too many messages sent. Please wait 5 minutes before sending another message.'
  },
  
  // Lead generation forms (test drive, quote)
  leadForm: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5,
    message: 'Too many requests. Please wait 10 minutes before submitting again.'
  },
  
  // Review submissions
  review: {
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 3,
    message: 'Too many review submissions. Please wait 30 minutes.'
  },
  
  // Parts requests
  partsRequest: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5,
    message: 'Too many parts requests. Please wait 10 minutes before submitting again.'
  },

  // Post-visit CSI survey submissions
  csiSurvey: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5,
    message: 'Too many submissions. Please wait 10 minutes before trying again.'
  },

  // Service self check-in kiosk
  serviceCheckIn: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10,
    message: 'Too many check-in attempts. Please ask the front desk for assistance.'
  },

  // Live VIN-scan lookup at the kiosk — read-only, called on every
  // scan/keystroke so it needs more headroom than the check-in submission itself.
  serviceCheckInLookup: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 60,
    message: 'Too many lookups. Please ask the front desk for assistance.'
  },

  // Showroom QR walk-in flow — a single static QR scanned by many visitors,
  // possibly over the same showroom WiFi/NAT, so the ceiling needs more
  // headroom than a normal lead form.
  showroomVisitStart: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 30,
    message: 'Too many visit sessions started. Please ask the front desk for assistance.'
  },
  showroomVisitRegister: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10,
    message: 'Too many attempts. Please ask the front desk for assistance.'
  },

  // Public sales-agreement viewing/signing — reached via an emailed link,
  // so the ceiling only needs to guard against abuse of a single link, not
  // shared-network traffic.
  agreementView: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 30,
    message: 'Too many requests. Please try again in a few minutes.'
  },
  agreementSign: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5,
    message: 'Too many attempts. Please try again in a few minutes or contact us.'
  },

  // Public vehicle-handover viewing/signing — same "reached via an emailed
  // link" shape as the agreement routes above.
  handoverView: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 30,
    message: 'Too many requests. Please try again in a few minutes.'
  },
  handoverSign: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5,
    message: 'Too many attempts. Please try again in a few minutes or contact us.'
  },

  // Public order-payment page — same "reached via an emailed link" shape
  // as the agreement routes above.
  paymentView: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 30,
    message: 'Too many requests. Please try again in a few minutes.'
  },
  paymentSubmit: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5,
    message: 'Too many attempts. Please try again in a few minutes or contact us.'
  },

  // Public sales-quotation viewing/signing — same "reached via an emailed
  // link" shape as the agreement routes above.
  quotationView: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 30,
    message: 'Too many requests. Please try again in a few minutes.'
  },
  quotationSign: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5,
    message: 'Too many attempts. Please try again in a few minutes or contact us.'
  }
};

/**
 * Clear rate limit for a specific IP (useful for testing or manual override)
 */
export function clearRateLimit(ip: string, route: string): void {
  const key = `${ip}:${route}`;
  rateLimitStore.delete(key);
}

/**
 * Get current rate limit status for an IP and route
 */
export function getRateLimitStatus(ip: string, route: string): {
  count: number;
  remaining: number;
  resetTime: number;
} | null {
  const key = `${ip}:${route}`;
  const entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetTime < Date.now()) {
    return null;
  }
  
  return {
    count: entry.count,
    remaining: Math.max(0, 5 - entry.count), // Assuming max of 5
    resetTime: entry.resetTime
  };
}
