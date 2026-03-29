require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const bookingRoutes = require('./routes/bookings');
const venueRoutes = require('./routes/venues');
const paymentsController = require('./controllers/payments');
const paymentRoutes = require('./routes/payments');
const seatsRoutes = require('./routes/seats');

const app = express();

app.post(
  '/api/payments/stripe/webhook',
  express.raw({ type: 'application/json' }),
  paymentsController.handleStripeWebhook
);
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

app.use('/api/users', userRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/bookings', seatsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
});