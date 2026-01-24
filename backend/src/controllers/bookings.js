const Booking = require('../models/bookings');
const Event = require('../models/events');

const createBooking = async (req, res) => {
  const { eventId, tickets, paymentMethod } = req.body;
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

const getBookingsByUserId = async (req, res) => {
  const userId = req.user?.id;
  try {
    const bookings = await Booking.getByUserId(userId);
    res.status(200).json(bookings)
  } catch(error) {
    res.status(500).json({ error: error.message });
  }

}

module.exports = { createBooking, getBookingsByUserId };