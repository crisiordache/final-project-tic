const Stripe = require("stripe");
const { createCheckoutSession, finalizeCheckoutSession } = require("../services/stripeCheckoutService");

function buildStripeEvent(req) {
  const signature = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (signature && webhookSecret && secretKey) {
    const stripe = new Stripe(secretKey);
    return stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  }

  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : req.body;
  return typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;
}

const handleStripeWebhook = async (req, res) => {
  try {
    const event = buildStripeEvent(req);
    console.log(`[WEBHOOK] Received event type: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log(`[WEBHOOK] Processing checkout session: ${session.id}`);
      await finalizeCheckoutSession(session);
      console.log(`[WEBHOOK] Successfully finalized session: ${session.id}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error.message);
    res.status(500).json({ error: error.message || "Webhook failed" });
  }
};

const createSession = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { eventId, bookingId, tickets } = req.body;

    const result = await createCheckoutSession({
      eventId,
      userId,
      bookingId,
      tickets: Array.isArray(tickets) ? tickets : []
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("create-checkout-session:", error.message);
    res.status(400).json({ error: error.message });
  }
};

const verifySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const admin = require("../firebaseAdmin");
    const db = admin.firestore();

    // Look up booking by stripeCheckoutSessionId field (the doc ID is a random bookingId, not the session ID)
    const bookingQuery = await db.collection("bookings")
      .where("stripeCheckoutSessionId", "==", sessionId)
      .limit(1)
      .get();
    let bookingExists = !bookingQuery.empty;
    let bookingData = bookingExists ? bookingQuery.docs[0].data() : null;

    // If payment was successful but booking isn't confirmed yet, trigger finalization
    if (session.payment_status === "paid" && (!bookingExists || bookingData?.status !== "confirmed")) {
      try {
        console.log(`[VERIFY] Payment successful, triggering finalization for session: ${sessionId}`);
        await finalizeCheckoutSession(session);
        // Re-query after finalization
        const updatedQuery = await db.collection("bookings")
          .where("stripeCheckoutSessionId", "==", sessionId)
          .limit(1)
          .get();
        bookingExists = !updatedQuery.empty;
        bookingData = bookingExists ? updatedQuery.docs[0].data() : null;
      } catch (finalizeError) {
        console.error(`[VERIFY] Error finalizing session: ${finalizeError.message}`);
      }
    }

    const isConfirmed = bookingData?.status === "confirmed";

    res.status(200).json({
      sessionId: session.id,
      status: session.payment_status,
      amountTotal: session.amount_total,
      currency: session.currency,
      metadata: session.metadata,
      bookingCreated: bookingExists,
      bookingStatus: bookingData?.status || null,
      message: 
        session.payment_status === "paid" && isConfirmed
          ? "✓ Payment received and ticket confirmed successfully!"
          : session.payment_status === "paid" && !isConfirmed
          ? "⏳ Payment received, finalizing your booking..."
          : "⏳ Payment still processing"
    });
  } catch (error) {
    console.error("verify-session error:", error.message);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  handleStripeWebhook,
  createSession,
  verifySession
};
