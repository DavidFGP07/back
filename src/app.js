const express = require('express');
const userRoutes = require('./routes/user.routes');
const authRoutes = require('./routes/auth.routes');
const bookRoutes = require('./routes/book.routes');
const reservationRoutes = require('./routes/reservation.routes');

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/users', userRoutes);
app.use('/auth', authRoutes);
app.use('/books', bookRoutes);
app.use('/reservations', reservationRoutes);

module.exports = app;