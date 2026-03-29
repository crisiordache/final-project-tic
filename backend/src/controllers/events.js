const Event = require('../models/events');
const validateEvent = require('../validators/events');
const admin = require('../firebaseAdmin');
const db = admin.firestore();

const getEvents = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const { limit, lastDocId } = req.query;
    const events = await Event.getAll(isAdmin, parseInt(limit) || 6, lastDocId || null);
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
  if(data.date) {
    data.date = new Date(data.date);
  }
  const validation = validateEvent(data);
  if (!validation.isValid) {
    return res.status(400).json({ errors: validation.errors });
  }
  try {
    const eventId = await Event.create(data);
    
    // Initialize seats if event has assigned seating
    if (data.hasSeating) {
      try {
        const venueRows = data.venueRows || 12;
        const seatsPerRow = data.venueSeatsPerRow || 15;
        const ticketTypes = data.ticketTypes || [];
        
        const batch = db.batch();
        let seatCount = 0;
        
        const SEAT_GAP_X = 34;
        const SEAT_GAP_Y = 34;
        const PADDING_LEFT = 50;
        const PADDING_TOP = 70;
        const SEAT_RADIUS = 12;
        
        for (let row = 1; row <= venueRows; row++) {
          let ticketType = "Standard";
          const match = ticketTypes.find(t => t.rows && t.rows.includes(row));
          if (match) ticketType = match.type;
          
          for (let seat = 1; seat <= seatsPerRow; seat++) {
            const seatId = `${String.fromCharCode(64 + row)}${seat}`;
            const seatRef = db.collection("seats").doc(`${eventId}_${seatId}`);
            
            batch.set(seatRef, {
              eventId,
              seatId,
              row,
              col: seat,
              x: PADDING_LEFT + (seat - 1) * SEAT_GAP_X + SEAT_RADIUS,
              y: PADDING_TOP + (row - 1) * SEAT_GAP_Y + SEAT_RADIUS,
              ticketType,
              status: "available",
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            seatCount++;
          }
        }
        
        await batch.commit();
        console.log(`[EVENTS] Initialized ${seatCount} seats for event ${eventId}`);
      } catch (seatError) {
        console.error(`[EVENTS] Error initializing seats: ${seatError.message}`);
      }
    }
    
    res.status(201).json({ message: 'Event created', eventId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateEvent = async (req, res) => {
  const eventId = req.params.id;
  const data = req.body;
  if(data.date) {
    data.date = new Date(data.date);
  }
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