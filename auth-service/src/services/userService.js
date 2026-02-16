/**
 * User service - Prisma-backed user operations
 */

const { prisma } = require("../lib/prisma");

async function createUser(data) {
  return prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName ?? null,
      email: data.email.toLowerCase().trim(),
      password: data.passwordHash,
      role: data.role ?? "USER",
    },
  });
}

async function findByEmail(email) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
}

async function findById(id) {
  return prisma.user.findUnique({
    where: { id },
  });
}

async function updateProfile(id, data) {
  return prisma.user.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName ?? null,
    },
  });
}

function sanitizeUser(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    isVerified: user.isVerified,
    role: user.role,
    createdAt: user.createdAt,
  };
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  updateProfile,
  sanitizeUser,
};
