// src/routes/auth.routes.js
const { Router } = require('express');
const { authController } = require('../controllers/auth.controller');

const router = Router();

router.post('/login', (req, res) => authController.login(req, res));

module.exports = router;