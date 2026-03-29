# Payment Verification Guide

## How the Payment Flow Works

1. **User clicks "Complete Purchase"** → Creates Stripe Checkout Session
2. **User completes Stripe payment** → Stripe redirects to `/my-bookings?session_id={ID}`
3. **Webhook receives confirmation** → Backend creates booking
4. **My Bookings shows ticket** → User can download QR code

## The Problem: Why Your Payment Might Not Be Showing

**Most Common Cause**: The Stripe webhook is not configured in your Stripe Dashboard, so the backend never receives confirmation that payment succeeded.

---

## Step 1: Verify Your Environment Variables

Make sure your `.env` file (backend) has these set:

```
STRIPE_SECRET_KEY=sk_test_xxx...
STRIPE_PUBLISHABLE_KEY=pk_test_xxx...
STRIPE_WEBHOOK_SECRET=whsec_xxx...
FRONTEND_URL=http://localhost:5173
```

If you're missing `STRIPE_WEBHOOK_SECRET`, follow Step 2 below.

---

## Step 2: Configure the Stripe Webhook (CRITICAL)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **Webhooks**
3. Click **Add endpoint**
4. Enter your webhook URL:
   - **For local development**: `http://localhost:3000/api/payments/stripe/webhook`
   - **For production**: `https://yourdomain.com/api/payments/stripe/webhook`
5. Select events: **checkout.session.completed**
6. Click **Add endpoint**
7. Copy the **Signing secret** (starts with `whsec_`)
8. Add to your `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxx
   ```
9. **Restart your backend server**

---

## Step 3: Test Payment Flow

### Test Option A: Using the "Verify Payment" Button (Easiest)

1. Start a payment normally
2. Use **Stripe test card**: `4242 4242 4242 4242` (Expiry: 12/25, CVC: 123)
3. Complete payment
4. You'll be redirected to `/my-bookings` with a green notice
5. **Click "Verify Payment & Refresh"** button
6. See your payment status:
   - ✓ = Payment confirmed and booking created
   - ⏳ = Payment received, webhook still processing
   - ❌ = Problem with payment

### Test Option B: Using Stripe CLI (For Webhook Testing)

If local `/my-bookings` redirect doesn't work:

1. **Install Stripe CLI**: https://stripe.com/docs/stripe-cli
2. Run:
   ```bash
   stripe listen --forward-to localhost:3000/api/payments/stripe/webhook
   ```
3. Copy the webhook signing secret from the output→ set as `STRIPE_WEBHOOK_SECRET` in `.env`
4. In another terminal, manually test webhook:
   ```bash
   stripe trigger checkout.session.completed
   ```
5. Check your terminal for the webhook being received

---

## Step 4: Debug the Webhook

Now that you've added the verification button, you can see real-time status:

1. **After payment, you'll see a green notice** with a "Verify Payment & Refresh" button
2. **Click it** to check:
   - Whether Stripe received the payment
   - Whether booking was created
   - What stage your payment is in

The verification endpoint will show:
- `Payment received and ticket created successfully!` ✓
- `Payment received but booking not finalized yet. Waiting for webhook...` ⏳
- `Payment still processing` ⏳

---

## Step 5: Check Backend Logs

While testing, watch your backend console for these messages:

### **If webhook is working:**
```
[WEBHOOK] Received event type: checkout.session.completed
[WEBHOOK] Processing checkout session: cs_test_xxx
[WEBHOOK] Successfully finalized session: cs_test_xxx
```

### **If webhook is NOT being received:**
- Nothing will appear in logs
- Your payment button is not configured in Stripe Dashboard

### **If payment doesn't match tickets:**
```
Error: Event not found
Error: Not enough tickets available
```

---

## Step 6: Common Issues & Solutions

### Issue: "Webhook failed" or "No 200 response"

**Solution**: Make sure your backend is running and accessible:
```bash
# Test from frontend or curl:
curl -X POST http://localhost:3000/api/payments/stripe/webhook \
  -H "Content-Type: application/json" \
  -d "{}"
# Should return: {"received":true}
```

---

### Issue: Payment shows "paid" but booking still not created

**Possible causes**:
- Webhook fired but event data was invalid
- Check backend logs for errors
- Wait 5-10 seconds and refresh (sometimes Firestore sync is slow)

**Solution**: 
- Try the "Verify Payment & Refresh" button
- Check Stripe Dashboard → Payments to see the session details
- Manually review Firestore `bookings` collection

---

### Issue: Still no redirect to `/my-bookings` after payment

**Solution**:
- Make sure `FRONTEND_URL=http://localhost:5173` is set in `.env`
- Browser must allow redirects (check browser console for any warnings)
- Try a different browser/private window (cache issues)

---

## Step 7: Database structure to verify

After payment succeeds, your Firestore should have:

**Collections**:
- `bookings` collection should contain a new document with ID = Stripe Session ID
- The booking should have:
  - `status: "confirmed"`
  - `payment.status: "confirmed"`
  - `tickets: [{type, quantity, priceAtPurchase}]`
  - `qrCode: "QR_xxx_xxx"`

---

## Quick Verification Checklist

Before and after testing, verify:

- [ ] `.env` has `STRIPE_SECRET_KEY` 
- [ ] `.env` has `STRIPE_WEBHOOK_SECRET` (from Stripe Dashboard)
- [ ] Stripe Dashboard → Webhooks shows your endpoint configured
- [ ] Backend is running: `npm start` in `/backend`
- [ ] Frontend is running: `npm run dev` in `/frontend`
- [ ] Use Stripe test card: `4242 4242 4242 4242`
- [ ] Backend logs show `[WEBHOOK]` messages when you complete payment
- [ ] Use the "Verify Payment & Refresh" button to confirm status

---

## Need Help?

Check these resources:

1. **Stripe Webhook Documentation**: https://stripe.com/docs/webhooks
2. **Stripe Test Cards**: https://stripe.com/docs/testing#cards
3. **Backend logs** for `[WEBHOOK]` messages
4. **Browser DevTools** → Network tab to see the checkout session creation and redirect
5. **Stripe Dashboard** → Developers → Webhooks → View logs
