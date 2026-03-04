/**
 * Auth controller - HTTP layer, delegates to authService
 */

const authService = require("../services/authService");

async function signup(req, res) {
  const { firstName, lastName, email, password } = req.body;
  const result = await authService.signup({
    firstName,
    lastName: lastName || null,
    email,
    password,
  });
  res.status(201).json({
    message: "Registration successful. You can now log in.",
    user: result.user,
  });
}

async function login(req, res) {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.status(200).json({
    user: result.user,
    accessToken: result.tokens.accessToken,
    refreshToken: result.tokens.refreshToken,
    expiresIn: result.tokens.expiresIn,
  });
}

async function refresh(req, res) {
  const refreshToken =
    req.body.refreshToken ?? req.cookies?.refreshToken ?? req.headers["x-refresh-token"];
  if (!refreshToken || typeof refreshToken !== "string") {
    res.status(400).json({ error: "Refresh token is required" });
    return;
  }
  const result = await authService.refreshTokens(refreshToken);
  res.status(200).json({
    user: result.user,
    accessToken: result.tokens.accessToken,
    refreshToken: result.tokens.refreshToken,
    expiresIn: result.tokens.expiresIn,
  });
}

async function logout(req, res) {
  const refreshToken =
    req.body.refreshToken ?? req.cookies?.refreshToken ?? req.headers["x-refresh-token"];
  if (refreshToken && typeof refreshToken === "string") {
    await authService.logout(refreshToken);
  }
  res.status(200).json({ message: "Logged out successfully" });
}

async function me(req, res) {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  res.status(200).json({
    userId: req.user.sub,
    email: req.user.email,
    role: req.user.role,
  });
}

async function googleLogin(req, res) {
  const { idToken } = req.body;
  if (!idToken) {
    res.status(400).json({ error: "Google ID token is required" });
    return;
  }
  const result = await authService.googleLogin(idToken);
  res.status(200).json({
    user: result.user,
    accessToken: result.tokens.accessToken,
    refreshToken: result.tokens.refreshToken,
    expiresIn: result.tokens.expiresIn,
  });
}

async function updateProfile(req, res) {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const userId = parseInt(req.user.sub, 10);
  if (!Number.isFinite(userId)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }
  const { firstName, lastName } = req.body ?? {};
  const result = await authService.updateProfile(userId, {
    firstName,
    lastName,
  });
  res.status(200).json({
    user: result.user,
  });
}

module.exports = {
  signup,
  login,
  refresh,
  logout,
  me,
  googleLogin,
  updateProfile,
};
