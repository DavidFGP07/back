const { reservationService } = require('../services/reservation.service');

class ReservationController {
  // POST /reservations  (crear reserva) – requiere auth
  async create(req, res) {
    try {
      const user = req.user; // viene del authMiddleware
      const { bookId } = req.body;

      if (!bookId) {
        return res.status(400).json({ error: 'BOOK_ID_REQUIRED' });
      }

      const reservation = await reservationService.createReservation(
        user.id,
        Number(bookId)
      );

      return res.status(201).json(reservation);
    } catch (err) {
      if (err.message === 'BOOK_NOT_FOUND') {
        return res.status(404).json({ error: 'BOOK_NOT_FOUND' });
      }
      if (err.message === 'BOOK_NOT_AVAILABLE') {
        return res.status(409).json({ error: 'BOOK_NOT_AVAILABLE' });
      }

      console.error(err);
      return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }
  }

  // POST /reservations/:id/deliver  (marcar reserva como entregada)
  async deliver(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'INVALID_ID' });
      }

      const result = await reservationService.deliverReservation(id);
      return res.status(200).json(result);
    } catch (err) {
      if (err.message === 'RESERVATION_NOT_FOUND') {
        return res.status(404).json({ error: 'RESERVATION_NOT_FOUND' });
      }
      if (err.message === 'ALREADY_DELIVERED') {
        return res.status(400).json({ error: 'ALREADY_DELIVERED' });
      }

      console.error(err);
      return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }
  }

  // GET /reservations/book/:bookId  (historial de un libro)
  async getByBook(req, res) {
    try {
      const bookId = parseInt(req.params.bookId, 10);
      if (Number.isNaN(bookId)) {
        return res.status(400).json({ error: 'INVALID_BOOK_ID' });
      }

      const history = await reservationService.getReservationsByBook(bookId);
      return res.status(200).json(history);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }
  }

  // GET /reservations/user/:userId  (historial de un usuario)
  async getByUser(req, res) {
    try {
      const userId = parseInt(req.params.userId, 10);
      if (Number.isNaN(userId)) {
        return res.status(400).json({ error: 'INVALID_USER_ID' });
      }

      const authUser = req.user;
      const isSelf = authUser.id === userId;
      const canViewOthers = authUser.canUpdateUsers;

      if (!isSelf && !canViewOthers) {
        return res.status(403).json({ error: 'FORBIDDEN' });
      }

      const history = await reservationService.getReservationsByUser(userId);
      return res.status(200).json(history);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }
  }
}

const reservationController = new ReservationController();

module.exports = { ReservationController, reservationController };
