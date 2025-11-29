// src/routes/user.routes.js
const { Router } = require('express');
const { userController } = require('../controllers/user.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = Router();

// Registro público
router.post('/', (req, res) => userController.register(req, res));

// Protegidas
router.get('/:id', authMiddleware, (req, res) =>
  userController.getUser(req, res)
);

router.put('/:id', authMiddleware, (req, res) =>
  userController.update(req, res)
);

router.delete('/:id', authMiddleware, (req, res) =>
  userController.disable(req, res)
);

module.exports = router;