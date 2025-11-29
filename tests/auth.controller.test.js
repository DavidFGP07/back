const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const { prisma } = require('../src/db');

describe('AuthController - login', () => {
  beforeEach(async () => {
    // Limpiamos base
    await prisma.reservation.deleteMany();
    await prisma.book.deleteMany();
    await prisma.user.deleteMany();

    // Creamos un usuario de prueba con password hasheada
    const hash = await bcrypt.hash('secreto123', 10);

    await prisma.user.create({
      data: {
        name: 'Usuario Prueba',
        email: 'test@example.com',
        password: hash,
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('debe hacer login exitosamente y devolver token (200)', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'secreto123',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('email', 'test@example.com');
    expect(res.body.user).not.toHaveProperty('password');
  });

  test('debe fallar si falta email o password (400)', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        // sin password
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'EMAIL_AND_PASSWORD_REQUIRED');
  });
});
