/**
 * Auth routes - signup, login, refresh, logout, me
 */

const { Router } = require("express");
const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");
const {
  signupValidation,
  loginValidation,
  refreshValidation,
  logoutValidation,
  handleValidation,
} = require("../middleware/validation");
const { normalizeRefreshToken } = require("../middleware/refreshToken");

const router = Router();

router.post(
  "/signup",
  signupValidation,
  handleValidation,
  (req, res, next) => {
    authController.signup(req, res).catch(next);
  }
);

router.post(
  "/login",
  loginValidation,
  handleValidation,
  (req, res, next) => {
    authController.login(req, res).catch(next);
  }
);

router.post(
  "/refresh",
  normalizeRefreshToken,
  refreshValidation,
  handleValidation,
  (req, res, next) => {
    authController.refresh(req, res).catch(next);
  }
);

router.post(
  "/logout",
  normalizeRefreshToken,
  logoutValidation,
  handleValidation,
  (req, res, next) => {
    authController.logout(req, res).catch(next);
  }
);

router.get("/me", requireAuth, (req, res, next) => {
  authController.me(req, res).catch(next);
});

module.exports = router;
