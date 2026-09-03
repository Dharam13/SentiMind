/**
 * Protect routes with JWT - attach user payload to request
 */

const tokenService = require("../services/tokenService");

function getBearerToken(req) {
  const auth = req.headers.authorization;
  if (!auth || typeof auth !== "string" || !auth.startsWith("Bearer ")) {
    return null;
  }
  return auth.slice(7).trim() || null;
}

function requireAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    req.user = tokenService.verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

function optionalAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    next();
    return;
  }
  try {
    req.user = tokenService.verifyAccessToken(token);
  } catch {
    // ignore invalid token
  }
  next();
}

module.exports = {
  getBearerToken,
  requireAuth,
  optionalAuth,
};
