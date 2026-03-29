const express = require("express");
const router = express.Router();
const paymentsController = require("../controllers/payments");
const { authMiddleware, requireAuth } = require("../middleware/auth");

router.post("/create-checkout-session", authMiddleware, requireAuth, paymentsController.createSession);
router.get("/verify-session/:sessionId", paymentsController.verifySession);

module.exports = router;
