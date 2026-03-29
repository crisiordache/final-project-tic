const admin = require("../firebaseAdmin");
const Stripe = require("stripe");
const Event = require("../models/events");

const db = admin.firestore();

async function markSeatsAsSold(seatReservationId, bookingId) {
  const resDoc = await db.collection("seat_reservations").doc(seatReservationId).get();
  if (!resDoc.exists) return;
  if (resDoc.data().status === "confirmed") {
    // Check if the actual seat docs are already "sold"
    const { eventId: evId, seats: seatIds } = resDoc.data();
    if (!seatIds || seatIds.length === 0) return;
    const firstSeat = await db.collection("seats").doc(`${evId}_${seatIds[0]}`).get();
    if (firstSeat.exists && firstSeat.data().status === "sold") return; // already done
  }
  const { eventId: evId, seats: seatIds } = resDoc.data();
  if (!seatIds || seatIds.length === 0) return;
  const batch = db.batch();
  for (const seatId of seatIds) {
    batch.set(
      db.collection("seats").doc(`${evId}_${seatId}`),
      { status: "sold", bookingId, confirmedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
  }
  await batch.commit();
  await resDoc.ref.update({ status: "confirmed", bookingId, confirmedAt: admin.firestore.FieldValue.serverTimestamp() });
  console.log(`[SEATS] Marked ${seatIds.length} seats as sold for booking ${bookingId}`);
}

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

function getFrontendBaseUrl() {
  return (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
}

async function createCheckoutSession({ eventId, userId, bookingId, tickets }) {
  const stripe = getStripe();
  const event = await Event.getById(eventId);
  if (!event) throw new Error("Event not found");

  const totalQty = (tickets || []).reduce((s, t) => s + Number(t.quantity || 0), 0);
  if (totalQty < 1) throw new Error("Select at least one ticket");

  const updatedTicketTypes = [...event.ticketTypes];
  let totalCents = 0;
  const lineItems = [];

  for (const ticket of tickets) {
    const qty = Number(ticket.quantity || 0);
    if (qty < 1) continue;
    const idx = updatedTicketTypes.findIndex((t) => t.type === ticket.type);
    if (idx === -1) throw new Error(`Ticket type ${ticket.type} not found`);
    if (updatedTicketTypes[idx].available < qty) {
      throw new Error("Not enough tickets available");
    }
    const unitPrice = Number(updatedTicketTypes[idx].price);
    const unitCents = Math.round(unitPrice * 100);
    if (!Number.isFinite(unitCents) || unitCents < 0) throw new Error("Invalid ticket price");
    totalCents += unitCents * qty;
    lineItems.push({
      price_data: {
        currency: (process.env.STRIPE_CURRENCY || "usd").toLowerCase(),
        product_data: { name: `${event.title} — ${ticket.type}` },
        unit_amount: unitCents
      },
      quantity: qty
    });
  }

  if (totalCents < 50) {
    throw new Error(
      "Order total is below the card minimum ($0.50). Add more tickets or pay with cash at the counter."
    );
  }

  const pendingRef = db.collection("checkout_pending").doc();
  await pendingRef.set({
    eventId: String(eventId),
    userId: String(userId),
    bookingId: String(bookingId),
    tickets,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  const base = getFrontendBaseUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${base}/my-bookings?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/book/${encodeURIComponent(eventId)}`,
    line_items: lineItems,
    metadata: {
      pendingCheckoutId: pendingRef.id
    }
  });

  await pendingRef.update({ stripeSessionId: session.id });
  return { url: session.url, sessionId: session.id };
}

async function finalizeCheckoutSession(session) {
  const sessionId = session.id;
  const processedRef = db.collection("stripe_checkout_sessions").doc(sessionId);
  const processedSnap = await processedRef.get();

  const pendingId = session.metadata?.pendingCheckoutId;
  if (!pendingId) throw new Error("Missing pendingCheckoutId on session");

  const pendingSnap = await db.collection("checkout_pending").doc(pendingId).get();

  // If already fully processed AND no pending doc left, check if seats still need fixing
  if (processedSnap.exists && processedSnap.data()?.status === "completed") {
    // Even if session is processed, seats may still be "reserved" — fix them
    const payload = pendingSnap.exists ? pendingSnap.data() : null;
    const bookingId = payload?.bookingId;
    if (bookingId) {
      const bookingSnap = await db.collection("bookings").doc(bookingId).get();
      const seatReservationId = bookingSnap.exists ? bookingSnap.data().seatReservationId : null;
      if (seatReservationId) {
        await markSeatsAsSold(seatReservationId, bookingId);
      }
    }
    console.log(`[FINALIZE] Session already processed: ${sessionId}`);
    return { alreadyProcessed: true };
  }

  if (!pendingSnap.exists) throw new Error("Checkout payload not found");

  const payload = pendingSnap.data();
  const eventId = payload.eventId;
  const userId = payload.userId;
  const bookingId = payload.bookingId; // Now we have the booking ID from pending
  const tickets = Array.isArray(payload.tickets) ? payload.tickets : [];

  if (!eventId || !userId || !tickets.length) {
    throw new Error("Invalid checkout payload");
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || null;

  if (bookingId) {
    // Update existing pending booking with payment confirmation
    console.log(`[FINALIZE] Updating pending booking: ${bookingId}`);
    const bookingRef = db.collection("bookings").doc(bookingId);
    const bookingSnap = await bookingRef.get();
    
    if (bookingSnap.exists) {
      await bookingRef.update({
        status: "confirmed",
        stripeCheckoutSessionId: sessionId,
        "payment.status": "confirmed",
        "payment.stripeCheckoutSessionId": sessionId,
        "payment.stripePaymentIntentId": paymentIntentId,
        "payment.date": admin.firestore.FieldValue.serverTimestamp()
      });

      // Mark reserved seats as "sold"
      const seatReservationId = bookingSnap.data().seatReservationId;
      if (seatReservationId) {
        await markSeatsAsSold(seatReservationId, bookingId);
      }
      
      await processedRef.set(
        {
          status: "completed",
          completedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );
      
      await db.collection("checkout_pending").doc(pendingId).delete().catch(() => {});
      console.log(`[FINALIZE] Successfully updated booking: ${bookingId}`);
      return { finalized: true };
    }
  }

  // Fallback: if no pending booking found, create one (for backwards compatibility)
  console.log(`[FINALIZE] No pending booking, creating new one for session: ${sessionId}`);
  const bookingRef = db.collection("bookings").doc(sessionId);
  const existingBooking = await bookingRef.get();
  if (existingBooking.exists) {
    await processedRef.set(
      {
        status: "completed",
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
    await db.collection("checkout_pending").doc(pendingId).delete().catch(() => {});
    return { alreadyProcessed: true };
  }

  const eventRef = db.collection("events").doc(eventId);

  await db.runTransaction(async (tx) => {
    const proc = await tx.get(processedRef);
    if (proc.exists && proc.data()?.status === "completed") return;

    const b = await tx.get(bookingRef);
    if (b.exists) return;

    const eventSnap = await tx.get(eventRef);
    if (!eventSnap.exists) throw new Error("Event not found");
    const ev = { id: eventSnap.id, ...eventSnap.data() };

    let totalPrice = 0;
    const updatedTicketTypes = [...ev.ticketTypes];
    const purchasedTickets = [];

    for (const ticket of tickets) {
      const qty = Number(ticket.quantity || 0);
      if (qty < 1) continue;
      const ticketIndex = updatedTicketTypes.findIndex((t) => t.type === ticket.type);
      if (ticketIndex === -1) throw new Error(`Ticket type ${ticket.type} not found`);
      if (updatedTicketTypes[ticketIndex].available < qty) {
        throw new Error("Not enough tickets available");
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

    const bookingPayload = {
      userId,
      bookingId: sessionId,
      stripeCheckoutSessionId: sessionId,
      status: "confirmed",
      eventSnapshot: {
        eventId,
        title: ev.title,
        date: ev.date,
        time: ev.time,
        location: ev.location
      },
      tickets: purchasedTickets,
      totalPrice,
      payment: {
        method: "card",
        status: "confirmed",
        date: admin.firestore.FieldValue.serverTimestamp(),
        stripeCheckoutSessionId: sessionId,
        stripePaymentIntentId: paymentIntentId
      },
      qrCode: `QR_${sessionId}_${userId}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    tx.update(eventRef, { ticketTypes: updatedTicketTypes });
    tx.set(bookingRef, bookingPayload);
    tx.set(
      processedRef,
      {
        status: "completed",
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
  });

  const booked = await bookingRef.get();
  if (!booked.exists) {
    return { alreadyProcessed: true };
  }

  // Confirm seats if any were reserved
  const bookingData = booked.data();
  if (bookingData.seatReservationId) {
    try {
      const seatReservationRef = db.collection("seat_reservations").doc(bookingData.seatReservationId);
      const reservationSnap = await seatReservationRef.get();
      
      if (reservationSnap.exists && reservationSnap.data().status === "reserved") {
        await seatReservationRef.update({
          status: "confirmed",
          bookingId: sessionId,
          confirmedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update seat status to "sold"
        const reservation = reservationSnap.data();
        const batch = db.batch();
        
        for (const seatId of (reservation.seats || [])) {
          const seatRef = db.collection("seats").doc(`${eventId}_${seatId}`);
          batch.update(seatRef, {
            status: "sold",
            bookingId: sessionId,
          });
        }
        
        await batch.commit();
        console.log(`[FINALIZE] Confirmed ${reservation.seats?.length || 0} seats for booking: ${sessionId}`);
      }
    } catch (seatError) {
      console.error(`[FINALIZE] Error confirming seats: ${seatError.message}`);
      // Don't fail the booking if seat confirmation fails
    }
  }

  await db.collection("checkout_pending").doc(pendingId).delete().catch(() => {});
  return { finalized: true };
}

module.exports = {
  createCheckoutSession,
  finalizeCheckoutSession,
  getFrontendBaseUrl
};
