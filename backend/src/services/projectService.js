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
  const project = await prisma.project.create({
    data: {
      userId,
      primaryKeyword: data.primaryKeyword,
      description: data.description ?? null,
      domain: data.domain,
      status: data.status ?? "ACTIVE",
    },
  });

  // Ensure any orphaned/stale test documents in MongoDB are cleared so project starts completely fresh
  try {
    const { Mention } = require("../models/Mention");
    const { Signal } = require("../models/Signal");
    const { Campaign } = require("../models/Campaign");
    const { AgentAction } = require("../models/AgentAction");

    await Promise.allSettled([
      Mention.deleteMany({ projectId: project.id }),
      Signal.deleteMany({ projectId: project.id }),
      Campaign.deleteMany({ projectId: project.id }),
      AgentAction.deleteMany({ projectId: project.id }),
    ]);
  } catch (_e) {
    // Best-effort MongoDB cleanup
  }

  return project;
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

async function deleteUserProject(userId, projectId) {
  const project = await getUserProjectById(userId, projectId);
  if (!project) {
    return null;
  }
  const deleted = await prisma.project.delete({
    where: { id: projectId },
  });

  // Clean up associated mentions, signals, campaigns, and actions in MongoDB Atlas
  try {
    const { Mention } = require("../models/Mention");
    const { Signal } = require("../models/Signal");
    const { Campaign } = require("../models/Campaign");
    const { AgentAction } = require("../models/AgentAction");

    await Promise.allSettled([
      Mention.deleteMany({ projectId }),
      Signal.deleteMany({ projectId }),
      Campaign.deleteMany({ projectId }),
      AgentAction.deleteMany({ projectId }),
    ]);
  } catch (_e) {
    // MongoDB cleanup is best effort
  }

  return deleted;
}

module.exports = {
  listUserProjects,
  createProjectForUser,
  getUserProjectById,
  updateUserProject,
  deleteUserProject,
};

