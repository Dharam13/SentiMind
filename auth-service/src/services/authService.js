/**
 * Auth service - signup, login, refresh, logout, Google OAuth
 * Orchestrates user + token services; no auto-login on signup
 */

const bcrypt = require("bcrypt");
const { OAuth2Client } = require("google-auth-library");
const { env } = require("../config/env");
const userService = require("./userService");
const tokenService = require("./tokenService");

const googleClient = new OAuth2Client(env.googleClientId);

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
  if (!user.password) {
    throw new AuthError(
      "This account uses Google login. Please sign in with Google.",
      "GOOGLE_ACCOUNT"
    );
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

async function googleLogin(idToken) {
  // Verify the Google ID token
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.googleClientId,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new AuthError("Invalid Google token", "INVALID_GOOGLE_TOKEN");
  }

  const { sub: googleId, email, given_name, family_name, picture } = payload;

  // Try to find existing user by Google ID, then by email
  let user = await userService.findByGoogleId(googleId);
  if (!user) {
    user = await userService.findByEmail(email);
    if (user) {
      // Link existing email account to Google
      const { prisma } = require("../lib/prisma");
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId },
      });
    } else {
      // Create brand-new Google user
      user = await userService.createGoogleUser({
        googleId,
        email,
        firstName: given_name || email.split("@")[0],
        lastName: family_name || null,
      });
    }
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

async function updateProfile(userId, data) {
  const user = await userService.updateProfile(userId, {
    firstName: data.firstName,
    lastName: data.lastName ?? null,
  });
  return { user: userService.sanitizeUser(user) };
}

module.exports = {
  AuthError,
  signup,
  login,
  googleLogin,
  refreshTokens,
  logout,
  updateProfile,
};
