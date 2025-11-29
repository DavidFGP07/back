const request = require('supertest');
const app = require('../src/app');
const { prisma } = require('../src/db');
const bcrypt = require('bcrypt');

describe('BookController', () => {
  let tokenWithCreatePermission;
  let tokenWithoutPermission;

  beforeAll(async () => {
    // limpiar todo
    await prisma.reservation.deleteMany();
    await prisma.book.deleteMany();
    await prisma.user.deleteMany();

    const passwordHash = await bcrypt.hash('secreto123', 10);

    // usuario con permisos para crear libros
    const admin = await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@example.com',
        password: passwordHash,
        isActive: true,
        canCreateBooks: true,
      },
    });

    // usuario sin permisos
    const normalUser = await prisma.user.create({
      data: {
        name: 'User',
        email: 'user@example.com',
        password: passwordHash,
        isActive: true,
      },
    });

    // login de ambos para obtener token
    const loginAdmin = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'secreto123' });

    tokenWithCreatePermission = loginAdmin.body.token;

    const loginUser = await request(app)
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'secreto123' });

    tokenWithoutPermission = loginUser.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('GET /books debe devolver lista paginada de títulos (200)', async () => {
    // preparamos algunos libros
    await prisma.book.createMany({
      data: [
        {
          title: 'Libro A',
          author: 'Autor 1',
          genre: 'Novela',
          publisher: 'Editorial X',
          publishedAt: new Date('2020-01-01'),
        },
        {
          title: 'Libro B',
          author: 'Autor 2',
          genre: 'Ciencia',
          publisher: 'Editorial Y',
          publishedAt: new Date('2021-01-01'),
        },
      ],
    });

    const res = await request(app).get('/books?page=1&pageSize=10');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('books');
    expect(Array.isArray(res.body.books)).toBe(true);
    // cada libro solo debería tener "title"
    if (res.body.books.length > 0) {
      expect(res.body.books[0]).toHaveProperty('title');
      expect(Object.keys(res.body.books[0])).toEqual(['title']);
    }
  });

  test('POST /books debe crear un libro si el usuario tiene permiso (201)', async () => {
    const res = await request(app)
      .post('/books')
      .set('Authorization', `Bearer ${tokenWithCreatePermission}`)
      .send({
        title: 'Nuevo Libro',
        author: 'Alguien',
        genre: 'Ensayo',
        publisher: 'Editorial Z',
        publishedAt: '2022-01-01',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('title', 'Nuevo Libro');
  });

  test('POST /books debe fallar con 400 si faltan campos requeridos', async () => {
    const res = await request(app)
      .post('/books')
      .set('Authorization', `Bearer ${tokenWithCreatePermission}`)
      .send({
        // falta author, genre, publisher, publishedAt
        title: 'Incompleto',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'MISSING_REQUIRED_FIELDS');
  });

  test('POST /books debe fallar con 403 si el usuario NO tiene permiso', async () => {
    const res = await request(app)
      .post('/books')
      .set('Authorization', `Bearer ${tokenWithoutPermission}`)
      .send({
        title: 'Libro Prohibido',
        author: 'X',
        genre: 'Y',
        publisher: 'Z',
        publishedAt: '2022-01-01',
      });

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('error', 'FORBIDDEN');
  });
});
