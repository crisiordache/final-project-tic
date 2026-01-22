const express = require('express');
const router = express.Router();
const eventController = require('../controllers/events');

router.get('/', eventController.getEvents); 

module.exports = router;