const { prisma } = require('../db');

class BookService {
  async createBook(data) {
    const book = await prisma.book.create({
      data: {
        title: data.title,
        author: data.author,
        genre: data.genre,
        publisher: data.publisher,
        publishedAt: new Date(data.publishedAt),
        isAvailable: data.isAvailable ?? true,
      },
    });
    return book;
  }

  // READ 1 libro (por defecto excluye inactivos)
  async getBookById(id, { includeInactive = false } = {}) {
    const book = await prisma.book.findUnique({
      where: { id },
    });

    if (!book) return null;
    if (!includeInactive && !book.isActive) return null;

    return book;
  }

  // READ * libros con filtros + paginación + solo nombres
  async getBooks(filters) {
    const {
      page = 1,
      pageSize = 10,
      genre,
      author,
      publisher,
      title,
      isAvailable,
      includeInactive = false,
      publishedFrom,
      publishedTo,
    } = filters;

    const pageNum = parseInt(page, 10) || 1;
    const sizeNum = parseInt(pageSize, 10) || 10;

    const where = {};

    if (!includeInactive) {
      where.isActive = true;
    }

    if (genre) {
      where.genre = genre;
    }

    if (author) {
      where.author = { contains: author, mode: 'insensitive' };
    }

    if (publisher) {
      where.publisher = { contains: publisher, mode: 'insensitive' };
    }

    if (title) {
      where.title = { contains: title, mode: 'insensitive' };
    }

    if (typeof isAvailable !== 'undefined') {
      where.isAvailable = isAvailable === 'true' || isAvailable === true;
    }

    if (publishedFrom || publishedTo) {
      where.publishedAt = {};
      if (publishedFrom) {
        where.publishedAt.gte = new Date(publishedFrom);
      }
      if (publishedTo) {
        where.publishedAt.lte = new Date(publishedTo);
      }
    }

    const total = await prisma.book.count({ where });

    const books = await prisma.book.findMany({
      where,
      skip: (pageNum - 1) * sizeNum,
      take: sizeNum,
      orderBy: { title: 'asc' },
      select: {
        title: true, // 👈 solo nombre de los libros
      },
    });

    const maxPage = Math.max(1, Math.ceil(total / sizeNum));

    return {
      page: pageNum,
      pageSize: sizeNum,
      maxPage,
      total,
      books, // [{ title: '...' }, ...]
    };
  }

  // UPDATE libro (modifica info o disponibilidad)
  async updateBook(id, data) {
    const book = await prisma.book.update({
      where: { id },
      data,
    });
    return book;
  }

  // SOFT DELETE libro
  async disableBook(id) {
    const book = await prisma.book.update({
      where: { id },
      data: { isActive: false },
    });
    return book;
  }
}

const bookService = new BookService();

module.exports = { BookService, bookService };
