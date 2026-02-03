/**
 * Token service - JWT access tokens + persisted refresh tokens with rotation
 */

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { prisma } = require("../lib/prisma");
const { env } = require("../config/env");

const REFRESH_TOKEN_BYTES = 32;

function generateAccessToken(user) {
  const payload = {
    sub: String(user.id),
    email: user.email,
    role: user.role,
    type: "access",
  };
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.accessExpiresIn,
  });
}

function getAccessTokenExpiresInSeconds() {
  const match = env.jwt.accessExpiresIn.match(/^(\d+)([smh])$/);
  if (!match) return 15 * 60;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = { s: 1, m: 60, h: 3600 };
  return value * (multipliers[unit] ?? 60);
}

function verifyAccessToken(token) {
  const decoded = jwt.verify(token, env.jwt.secret);
  if (decoded.type !== "access") {
    throw new Error("Invalid token type");
  }
  return decoded;
}

function generateRefreshTokenValue() {
  return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString("hex");
}

function refreshTokenExpiresAt() {
  const d = new Date();
  d.setDate(d.getDate() + env.refreshTokenExpiryDays);
  return d;
}

async function createRefreshToken(userId) {
  const refreshToken = generateRefreshTokenValue();
  const expiresAt = refreshTokenExpiresAt();
  await prisma.session.create({
    data: {
      userId,
      refreshToken,
      expiresAt,
    },
  });
  return { refreshToken, expiresAt };
}

async function rotateRefreshToken(oldRefreshToken, userId) {
  await prisma.session.deleteMany({
    where: { refreshToken: oldRefreshToken },
  });
  return createRefreshToken(userId);
}

async function findSessionByRefreshToken(refreshToken) {
  const session = await prisma.session.findUnique({
    where: { refreshToken },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }
  return { userId: session.userId, expiresAt: session.expiresAt };
}

async function invalidateRefreshToken(refreshToken) {
  await prisma.session.deleteMany({
    where: { refreshToken },
  });
}

async function buildAuthTokens(user) {
  const accessToken = generateAccessToken(user);
  const { refreshToken } = await createRefreshToken(user.id);
  return {
    accessToken,
    refreshToken,
    expiresIn: getAccessTokenExpiresInSeconds(),
  };
}

module.exports = {
  generateAccessToken,
  getAccessTokenExpiresInSeconds,
  verifyAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  findSessionByRefreshToken,
  invalidateRefreshToken,
  buildAuthTokens,
};
