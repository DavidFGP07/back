const request = require('supertest');
const app = require('../src/app');
const { prisma } = require('../src/db');

describe('UserController - register', () => {
  // Limpia la tabla de usuarios antes de cada test (para evitar conflictos de email)
  beforeEach(async () => {
    await prisma.reservation.deleteMany(); // por si ya usaste reservas
    await prisma.book.deleteMany();
    await prisma.user.deleteMany();
  });

  // Cerrar conexión de Prisma al final para que Jest no se queje
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('debe registrar un usuario exitosamente (201)', async () => {
    const res = await request(app)
      .post('/users')
      .send({
        name: 'David',
        email: 'david@example.com',
        password: 'secreto123',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email', 'david@example.com');
    expect(res.body).not.toHaveProperty('password'); // no debe venir el password
  });

  test('debe fallar si falta algún campo requerido (400)', async () => {
    const res = await request(app)
      .post('/users')
      .send({
        // falta name y password
        email: 'incompleto@example.com',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'NAME_EMAIL_PASSWORD_REQUIRED');
  });
});
