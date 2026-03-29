const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookings');
const authMiddleware = require('../middleware/auth').authMiddleware;
const requireAuth = require('../middleware/auth').requireAuth;

router.use(authMiddleware);
router.use(requireAuth);

router.post('/', bookingController.createBooking);
router.post('/pending', bookingController.createPendingBooking);
router.get('/my', bookingController.getBookingsByUserId);

module.exports = router;