const { Router } = require("express");
const collectController = require("../controllers/collectController");

const router = Router();

// Social media
router.get("/reddit", collectController.collectReddit);
router.get("/twitter", collectController.collectTwitter);
router.get("/youtube", collectController.collectYouTube);

// Blogs
router.get("/tumblr", collectController.collectTumblr);

// News
router.get("/news", collectController.collectNews);

// Aggregated project dashboard data
router.get("/summary", collectController.getProjectSummary);

// Trigger a run to collect + store mentions for a project
router.post("/run", collectController.runCollection);

module.exports = router;

