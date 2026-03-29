const Venue = require("../models/venues");

const listVenues = async (req, res) => {
  try {
    const venues = await Venue.getAll();
    res.status(200).json(venues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { listVenues };
