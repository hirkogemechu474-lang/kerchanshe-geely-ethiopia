import rateLimit from 'express-rate-limit';

function getClientIP(req: any): string {
  return req.ip || req.headers['x-forwarded-for']?.toString()?.split(',')[0]?.trim() || 'unknown';
}

export function createRateLimiter(windowMs: number, max: number, message?: string) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: true,
    keyGenerator: (req) => getClientIP(req),
    message: { error: message || 'Too many requests. Please try again later.' },
  });
}

// Predefined rate limiters
export const rateLimiters = {
  login: createRateLimiter(15 * 60 * 1000, 5, 'Too many login attempts. Please try again in 15 minutes.'),
  contactForm: createRateLimiter(5 * 60 * 1000, 3, 'Too many messages sent. Please wait 5 minutes.'),
  leadForm: createRateLimiter(10 * 60 * 1000, 5, 'Too many requests. Please wait 10 minutes.'),
  review: createRateLimiter(30 * 60 * 1000, 3, 'Too many review submissions. Please wait 30 minutes.'),
  partsRequest: createRateLimiter(10 * 60 * 1000, 5, 'Too many parts requests.'),
  csiSurvey: createRateLimiter(10 * 60 * 1000, 5, 'Too many submissions.'),
  serviceCheckIn: createRateLimiter(10 * 60 * 1000, 10, 'Too many check-in attempts.'),
  serviceCheckInLookup: createRateLimiter(10 * 60 * 1000, 60, 'Too many lookups.'),
  showroomVisitStart: createRateLimiter(10 * 60 * 1000, 30, 'Too many visit sessions started.'),
  showroomVisitRegister: createRateLimiter(10 * 60 * 1000, 10, 'Too many attempts.'),
  agreementView: createRateLimiter(10 * 60 * 1000, 30, 'Too many requests.'),
  agreementSign: createRateLimiter(10 * 60 * 1000, 5, 'Too many attempts.'),
  handoverView: createRateLimiter(10 * 60 * 1000, 30, 'Too many requests.'),
  handoverSign: createRateLimiter(10 * 60 * 1000, 5, 'Too many attempts.'),
  testDriveConfirm: createRateLimiter(10 * 60 * 1000, 5, 'Too many attempts.'),
  paymentView: createRateLimiter(10 * 60 * 1000, 30, 'Too many requests.'),
  paymentSubmit: createRateLimiter(10 * 60 * 1000, 5, 'Too many attempts.'),
  quotationView: createRateLimiter(10 * 60 * 1000, 30, 'Too many requests.'),
  quotationSign: createRateLimiter(10 * 60 * 1000, 5, 'Too many attempts.'),
};
