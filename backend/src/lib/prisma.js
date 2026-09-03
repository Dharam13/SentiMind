/**
 * Prisma Client singleton - single instance for the app
 * Prevents multiple connections in dev (hot reload)
 */

const { PrismaClient } = require("@prisma/client");
const { env } = require("../config/env");

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.nodeEnv === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (env.nodeEnv !== "production") {
  globalForPrisma.prisma = prisma;
}

module.exports = { prisma };
