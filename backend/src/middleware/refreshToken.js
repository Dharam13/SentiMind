/**
 * Normalize refresh token from body, cookie, or x-refresh-token header into req.body
 */

function normalizeRefreshToken(req, _res, next) {
  if (req.body && req.body.refreshToken) {
    next();
    return;
  }
  const fromCookie =
    typeof req.cookies?.refreshToken === "string" ? req.cookies.refreshToken : null;
  const fromHeader =
    typeof req.headers["x-refresh-token"] === "string"
      ? req.headers["x-refresh-token"]
      : null;
  req.body = req.body || {};
  if (fromCookie) req.body.refreshToken = fromCookie;
  else if (fromHeader) req.body.refreshToken = fromHeader;
  next();
}

module.exports = { normalizeRefreshToken };
