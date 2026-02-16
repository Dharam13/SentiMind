/**
 * Project controller - HTTP layer for user projects
 */

const projectService = require("../services/projectService");

function getUserIdFromRequest(req) {
  const sub = req.user?.sub;
  const id = sub ? parseInt(sub, 10) : NaN;
  if (!Number.isFinite(id)) {
    throw new Error("Invalid user id in token");
  }
  return id;
}

async function listProjects(req, res) {
  const userId = getUserIdFromRequest(req);
  const projects = await projectService.listUserProjects(userId);
  res.status(200).json({ projects });
}

async function createProject(req, res) {
  const userId = getUserIdFromRequest(req);
  const { primaryKeyword, description, domain, status } = req.body ?? {};

  if (!primaryKeyword || typeof primaryKeyword !== "string") {
    res.status(400).json({ error: "primaryKeyword is required" });
    return;
  }
  if (!domain || typeof domain !== "string") {
    res.status(400).json({ error: "domain is required" });
    return;
  }

  const project = await projectService.createProjectForUser(userId, {
    primaryKeyword: primaryKeyword.trim(),
    description: typeof description === "string" ? description.trim() : null,
    domain: domain.trim(),
    status,
  });

  res.status(201).json({ project });
}

async function getProject(req, res) {
  const userId = getUserIdFromRequest(req);
  const projectId = parseInt(req.params.id, 10);
  if (!Number.isFinite(projectId)) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }
  const project = await projectService.getUserProjectById(userId, projectId);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.status(200).json({ project });
}

async function updateProject(req, res) {
  const userId = getUserIdFromRequest(req);
  const projectId = parseInt(req.params.id, 10);
  if (!Number.isFinite(projectId)) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }

  const { primaryKeyword, description, domain, status } = req.body ?? {};
  const allowedStatus = status === "ACTIVE" || status === "INACTIVE" ? status : undefined;

  const updated = await projectService.updateUserProject(userId, projectId, {
    primaryKeyword:
      typeof primaryKeyword === "string" && primaryKeyword.trim().length > 0
        ? primaryKeyword.trim()
        : undefined,
    description:
      typeof description === "string"
        ? description.trim()
        : description === null
          ? null
          : undefined,
    domain:
      typeof domain === "string" && domain.trim().length > 0 ? domain.trim() : undefined,
    status: allowedStatus,
  });

  if (!updated) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.status(200).json({ project: updated });
}

module.exports = {
  listProjects,
  createProject,
  getProject,
  updateProject,
};

