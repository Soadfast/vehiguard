/**
 * Simple in-memory rate limiter for login attempts.
 * Resets after block window expires.
 * For production, replace with Redis-backed store.
 */
const attempts = new Map(); // key: ip -> { count, blockedUntil }

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_MS = 15 * 60 * 1000;  // 15 min block

function loginRateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = attempts.get(ip);

  if (entry) {
    // Currently blocked
    if (entry.blockedUntil && now < entry.blockedUntil) {
      const remaining = Math.ceil((entry.blockedUntil - now) / 1000 / 60);
      return res.status(429).json({
        error: `Demasiados intentos fallidos. Intente nuevamente en ${remaining} minuto(s).`
      });
    }

    // Window expired — reset
    if (now - entry.firstAttempt > WINDOW_MS) {
      attempts.delete(ip);
    }
  }

  next();
}

function recordFailedAttempt(ip) {
  const now = Date.now();
  const entry = attempts.get(ip) || { count: 0, firstAttempt: now, blockedUntil: null };

  // Reset window if expired
  if (now - entry.firstAttempt > WINDOW_MS) {
    entry.count = 0;
    entry.firstAttempt = now;
    entry.blockedUntil = null;
  }

  entry.count += 1;

  if (entry.count >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_MS;
  }

  attempts.set(ip, entry);
}

function clearAttempts(ip) {
  attempts.delete(ip);
}

module.exports = { loginRateLimiter, recordFailedAttempt, clearAttempts };
