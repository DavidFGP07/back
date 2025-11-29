const { bookService } = require('../services/book.service');

class BookController {
  // POST /books (requiere permiso canCreateBooks)
  async create(req, res) {
    try {
      const user = req.user;

      if (!user || !user.canCreateBooks) {
        return res.status(403).json({ error: 'FORBIDDEN' });
      }

      const { title, author, genre, publisher, publishedAt, isAvailable } =
        req.body;

      if (!title || !author || !genre || !publisher || !publishedAt) {
        return res.status(400).json({ error: 'MISSING_REQUIRED_FIELDS' });
      }

      const book = await bookService.createBook({
        title,
        author,
        genre,
        publisher,
        publishedAt,
        isAvailable,
      });

      return res.status(201).json(book);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }
  }

  // GET /books/:id  (NO requiere auth)
  async getOne(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'INVALID_ID' });
      }

      const includeInactive = req.query.includeInactive === 'true';

      const book = await bookService.getBookById(id, { includeInactive });
      if (!book) {
        return res.status(404).json({ error: 'BOOK_NOT_FOUND' });
      }

      return res.status(200).json(book);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }
  }

  // GET /books  (NO requiere auth)
  async getMany(req, res) {
    try {
      const result = await bookService.getBooks(req.query);
      return res.status(200).json(result);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }
  }

  // PUT /books/:id (requiere permiso canUpdateBooks)
  async update(req, res) {
    try {
      const user = req.user;
      if (!user || !user.canUpdateBooks) {
        return res.status(403).json({ error: 'FORBIDDEN' });
      }

      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'INVALID_ID' });
      }

      const { title, author, genre, publisher, publishedAt, isAvailable } =
        req.body;

      const data = {};
      if (title) data.title = title;
      if (author) data.author = author;
      if (genre) data.genre = genre;
      if (publisher) data.publisher = publisher;
      if (publishedAt) data.publishedAt = new Date(publishedAt);
      if (typeof isAvailable !== 'undefined') data.isAvailable = isAvailable;

      if (Object.keys(data).length === 0) {
        return res.status(400).json({ error: 'NOTHING_TO_UPDATE' });
      }

      const book = await bookService.updateBook(id, data);
      return res.status(200).json(book);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }
  }

  // DELETE /books/:id (soft delete; requiere permiso canDisableBooks)
  async disable(req, res) {
    try {
      const user = req.user;
      if (!user || !user.canDisableBooks) {
        return res.status(403).json({ error: 'FORBIDDEN' });
      }

      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'INVALID_ID' });
      }

      const book = await bookService.disableBook(id);
      return res.status(200).json(book);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }
  }
}

const bookController = new BookController();

module.exports = { BookController, bookController };
