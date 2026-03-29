const admin = require("../firebaseAdmin");
const db = admin.firestore();

/**
 * Get all seats for an event
 * GET /api/bookings/seats/:eventId
 */
exports.getSeats = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Auto-release expired reservations for this event before returning seats
    try {
      const now = new Date();
      const expiredSnap = await db.collection("seat_reservations")
        .where("eventId", "==", eventId)
        .where("expiresAt", "<=", now)
        .where("status", "==", "reserved")
        .get();

      if (!expiredSnap.empty) {
        const batch = db.batch();
        for (const doc of expiredSnap.docs) {
          const reservation = doc.data();
          batch.update(doc.ref, { status: "expired" });
          for (const seatId of reservation.seats) {
            const seatRef = db.collection("seats").doc(`${eventId}_${seatId}`);
            // Only release if the seat is still "reserved" — never overwrite "sold"
            const seatDoc = await seatRef.get();
            if (seatDoc.exists && seatDoc.data().status === "reserved") {
              batch.set(
                seatRef,
                { status: "available", reservationId: null, reservedBy: null },
                { merge: true }
              );
            }
          }
        }
        await batch.commit();
        console.log(`[SEATS] Released ${expiredSnap.size} expired reservations for event ${eventId}`);
      }
    } catch (cleanupErr) {
      console.error("[SEATS] Cleanup error (non-fatal):", cleanupErr.message);
    }

    const seatsSnapshot = await db
      .collection("seats")
      .where("eventId", "==", eventId)
      .get();

    const seats = [];
    seatsSnapshot.forEach((doc) => {
      seats.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({ seats });
  } catch (error) {
    console.error("[SEATS] Error getting seats:", error);
    res.status(500).json({ error: "Failed to fetch seats" });
  }
};

/**
 * Reserve seats for a user (10 minute TTL)
 * POST /api/bookings/reserve-seats
 */
exports.reserveSeats = async (req, res) => {
  try {
    const { eventId, seats } = req.body;
    const userId = req.user.id;

    if (!eventId || !seats || seats.length === 0) {
      return res.status(400).json({ error: "Invalid event or seats" });
    }

    // Create a reservation document with TTL
    const reservationId = `${userId}_${Date.now()}`;
    const reservationRef = db.collection("seat_reservations").doc(reservationId);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

    await reservationRef.set({
      userId,
      eventId,
      seats,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: expiresAt,
      status: "reserved" // reserved, confirmed, expired
    });

    // Update seat status to "reserved"
    const batch = db.batch();
    for (const seatId of seats) {
      const seatRef = db.collection("seats").doc(`${eventId}_${seatId}`);
      batch.set(
        seatRef,
        {
          eventId,
          seatId,
          status: "reserved",
          reservationId,
          reservedBy: userId,
          reservedAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: expiresAt
        },
        { merge: true }
      );
    }
    await batch.commit();

    res.json({ reservationId });
  } catch (error) {
    console.error("[SEATS] Error reserving seats:", error);
    res.status(500).json({ error: "Failed to reserve seats" });
  }
};

/**
 * Confirm seats after payment
 * POST /api/bookings/confirm-seats
 */
exports.confirmSeats = async (req, res) => {
  try {
    const { reservationId, bookingId } = req.body;
    const userId = req.user.id;

    if (!reservationId || !bookingId) {
      return res.status(400).json({ error: "Invalid reservation or booking" });
    }

    // Get the reservation
    const reservationRef = db.collection("seat_reservations").doc(reservationId);
    const reservationDoc = await reservationRef.get();

    if (!reservationDoc.exists || reservationDoc.data().userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { eventId, seats } = reservationDoc.data();

    // Update reservation status
    await reservationRef.update({
      status: "confirmed",
      bookingId,
      confirmedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update seat status to "sold" and link to booking
    const batch = db.batch();
    for (const seatId of seats) {
      const seatRef = db.collection("seats").doc(`${eventId}_${seatId}`);
      batch.set(
        seatRef,
        {
          status: "sold",
          bookingId,
          confirmedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );
    }
    await batch.commit();

    res.json({ success: true });
  } catch (error) {
    console.error("[SEATS] Error confirming seats:", error);
    res.status(500).json({ error: "Failed to confirm seats" });
  }
};

/**
 * Release expired reservations
 * POST /api/bookings/release-expired-reservations
 */
exports.releaseExpiredReservations = async (req, res) => {
  try {
    const now = new Date();

    // Find all expired reservations
    const expiredSnapshot = await db
      .collection("seat_reservations")
      .where("expiresAt", "<=", now)
      .where("status", "==", "reserved")
      .get();

    const batch = db.batch();
    let count = 0;

    expiredSnapshot.forEach((doc) => {
      const reservation = doc.data();
      batch.update(doc.ref, { status: "expired" });

      // Release the seats
      for (const seatId of reservation.seats) {
        const seatRef = db.collection("seats").doc(`${reservation.eventId}_${seatId}`);
        batch.set(
          seatRef,
          {
            status: "available",
            reservationId: null,
            reservedBy: null
          },
          { merge: true }
        );
      }

      count++;
    });

    await batch.commit();

    res.json({ success: true, releasedCount: count });
  } catch (error) {
    console.error("[SEATS] Error releasing expired reservations:", error);
    res.status(500).json({ error: "Failed to release expired reservations" });
  }
};

/**
 * Initialize seats for an event (call once when event is created)
 * POST /api/bookings/initialize-seats
 */
exports.initializeSeats = async (req, res) => {
  try {
    const { eventId, venueRows, venueSeatsPerRow, ticketTypes } = req.body;

    if (!eventId || !venueRows || !venueSeatsPerRow) {
      return res.status(400).json({ error: "Invalid parameters" });
    }

    const batch = db.batch();
    let seatCount = 0;

    const SEAT_GAP_X = 34;
    const SEAT_GAP_Y = 34;
    const PADDING_LEFT = 50;
    const PADDING_TOP = 70;
    const SEAT_RADIUS = 12;

    for (let row = 1; row <= venueRows; row++) {
      let ticketType = "Standard";
      if (Array.isArray(ticketTypes)) {
        const match = ticketTypes.find(t => t.rows && t.rows.includes(row));
        if (match) ticketType = match.type;
      }

      for (let seat = 1; seat <= venueSeatsPerRow; seat++) {
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

    res.json({ success: true, seatCount });
  } catch (error) {
    console.error("[SEATS] Error initializing seats:", error);
    res.status(500).json({ error: "Failed to initialize seats" });
  }
};
