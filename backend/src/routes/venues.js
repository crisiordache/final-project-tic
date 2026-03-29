const express = require("express");
const router = express.Router();
const { listVenues } = require("../controllers/venues");

router.get("/", listVenues);

module.exports = router;
