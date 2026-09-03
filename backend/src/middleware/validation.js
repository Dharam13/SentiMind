/**
 * Request validation using express-validator - safe, no sensitive data in errors
 */

const { body, validationResult } = require("express-validator");

const PASSWORD_MIN_LENGTH = 8;
const NAME_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 255;

const signupValidation = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ max: NAME_MAX_LENGTH })
    .withMessage("First name is too long"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ max: NAME_MAX_LENGTH })
    .withMessage("Last name is too long"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail()
    .isLength({ max: EMAIL_MAX_LENGTH })
    .withMessage("Email is too long"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: PASSWORD_MIN_LENGTH })
    .withMessage(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
];

const loginValidation = [
  body("email").trim().notEmpty().withMessage("Email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const refreshValidation = [
  body("refreshToken").notEmpty().withMessage("Refresh token is required"),
];

const logoutValidation = [
  body("refreshToken").optional(),
];

const profileUpdateValidation = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ max: NAME_MAX_LENGTH })
    .withMessage("First name is too long"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ max: NAME_MAX_LENGTH })
    .withMessage("Last name is too long"),
];

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
    return;
  }
  const messages = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  res.status(400).json({ error: "Validation failed", details: messages });
}

module.exports = {
  signupValidation,
  loginValidation,
  refreshValidation,
  logoutValidation,
  profileUpdateValidation,
  handleValidation,
};
