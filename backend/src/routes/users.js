const express = require("express");
const router = express.Router();
const authController = require("../controllers/users");

router.post("/register", authController.registerUser);
router.post("/login", authController.login);
router.get("/profile", authController.getUserById);

module.exports = router;
