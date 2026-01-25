const express = require("express");
const router = express.Router();
const authController = require("../controllers/users");
const authMiddleware = require("../middleware/auth").authMiddleware;
const isAdmin = require("../middleware/auth").isAdmin;
const requireAuth = require("../middleware/auth").requireAuth;

router.post("/register", authController.registerUser);
router.post("/login", authController.login);
router.get("/profile", authMiddleware, requireAuth, authController.getUserById);
router.get("/", authMiddleware, isAdmin, authController.getAllUsers);
router.patch("/:id/grant-admin", authMiddleware, isAdmin, authController.grantAdminAccess);
router.patch("/:id/revoke-admin", authMiddleware, isAdmin, authController.revokeAdminAccess);

module.exports = router;
