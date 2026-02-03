/**
 * Auth service - signup, login, refresh, logout
 * Orchestrates user + token services; no auto-login on signup
 */

const bcrypt = require("bcrypt");
const { env } = require("../config/env");
const userService = require("./userService");
const tokenService = require("./tokenService");

class AuthError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}

async function signup(data) {
  const existing = await userService.findByEmail(data.email);
  if (existing) {
    throw new AuthError("An account with this email already exists", "USER_EXISTS");
  }
  const passwordHash = await bcrypt.hash(data.password, env.bcryptRounds);
  const user = await userService.createUser({
    firstName: data.firstName,
    lastName: data.lastName ?? null,
    email: data.email,
    passwordHash,
  });
  return { user: userService.sanitizeUser(user) };
}

async function login(email, password) {
  const user = await userService.findByEmail(email);
  if (!user) {
    throw new AuthError("Invalid email or password", "INVALID_CREDENTIALS");
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new AuthError("Invalid email or password", "INVALID_CREDENTIALS");
  }
  const tokens = await tokenService.buildAuthTokens(user);
  return {
    user: userService.sanitizeUser(user),
    tokens,
  };
}

async function refreshTokens(refreshToken) {
  const session = await tokenService.findSessionByRefreshToken(refreshToken);
  if (!session) {
    throw new AuthError("Invalid or expired refresh token", "TOKEN_INVALID");
  }
  const user = await userService.findById(session.userId);
  if (!user) {
    throw new AuthError("User not found", "TOKEN_INVALID");
  }
  const { refreshToken: newRefreshToken } =
    await tokenService.rotateRefreshToken(refreshToken, user.id);
  const accessToken = tokenService.generateAccessToken(user);
  return {
    user: userService.sanitizeUser(user),
    tokens: {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: tokenService.getAccessTokenExpiresInSeconds(),
    },
  };
}

async function logout(refreshToken) {
  await tokenService.invalidateRefreshToken(refreshToken);
}

module.exports = {
  AuthError,
  signup,
  login,
  refreshTokens,
  logout,
};
