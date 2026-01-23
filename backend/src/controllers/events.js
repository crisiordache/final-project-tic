const Event = require('../models/events');
const validateEvent = require('../validators/events');

const getEvents = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const events = await Event.getAll(isAdmin);
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getEventById = async (req, res) => {
  const eventId = req.params.id;
  try {
    const event = await Event.getById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createEvent = async (req, res) => {
  const data = req.body;
  const validation = validateEvent(data);
  if (!validation.isValid) {
    return res.status(400).json({ errors: validation.errors });
  }
  try {
    const eventId = await Event.create(data);
    res.status(201).json({ message: 'Event created', eventId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateEvent = async (req, res) => {
  const eventId = req.params.id;
  const data = req.body;
  const validation = validateEvent(data);
  if (!validation.isValid) {
    return res.status(400).json({ errors: validation.errors });
  }
  try {
    await Event.update(eventId, data);
    res.status(200).json({ message: 'Event updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const softDeleteEvent = async (req, res) => {
  const eventId = req.params.id;
  try {
    await Event.softDelete(eventId);
    res.status(200).json({ message: 'Event soft-deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } 
};

const restoreEvent = async (req, res) => {
  const eventId = req.params.id;
  try {
    await Event.restore(eventId);
    res.status(200).json({ message: 'Event restored' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } 
};

const hardDeleteEvent = async (req, res) => {
  const eventId = req.params.id;
  try {
    await Event.hardDelete(eventId);
    res.status(200).json({ message: 'Event permanently deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  softDeleteEvent,
  restoreEvent,
  hardDeleteEvent
};