const { Router } = require("express");
const collectController = require("../controllers/collectController");

const router = Router();

// Social media
router.get("/reddit", collectController.collectReddit);
router.get("/twitter", collectController.collectTwitter);
router.get("/youtube", collectController.collectYouTube);

// Blogs
router.get("/tumblr", collectController.collectTumblr);

// Web search (Google Custom Search - replaces WordPress & Blogger)
router.get("/web", collectController.collectWeb);

// News
router.get("/news", collectController.collectNews);

module.exports = router;

