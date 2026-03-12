const { Router } = require("express");
const collectController = require("../controllers/collectController");

const router = Router();

// Middleware to log all requests
router.use((req, res, next) => {
  console.log(`[Collector Routes] ${req.method} ${req.path} - Body received: ${!!req.body}`);
  if (req.body && req.method === "POST") {
    console.log(`[Collector Routes] Body keys:`, Object.keys(req.body));
    console.log(`[Collector Routes] Body preview:`, JSON.stringify(req.body).substring(0, 200));
  }
  next();
});

// Social media
router.get("/reddit", collectController.collectReddit);
router.get("/twitter", collectController.collectTwitter);
router.get("/youtube", collectController.collectYouTube);

// Blogs (Medium via RSS)
router.get("/medium", collectController.collectMedium);

// Social (LinkedIn via Google News RSS)
router.get("/linkedin", collectController.collectLinkedIn);

// News
router.get("/news", collectController.collectNews);

// Aggregated project dashboard data
router.get("/summary", collectController.getProjectSummary);

// Get influencers for a project
router.get("/influencers", collectController.getProjectInfluencers);

// Bulk metrics for multiple projects (optimized for dashboard loading)
router.get("/bulk-metrics", collectController.getBulkProjectMetrics);

// Trigger a run to collect + store mentions for a project
router.post("/run", collectController.runCollection);

module.exports = router;

