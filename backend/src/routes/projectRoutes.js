/**
 * Project routes - user projects CRUD (authenticated)
 */

const { Router } = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const projectController = require("../controllers/projectController");

const router = Router();

// All project routes require authentication
router.use(requireAuth);

router.get("/", (req, res, next) => {
  projectController.listProjects(req, res).catch(next);
});

router.post("/", (req, res, next) => {
  projectController.createProject(req, res).catch(next);
});

router.get("/:id", (req, res, next) => {
  projectController.getProject(req, res).catch(next);
});

router.patch("/:id", (req, res, next) => {
  projectController.updateProject(req, res).catch(next);
});

module.exports = router;

