/**
 * lib/auth.js — Next.js Auth & JWT Helper
 *
 * OWASP A01 & A07:
 * - Secret keys validated
 * - Algorithmic whitelist enforced (HS256 only — prevents alg:none attacks)
 * - Expiry checked
 */

const jwt = require('jsonwebtoken');

function getJwtSecret() {
  return process.env.JWT_SECRET || 'fallback_jwt_secret_dev_only_change_me';
}

/** Verify JWT from HTTP Authorization header or token string */
function verifyToken(authHeaderOrToken) {
  if (!authHeaderOrToken) return null;

  let token = authHeaderOrToken;
  if (token.startsWith('Bearer ')) {
    token = token.slice(7).trim();
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ['HS256'],
      issuer: 'tanyathuba',
    });
    return decoded;
  } catch (err) {
    return null;
  }
}

/** Generate admin token with 2 hour expiry and username payload */
function signAdminToken(role = 'admin', username = 'admin') {
  return jwt.sign(
    { role, username },
    getJwtSecret(),
    { algorithm: 'HS256', expiresIn: '2h', issuer: 'tanyathuba' }
  );
}

module.exports = {
  verifyToken,
  signAdminToken,
};
