const bcrypt = require('bcrypt');
const { prisma } = require('../db');

class UserService {
  async registerUser(data) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }

    const hash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hash,
      },
    });

    const { password, ...safeUser } = user;
    return safeUser;
  }

  // READ User (uno) – excluye inactivos por defecto
  async getUserById(id, { includeInactive = false } = {}) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;
    if (!includeInactive && !user.isActive) return null;

    const { password, ...safeUser } = user;
    return safeUser;
  }

  // UPDATE User (solo datos básicos; el hash de password se podría manejar aparte)
  async updateUser(id, data) {
    const user = await prisma.user.update({
      where: { id },
      data,
    });

    const { password, ...safeUser } = user;
    return safeUser;
  }

  // SOFT DELETE User
  async disableUser(id) {
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    const { password, ...safeUser } = user;
    return safeUser;
  }
}

const userService = new UserService();

module.exports = { UserService, userService };
