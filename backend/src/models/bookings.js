const admin = require('firebase-admin');
const db = admin.firestore();

class Booking {
  static async create(data) {
    const docRef = db.collection('bookings').doc();
    const paymentInput = data.payment || {};
    const withCard = paymentInput.method === 'card';
    const bookingData = {
      ...data,
      bookingId: docRef.id,
      status: 'confirmed',
      payment: {
        ...paymentInput,
        status: withCard ? 'confirmed' : 'pending',
        date: withCard
          ? admin.firestore.FieldValue.serverTimestamp()
          : (paymentInput.date ?? null)
      },
      qrCode: `QR_${docRef.id}_${data.userId}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await docRef.set(bookingData);
    return bookingData;
  }

  static async getByUserId(userId) {
    if (userId == null) return [];
    const snapshot = await db
      .collection('bookings')
      .where('userId', '==', userId)
      .get();

    function createdAtMs(data) {
      const c = data.createdAt;
      if (!c) return 0;
      if (typeof c.toMillis === 'function') return c.toMillis();
      if (c._seconds != null) return c._seconds * 1000;
      if (c.seconds != null) return c.seconds * 1000;
      return 0;
    }

    const rows = snapshot.docs.map((doc) => doc.data());
    rows.sort((a, b) => createdAtMs(b) - createdAtMs(a));
    return rows;
  }
}

module.exports = Booking