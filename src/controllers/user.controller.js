const { userService } = require('../services/user.service');

class UserController {
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res
          .status(400)
          .json({ error: 'NAME_EMAIL_PASSWORD_REQUIRED' });
      }

      const user = await userService.registerUser({ name, email, password });
      return res.status(201).json(user);
    } catch (err) {
      if (err.message === 'EMAIL_ALREADY_EXISTS') {
        return res.status(409).json({ error: 'EMAIL_ALREADY_EXISTS' });
      }

      console.error(err);
      return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }
  }

  // GET /users/:id  (seguro)
  async getUser(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'INVALID_ID' });
      }

      const user = await userService.getUserById(id);
      if (!user) {
        return res.status(404).json({ error: 'USER_NOT_FOUND' });
      }

      return res.status(200).json(user);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }
  }

  // PUT /users/:id  (update propio o con permiso)
  async update(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'INVALID_ID' });
      }

      const authUser = req.user; // viene del authMiddleware

      const isSelf = authUser.id === id;
      const canUpdateOthers = authUser.canUpdateUsers;

      if (!isSelf && !canUpdateOthers) {
        return res.status(403).json({ error: 'FORBIDDEN' });
      }

      const { name, email } = req.body;
      if (!name && !email) {
        return res.status(400).json({ error: 'NOTHING_TO_UPDATE' });
      }

      const data = {};
      if (name) data.name = name;
      if (email) data.email = email;

      const user = await userService.updateUser(id, data);
      return res.status(200).json(user);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }
  }

  // DELETE /users/:id  (soft delete propio o con permiso)
  async disable(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'INVALID_ID' });
      }

      const authUser = req.user;

      const isSelf = authUser.id === id;
      const canDisableOthers = authUser.canDisableUsers;

      if (!isSelf && !canDisableOthers) {
        return res.status(403).json({ error: 'FORBIDDEN' });
      }

      const user = await userService.disableUser(id);
      return res.status(200).json(user);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }
  }
}

const userController = new UserController();

module.exports = { UserController, userController };
