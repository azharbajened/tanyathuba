/**
 * lib/security.js — Next.js Security Utilities
 *
 * OWASP Top 10 Coverage:
 * - XSS Prevention via xss library
 * - HMAC-signed stateless Math Captcha
 * - Privacy-preserving IP hashing with HMAC-SHA256 & Pepper
 * - In-memory & DB-backed Rate Limiting
 * - Failed login penalty (5 failed attempts -> 15 min lockout)
 */

const xss = require('xss');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const XSS_OPTIONS = {
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style', 'xml'],
};

/** Strip ALL HTML tags from user input */
function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return xss(str, XSS_OPTIONS).trim();
}

/** Hash IP address with pepper — GDPR / privacy safe */
function hashIpAddress(ip) {
  const salt = process.env.IP_SALT || 'fallback_ip_salt_secret';
  const cleanIp = String(ip || '127.0.0.1').split(',')[0].trim();
  return crypto
    .createHmac('sha256', salt)
    .update(cleanIp || '127.0.0.1')
    .digest('hex');
}

// -------------------------------------------------------------
// Session-Based Identification (NAT-Safe Rate Limiting)
// -------------------------------------------------------------
const SESSION_COOKIE_NAME = 'thuba_sid';

function signSessionId(sessionId) {
  const secret = process.env.JWT_SECRET || process.env.IP_SALT || 'fallback_session_secret';
  const sig = crypto.createHmac('sha256', secret).update(String(sessionId)).digest('hex');
  return `${sessionId}.${sig}`;
}

function verifySignedSessionId(signedValue) {
  if (!signedValue || typeof signedValue !== 'string') return null;
  const parts = signedValue.split('.');
  if (parts.length !== 2) return null;
  const [sessionId, sig] = parts;
  if (!sessionId || !sig) return null;

  const secret = process.env.JWT_SECRET || process.env.IP_SALT || 'fallback_session_secret';
  const expectedSig = crypto.createHmac('sha256', secret).update(sessionId).digest('hex');

  try {
    const a = Buffer.from(sig, 'hex');
    const b = Buffer.from(expectedSig, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    return sessionId;
  } catch {
    return null;
  }
}

/**
 * Retrieve or create a signed per-browser session cookie and return its HMAC hash.
 * Prevents NAT / shared Wi-Fi IP collisions among jamaah.
 */
function getOrCreateSessionHash(cookieStore, options = { setCookie: true }) {
  let sessionId = null;

  if (cookieStore && typeof cookieStore.get === 'function') {
    const existing = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    sessionId = verifySignedSessionId(existing);
  }

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    const signed = signSessionId(sessionId);
    if (options?.setCookie !== false && cookieStore && typeof cookieStore.set === 'function') {
      try {
        cookieStore.set(SESSION_COOKIE_NAME, signed, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: process.env.COOKIE_SECURE === 'true',
          maxAge: 60 * 60 * 6, // 6 jam (mencakup 1 sesi kajian penuh)
        });
      } catch {
        // Ignore if cookieStore is read-only
      }
    }
  }

  const salt = process.env.IP_SALT || 'fallback_ip_salt_secret';
  return crypto
    .createHmac('sha256', salt)
    .update(`session:${sessionId}`)
    .digest('hex');
}

/** Generate a signed math captcha challenge */
function generateCaptcha(options) {
  const a = (options && options.a) || Math.floor(Math.random() * 4) + 1; // 1–4
  const b = (options && options.b) || Math.floor(Math.random() * (5 - a)) + 1; // ensure a+b <= 5
  const answer = a + b;

  const captchaSecret = process.env.CAPTCHA_SECRET || 'fallback_captcha_secret';
  const jwtSecret = process.env.JWT_SECRET || 'fallback_jwt_secret_dev_only_change_me';

  const answerHash = crypto
    .createHmac('sha256', captchaSecret)
    .update(String(answer))
    .digest('hex');

  const token = jwt.sign(
    { h: answerHash },
    jwtSecret,
    { algorithm: 'HS256', expiresIn: '10m', issuer: 'tanyathuba' }
  );

  return {
    question: `Berapa hasil dari: ${a} + ${b} = ?`,
    token,
  };
}

/** Verify submitted math captcha answer against signed JWT token */
function verifyCaptcha(submittedAnswer, token) {
  if (submittedAnswer === undefined || submittedAnswer === null || String(submittedAnswer).trim() === '' || !token) {
    return false;
  }

  const captchaSecret = process.env.CAPTCHA_SECRET || 'fallback_captcha_secret';
  const jwtSecret = process.env.JWT_SECRET || 'fallback_jwt_secret_dev_only_change_me';

  try {
    const decoded = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256'],
      issuer: 'tanyathuba',
    });

    const parsed = parseInt(String(submittedAnswer).trim(), 10);
    if (isNaN(parsed)) return false;

    const submittedHash = crypto
      .createHmac('sha256', captchaSecret)
      .update(String(parsed))
      .digest('hex');

    const expected = Buffer.from(decoded.h, 'hex');
    const submitted = Buffer.from(submittedHash, 'hex');

    if (expected.length !== submitted.length) return false;
    return crypto.timingSafeEqual(expected, submitted);
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// In-Memory Rate Limiter (General)
// -------------------------------------------------------------
const rateLimitMap = new Map();

function checkRateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  const record = rateLimitMap.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + windowMs;
  } else {
    record.count += 1;
  }

  rateLimitMap.set(key, record);

  if (record.count > maxRequests) {
    return false; // Limit exceeded
  }
  return true;
}

// -------------------------------------------------------------
// Failed Login Anti-Bruteforce Rate Limiter
// Rule: 5 failed attempts -> 15 minutes penalty lockout
// -------------------------------------------------------------
const loginFailureMap = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const PENALTY_WINDOW_MS = 15 * 60 * 1000; // 15 menit

function getLoginPenaltyStatus(ipHash) {
  const now = Date.now();
  const record = loginFailureMap.get(ipHash);
  if (!record) return { isLocked: false, attemptsRemaining: MAX_LOGIN_ATTEMPTS };

  // If lockout is active
  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    const remainingMinutes = Math.ceil(remainingSeconds / 60);
    return {
      isLocked: true,
      remainingSeconds,
      remainingMinutes,
      message: `Terlalu banyak percobaan login gagal (5x). Akun terkunci sementara selama 15 menit (sisa waktu: ${remainingMinutes} menit).`,
    };
  }

  // If penalty window has passed, reset
  if (record.lockedUntil && now >= record.lockedUntil) {
    loginFailureMap.delete(ipHash);
    return { isLocked: false, attemptsRemaining: MAX_LOGIN_ATTEMPTS };
  }

  // If attempt window expired without lockout
  if (now > record.resetAt) {
    loginFailureMap.delete(ipHash);
    return { isLocked: false, attemptsRemaining: MAX_LOGIN_ATTEMPTS };
  }

  const remaining = Math.max(0, MAX_LOGIN_ATTEMPTS - record.failCount);
  return { isLocked: false, attemptsRemaining: remaining };
}

function recordFailedLogin(ipHash) {
  const now = Date.now();
  let record = loginFailureMap.get(ipHash);

  if (!record || now > record.resetAt) {
    record = {
      failCount: 1,
      resetAt: now + PENALTY_WINDOW_MS,
      lockedUntil: null,
    };
  } else {
    record.failCount += 1;
  }

  if (record.failCount >= MAX_LOGIN_ATTEMPTS) {
    record.lockedUntil = now + PENALTY_WINDOW_MS;
    loginFailureMap.set(ipHash, record);
    return {
      isLocked: true,
      remainingMinutes: 15,
      message: 'Anda telah 5x gagal login. Akses dikunci penalti selama 15 menit.',
    };
  }

  loginFailureMap.set(ipHash, record);
  const remaining = MAX_LOGIN_ATTEMPTS - record.failCount;
  return {
    isLocked: false,
    attemptsRemaining: remaining,
    message: `Username atau password salah. Sisa kesempatan: ${remaining}x sebelum penalti 15 menit.`,
  };
}

function clearFailedLogin(ipHash) {
  loginFailureMap.delete(ipHash);
}

module.exports = {
  sanitizeText,
  hashIpAddress,
  getOrCreateSessionHash,
  generateCaptcha,
  verifyCaptcha,
  checkRateLimit,
  getLoginPenaltyStatus,
  recordFailedLogin,
  clearFailedLogin,
};
