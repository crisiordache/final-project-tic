const admin = require('firebase-admin');
const db = admin.firestore();

class Event {
  static async getAll(showAll = false) {
    let query = db.collection('events');
    if(!showAll) {
      query = query.where('isActive', '==', true);
    }
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async getById(eventId) {
    const doc = await db.collection('events').doc(eventId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  static async create(data) {
    const docRef = await db.collection('events').doc();
    await docRef.set({
      ...data,
      eventId: docRef.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return docRef.id;
  }

  static async update(eventId, data) {
    await db.collection('events').doc(eventId).update({
      ...data,
    });
  }

  static async softDelete(eventId) {
    await db.collection('events').doc(eventId).update({ isActive: false});
  }

  static async restore(eventId) {
    await db.collection('events').doc(eventId).update({ isActive: true});
  }

  static async hardDelete(eventId) {
    await db.collection('events').doc(eventId).delete();
  }
}

module.exports = Event;