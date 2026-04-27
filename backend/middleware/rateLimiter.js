/**
 * Simple in-memory rate limiter (no external dependency needed).
 * For production, swap with express-rate-limit + Redis.
 */

const rateLimiter = ({
  maxRequests = 100,
  windowMs = 15 * 60 * 1000,
  keyGenerator,
  skip,
} = {}) => {
  const requests = new Map();

  const getKey = (req) => {
    if (typeof keyGenerator === 'function') return keyGenerator(req);
    return req.ip || req.connection?.remoteAddress || 'unknown';
  };

  const shouldSkip = (req) => {
    if (req.method === 'OPTIONS') return true;
    if (typeof skip === 'function') return !!skip(req);
    return false;
  };

  // Periodically clean up old entries to avoid memory leak
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, data] of requests.entries()) {
      if (now - data.windowStart > windowMs) {
        requests.delete(key);
      }
    }
  }, windowMs);
  if (typeof cleanupInterval.unref === 'function') cleanupInterval.unref();

  return (req, res, next) => {
    if (shouldSkip(req)) return next();

    const key = getKey(req);
    const now = Date.now();

    if (!requests.has(key)) {
      requests.set(key, { count: 1, windowStart: now });
      return next();
    }

    const data = requests.get(key);

    // Reset window if expired
    if (now - data.windowStart > windowMs) {
      requests.set(key, { count: 1, windowStart: now });
      return next();
    }

    data.count += 1;

    if (data.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((data.windowStart + windowMs - now) / 1000),
      });
    }

    next();
  };
};

// Stricter limiter for auth routes
const authLimiter = rateLimiter({
  maxRequests: 20,
  windowMs: 15 * 60 * 1000,
  // Limit login attempts per IP + email, so multiple demo accounts don't block each other.
  keyGenerator: (req) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const email = (req.body?.email || '').toString().trim().toLowerCase();
    return email ? `${ip}|login|${email}` : `${ip}|login`;
  },
});

const apiLimiter = rateLimiter({
  maxRequests: 200,
  windowMs: 15 * 60 * 1000,
});

module.exports = { rateLimiter, authLimiter, apiLimiter };
