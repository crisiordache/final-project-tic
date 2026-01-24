const admin = require('firebase-admin');
const db = admin.firestore();

class Booking {
  static async create(data) {
    const docRef = db.collection('bookings').doc();
    const withCard = data.payment.method === 'card';
    const bookingData = {
      ...data,
      bookingId: docRef.id,
      status: 'confirmed',
      payment: {
        status: withCard ? 'confirmed' : 'pending',
        date: withCard ? admin.firestore.FieldValue.serverTimestamp() : null
      },
      qrCode: `QR_${docRef.id}_${data.userId}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await docRef.set(bookingData);
    return bookingData;
  }

  static async getByUserId(userId) {
    const snapshot = await db.collection('bookings')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map(doc => doc.data());
  }
}

module.exports = Booking