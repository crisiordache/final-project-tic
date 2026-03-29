const Booking = require('../models/bookings');
const Event = require('../models/events');
const admin = require('../firebaseAdmin');
const db = admin.firestore();

const createBooking = async (req, res) => {
  const { eventId, tickets, paymentMethod } = req.body;
  const userId = req.user?.id;

  try {
    if (paymentMethod === "card") {
      return res.status(400).json({
        error: "Card payments use Stripe Checkout. Choose card and use Complete Purchase, or pay with cash here."
      });
    }

    const event = await Event.getById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    let totalPrice = 0;
    const updatedTicketTypes = [...event.ticketTypes];
    const purchasedTickets = [];

    for (const ticket of tickets) {
      const ticketIndex = updatedTicketTypes.findIndex(t => t.type === ticket.type);
      
      if (ticketIndex === -1) {
        return res.status(404).json({ error: `Ticket type ${ticket.type} not found` });
      }

      if (updatedTicketTypes[ticketIndex].available < ticket.quantity) {
        return res.status(400).json({ error: "There are not enough tickets available" });
      }

      const currentPrice = updatedTicketTypes[ticketIndex].price;
      
      totalPrice += ticket.quantity * currentPrice;
      updatedTicketTypes[ticketIndex].available -= ticket.quantity;

      purchasedTickets.push({
        type: ticket.type,
        quantity: ticket.quantity,
        priceAtPurchase: currentPrice
      });
    }

    await Event.update(eventId, { ticketTypes: updatedTicketTypes });

    const bookingPayload = {
      userId,
      eventSnapshot: {
        eventId,
        title: event.title,
        date: event.date,
        time: event.time,
        location: event.location
      },
      tickets: purchasedTickets,
      totalPrice,
      payment: {
        method: paymentMethod
      }
    };

    const booking = await Booking.create(bookingPayload);

    res.status(201).json({
      message: paymentMethod === 'card' ? 'Confirmed purchase' : "Booking confirmed with cash payment",
      booking
    });
  } catch (error) {
    console.error("Booking Error:", error);
    res.status(500).json({ error: "Booking processing error" });
  }
};

const createPendingBooking = async (req, res) => {
  const { eventId, tickets, seatReservationId } = req.body;
  const userId = req.user?.id;

  try {
    const event = await Event.getById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    let totalPrice = 0;
    const updatedTicketTypes = [...event.ticketTypes];
    const purchasedTickets = [];

    for (const ticket of tickets) {
      const qty = Number(ticket.quantity || 0);
      if (qty < 1) continue;
      
      const ticketIndex = updatedTicketTypes.findIndex(t => t.type === ticket.type);
      if (ticketIndex === -1) {
        return res.status(400).json({ error: `Ticket type ${ticket.type} not found` });
      }

      if (updatedTicketTypes[ticketIndex].available < qty) {
        return res.status(400).json({ error: "Not enough tickets available" });
      }

      const currentPrice = updatedTicketTypes[ticketIndex].price;
      totalPrice += qty * currentPrice;
      updatedTicketTypes[ticketIndex].available -= qty;

      purchasedTickets.push({
        type: ticket.type,
        quantity: qty,
        priceAtPurchase: currentPrice
      });
    }

    if (!purchasedTickets.length) {
      return res.status(400).json({ error: "No valid tickets selected" });
    }

    // Update event ticket availability
    await Event.update(eventId, { ticketTypes: updatedTicketTypes });

    // Generate a booking ID
    const bookingId = db.collection("bookings").doc().id;
    const qrCode = `QR_${bookingId}_${userId}`;

    const bookingPayload = {
      bookingId,
      userId,
      stripeCheckoutSessionId: null, // Will be filled when payment completes
      status: "pending_payment",
      eventSnapshot: {
        eventId,
        title: event.title,
        date: event.date,
        time: event.time,
        location: event.location
      },
      tickets: purchasedTickets,
      totalPrice,
      payment: {
        method: "card",
        status: "pending",
        date: admin.firestore.FieldValue.serverTimestamp()
      },
      qrCode,
      seatReservationId: seatReservationId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save the booking
    await db.collection("bookings").doc(bookingId).set(bookingPayload);

    res.status(201).json({
      message: "Booking created, awaiting payment confirmation",
      bookingId,
      booking: bookingPayload
    });
  } catch (error) {
    console.error("Create pending booking error:", error);
    res.status(500).json({ error: error.message || "Booking processing error" });
  }
};

const getBookingsByUserId = async (req, res) => {
  const userId = req.user?.id;
  try {
    const bookings = await Booking.getByUserId(userId);
    res.status(200).json(bookings)
  } catch(error) {
    res.status(500).json({ error: error.message });
  }

}

module.exports = { createBooking, createPendingBooking, getBookingsByUserId };