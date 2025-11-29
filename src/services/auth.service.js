const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prisma } = require('../db');

class AuthService {
  async login(email, password) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const payload = {
      id: user.id,
      email: user.email,
      canCreateBooks: user.canCreateBooks,
      canUpdateBooks: user.canUpdateBooks,
      canDisableBooks: user.canDisableBooks,
      canUpdateUsers: user.canUpdateUsers,
      canDisableUsers: user.canDisableUsers,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    // No devolvemos el password
    const { password: _, ...safeUser } = user;

    return { token, user: safeUser };
  }
}

const authService = new AuthService();

module.exports = { AuthService, authService };
