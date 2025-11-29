const { authService } = require('../services/auth.service');

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: 'EMAIL_AND_PASSWORD_REQUIRED' });
      }

      const result = await authService.login(email, password);
      return res.status(200).json(result);
    } catch (err) {
      if (err.message === 'INVALID_CREDENTIALS') {
        return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
      }

      console.error(err);
      return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }
  }
}

const authController = new AuthController();

module.exports = { AuthController, authController };
