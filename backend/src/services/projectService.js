/**
 * Project service - Prisma-backed project operations
 */

const { prisma } = require("../lib/prisma");

async function listUserProjects(userId) {
  return prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

async function createProjectForUser(userId, data) {
  return prisma.project.create({
    data: {
      userId,
      primaryKeyword: data.primaryKeyword,
      description: data.description ?? null,
      domain: data.domain,
      status: data.status ?? "ACTIVE",
    },
  });
}

async function getUserProjectById(userId, projectId) {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
  });
}

async function updateUserProject(userId, projectId, updates) {
  const project = await getUserProjectById(userId, projectId);
  if (!project) {
    return null;
  }
  return prisma.project.update({
    where: { id: projectId },
    data: {
      primaryKeyword:
        updates.primaryKeyword !== undefined
          ? updates.primaryKeyword
          : project.primaryKeyword,
      description:
        updates.description !== undefined ? updates.description : project.description,
      domain: updates.domain !== undefined ? updates.domain : project.domain,
      status: updates.status !== undefined ? updates.status : project.status,
    },
  });
}

module.exports = {
  listUserProjects,
  createProjectForUser,
  getUserProjectById,
  updateUserProject,
};

