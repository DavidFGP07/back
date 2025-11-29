const { Router } = require('express');
const { bookController } = require('../controllers/book.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const router = Router();

// Públicos
router.get('/', (req, res) => bookController.getMany(req, res));
router.get('/:id', (req, res) => bookController.getOne(req, res));

// Protegidos
router.post('/', authMiddleware, (req, res) =>
  bookController.create(req, res)
);

router.put('/:id', authMiddleware, (req, res) =>
  bookController.update(req, res)
);

router.delete('/:id', authMiddleware, (req, res) =>
  bookController.disable(req, res)
);

module.exports = router;
