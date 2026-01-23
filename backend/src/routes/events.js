const express = require('express');
const router = express.Router();
const eventController = require('../controllers/events');
const authMiddleware = require('../middleware/auth').authMiddleware;
const isAdmin = require('../middleware/auth').isAdmin;

router.get('/', authMiddleware, eventController.getEvents);
router.get('/:id', eventController.getEventById);
router.post('/', authMiddleware, isAdmin, eventController.createEvent);
router.put('/:id', authMiddleware, isAdmin, eventController.updateEvent);
router.delete('/:id/soft', authMiddleware, isAdmin, eventController.softDeleteEvent);
router.patch('/:id/restore', authMiddleware, isAdmin, eventController.restoreEvent);
router.delete('/:id/hard', authMiddleware, isAdmin, eventController.hardDeleteEvent);

module.exports = router;