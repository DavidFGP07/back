const { prisma } = require('../db');

class ReservationService {
  // Crear una reserva para un usuario y un libro
  async createReservation(userId, bookId) {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book || !book.isActive) {
      throw new Error('BOOK_NOT_FOUND');
    }

    if (!book.isAvailable) {
      throw new Error('BOOK_NOT_AVAILABLE');
    }

    // Crear la reserva
    const reservation = await prisma.reservation.create({
      data: {
        userId,
        bookId,
        // reservedAt se pone por default (now()) en el schema
      },
      include: {
        user: true,
        book: true,
      },
    });

    // Marcar el libro como no disponible mientras está reservado
    await prisma.book.update({
      where: { id: bookId },
      data: { isAvailable: false },
    });

    return {
      id: reservation.id,
      userName: reservation.user.name,
      bookTitle: reservation.book.title,
      reservedAt: reservation.reservedAt,
      deliveredAt: reservation.deliveredAt,
    };
  }

  // Marcar una reserva como entregada
  async deliverReservation(reservationId) {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new Error('RESERVATION_NOT_FOUND');
    }

    if (reservation.deliveredAt) {
      throw new Error('ALREADY_DELIVERED');
    }

    const updated = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        deliveredAt: new Date(),
      },
      include: {
        user: true,
        book: true,
      },
    });

    // Volver el libro a disponible
    await prisma.book.update({
      where: { id: updated.bookId },
      data: { isAvailable: true },
    });

    return {
      id: updated.id,
      userName: updated.user.name,
      bookTitle: updated.book.title,
      reservedAt: updated.reservedAt,
      deliveredAt: updated.deliveredAt,
    };
  }

  // Historial de un libro
  async getReservationsByBook(bookId) {
    const reservations = await prisma.reservation.findMany({
      where: { bookId },
      orderBy: { reservedAt: 'desc' },
      include: {
        user: true,
      },
    });

    return reservations.map((r) => ({
      id: r.id,
      userName: r.user.name,
      reservedAt: r.reservedAt,
      deliveredAt: r.deliveredAt,
    }));
  }

  // Historial de un usuario
  async getReservationsByUser(userId) {
    const reservations = await prisma.reservation.findMany({
      where: { userId },
      orderBy: { reservedAt: 'desc' },
      include: {
        book: true,
      },
    });

    return reservations.map((r) => ({
      id: r.id,
      bookTitle: r.book.title,
      reservedAt: r.reservedAt,
      deliveredAt: r.deliveredAt,
    }));
  }
}

const reservationService = new ReservationService();

module.exports = { ReservationService, reservationService };
