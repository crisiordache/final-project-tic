const Event = require('../models/events');

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.getAll();
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};