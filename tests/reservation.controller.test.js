const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const { prisma } = require('../src/db');

describe('ReservationController', () => {
  let userToken;
  let adminToken;
  let user;
  let admin;
  let book;

  beforeAll(async () => {
    // Limpiar base
    await prisma.reservation.deleteMany();
    await prisma.book.deleteMany();
    await prisma.user.deleteMany();

    const hash = await bcrypt.hash('secreto123', 10);

    // Usuario normal
    user = await prisma.user.create({
      data: {
        name: 'Usuario Normal',
        email: 'user@example.com',
        password: hash,
        isActive: true,
      },
    });

    // Usuario con permisos (para ver historial de otros usuarios)
    admin = await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@example.com',
        password: hash,
        isActive: true,
        canUpdateUsers: true, // lo usamos como permiso para ver historial de otros
      },
    });

    // Un libro disponible
    book = await prisma.book.create({
      data: {
        title: 'Libro Reservable',
        author: 'Autor X',
        genre: 'Novela',
        publisher: 'Editorial X',
        publishedAt: new Date('2020-01-01'),
        isAvailable: true,
        isActive: true,
      },
    });

    // Login de usuario normal
    const loginUser = await request(app)
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'secreto123' });

    userToken = loginUser.body.token;

    // Login de admin
    const loginAdmin = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'secreto123' });

    adminToken = loginAdmin.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('POST /reservations debe crear una reserva (201)', async () => {
    const res = await request(app)
      .post('/reservations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ bookId: book.id });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('bookTitle', 'Libro Reservable');
    // libro debería pasar a no disponible
    const updatedBook = await prisma.book.findUnique({ where: { id: book.id } });
    expect(updatedBook.isAvailable).toBe(false);
  });

  test('POST /reservations debe fallar con 400 si falta bookId', async () => {
    const res = await request(app)
      .post('/reservations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'BOOK_ID_REQUIRED');
  });

  test('POST /reservations/:id/deliver debe marcar como entregada (200)', async () => {
    // Creamos una reserva nueva para entregar
    const newBook = await prisma.book.create({
      data: {
        title: 'Libro Para Entregar',
        author: 'Autor Y',
        genre: 'Ciencia',
        publisher: 'Editorial Y',
        publishedAt: new Date('2021-01-01'),
        isAvailable: true,
        isActive: true,
      },
    });

    const reservation = await prisma.reservation.create({
      data: {
        userId: user.id,
        bookId: newBook.id,
      },
    });

    const res = await request(app)
      .post(`/reservations/${reservation.id}/deliver`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('deliveredAt');

    const updatedBook = await prisma.book.findUnique({ where: { id: newBook.id } });
    expect(updatedBook.isAvailable).toBe(true);
  });

  test('POST /reservations/:id/deliver debe fallar si la reserva no existe (404)', async () => {
    const res = await request(app)
      .post(`/reservations/999999/deliver`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error', 'RESERVATION_NOT_FOUND');
  });

  test('GET /reservations/book/:bookId debe devolver historial de un libro (200)', async () => {
    const res = await request(app)
      .get(`/reservations/book/${book.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // si hay reservas, deben tener userName
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('userName');
      expect(res.body[0]).toHaveProperty('reservedAt');
    }
  });

  test('GET /reservations/book/:bookId debe fallar con 400 si bookId no es número', async () => {
    const res = await request(app)
      .get('/reservations/book/abc')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'INVALID_BOOK_ID');
  });

  test('GET /reservations/user/:userId permite que el usuario vea su propio historial (200)', async () => {
    const res = await request(app)
      .get(`/reservations/user/${user.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /reservations/user/:userId debe devolver 403 si otro usuario sin permisos intenta ver historial', async () => {
    // Creamos otro usuario sin permisos
    const hash = await bcrypt.hash('otro123', 10);
    const otherUser = await prisma.user.create({
      data: {
        name: 'Otro Usuario',
        email: 'other@example.com',
        password: hash,
        isActive: true,
      },
    });

    const loginOther = await request(app)
      .post('/auth/login')
      .send({ email: 'other@example.com', password: 'otro123' });

    const otherToken = loginOther.body.token;

    const res = await request(app)
      .get(`/reservations/user/${user.id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('error', 'FORBIDDEN');
  });

  test('GET /reservations/user/:userId permite que admin vea historial de otros (200)', async () => {
    const res = await request(app)
      .get(`/reservations/user/${user.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
