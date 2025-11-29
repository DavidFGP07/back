// src/routes/reservation.routes.js
const { Router } = require('express');
const { reservationController } = require('../controllers/reservation.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = Router();

// Todas protegidas
router.post('/', authMiddleware, (req, res) =>
  reservationController.create(req, res)
);

router.post('/:id/deliver', authMiddleware, (req, res) =>
  reservationController.deliver(req, res)
);

router.get('/book/:bookId', authMiddleware, (req, res) =>
  reservationController.getByBook(req, res)
);

router.get('/user/:userId', authMiddleware, (req, res) =>
  reservationController.getByUser(req, res)
);

module.exports = router;