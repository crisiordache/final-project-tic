const express = require("express");
const router = express.Router();
const seatsController = require("../controllers/seats");
const authMiddleware = require("../middleware/auth").authMiddleware;

// Get all seats for an event
router.get("/seats/:eventId", authMiddleware, seatsController.getSeats);

// Reserve seats
router.post("/reserve-seats", authMiddleware, seatsController.reserveSeats);

// Confirm seats (after payment)
router.post("/confirm-seats", authMiddleware, seatsController.confirmSeats);

// Release expired reservations
router.post("/release-expired-reservations", seatsController.releaseExpiredReservations);

// Initialize seats for an event
router.post("/initialize-seats", authMiddleware, seatsController.initializeSeats);

module.exports = router;
