const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookings');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', bookingController.createBooking);
router.get('/my', bookingController.getBookingsByUserId);

module.exports = router;